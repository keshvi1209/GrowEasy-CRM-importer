# GrowEasy CSV → CRM Importer

An AI-powered importer that turns any lead CSV — Facebook Lead Ads, Google Ads exports,
Excel sheets, real-estate CRM exports, sales reports, or a manually made spreadsheet —
into clean, standardized GrowEasy CRM records, regardless of column names or layout.

The hard problem here isn't parsing CSV. It's **schema mapping**: every source names its
columns differently ("Customer" vs "Full Name" vs "Contact Person" all mean `name`). This
project solves that with an LLM-driven extraction layer, backed by deterministic
validation so the AI's guesses never silently corrupt the CRM.

## Live demo / repo

- Frontend: `<add your deployed URL here>`
- Backend API: `<add your deployed URL here>`
- Repo: `<add your GitHub URL here>`

## Architecture

```
                         Next.js Frontend
┌──────────────────────────────────────────────────────────┐
│  Upload (drag & drop / picker)                            │
│        │  PapaParse (client-side, no network call)        │
│        ▼                                                  │
│  Preview table (sticky header, virtualized, scrollable)   │
│        │  user clicks "Confirm import"                    │
│        ▼                                                  │
│  POST /api/import  (multipart, the raw .csv file)         │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
                    Express Backend
┌──────────────────────────────────────────────────────────┐
│  multer (memory storage, size/type limits)                │
│        │                                                  │
│        ▼                                                  │
│  csvParser.ts        → Array<RawCsvRow> (header-agnostic) │
│        │                                                  │
│        ▼                                                  │
│  batchProcessor.ts   → chunk into batches of N rows        │
│        │                p-limit bounded concurrency        │
│        ▼                                                  │
│  aiService.ts         → Gemini (Google Generative AI API) │
│        │                 structured JSON per batch         │
│        │                 retries with exponential backoff  │
│        ▼                                                  │
│  validators.ts        → re-validate every AI field         │
│        │                 (regex email, digits-only phone,  │
│        │                  enum allowlists, parseable date) │
│        ▼                                                  │
│  Merge → { records[], skipped[], summary }                │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
                Result tables + CSV export in the frontend
```

This is essentially a small **ETL pipeline**:
- **Extract** — accept any CSV, without assuming its schema.
- **Transform** — an LLM plus deterministic validation maps arbitrary columns onto the
  fixed GrowEasy CRM schema.
- **Load** — return standardized records with clear statistics and skip reasons, ready to
  download as a CSV or feed into the real CRM.

## Tech stack

**Frontend** — Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Table/Virtual
(virtualized tables for large CSVs), react-dropzone (drag & drop), PapaParse (client-side
preview parsing), axios, react-hot-toast.

**Backend** — Node.js, Express, TypeScript, Multer (upload handling, in-memory), csv-parse,
Google Generative AI SDK (Gemini) for extraction, Zod-style manual validators, p-limit
(bounded AI concurrency), Jest for unit tests.

**AI** — Gemini (`gemini-2.5-flash` by default, configurable). The system prompt and field
mapping strategy live in `backend/src/prompts/crmPrompt.ts`.

## Repository layout

```
groweasy-csv-importer/
├── backend/
│   ├── src/
│   │   ├── controllers/importController.ts   # request handling
│   │   ├── routes/importRoutes.ts             # /api/import, /api/health
│   │   ├── services/csvParser.ts              # header-agnostic CSV parsing
│   │   ├── services/aiService.ts              # Gemini API wrapper
│   │   ├── services/batchProcessor.ts         # batching, concurrency, retries
│   │   ├── prompts/crmPrompt.ts               # the AI prompt engineering
│   │   ├── utils/validators.ts                # post-AI validation/sanitization
│   │   ├── middleware/upload.ts               # multer config
│   │   ├── middleware/errorHandler.ts         # centralized error handling
│   │   ├── types/index.ts                     # shared types + CRM schema
│   │   ├── __tests__/                         # Jest unit tests
│   │   └── server.ts                          # app entry point
│   ├── Dockerfile
│   └── .env.example
└── frontend/
    ├── app/page.tsx                            # main flow orchestration
    ├── app/layout.tsx                          # fonts, metadata, toaster
    ├── components/UploadBox.tsx                # drag & drop upload
    ├── components/CSVPreviewTable.tsx           # step 2: raw preview
    ├── components/DataTable.tsx                 # virtualized generic table
    ├── components/CRMTable.tsx                  # step 4: parsed CRM records
    ├── components/SkippedTable.tsx               # step 4: skipped rows + reasons
    ├── components/ImportSummary.tsx              # stat cards
    ├── components/LoadingOverlay.tsx             # staged progress UI
    ├── components/PipelineStepper.tsx            # Extract/Transform/Load rail
    ├── services/api.ts                           # backend API client
    ├── utils/csvExport.ts                        # download parsed CSV
    └── types/index.ts                            # shared types
```

## Getting started

### Prerequisites
- Node.js 18+
- A Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) — or
  swap in OpenAI/Anthropic by reimplementing `backend/src/services/aiService.ts` with the
  same `extractBatch(rows, startIndex)` signature.

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env and set GEMINI_API_KEY
npm install
npm run dev        # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# edit .env.local if your backend isn't on localhost:4000
npm install
npm run dev         # http://localhost:3000
```

Open `http://localhost:3000`, drop in a CSV, preview it, confirm, and you'll get back
mapped CRM records plus a skipped-rows breakdown, downloadable as a CSV.

### Running tests

```bash
cd backend
npm test
```

### Docker (backend)

```bash
cd backend
docker build -t groweasy-importer-backend .
docker run -p 4000:4000 --env-file .env groweasy-importer-backend
```

## AI prompt strategy

The system prompt (`backend/src/prompts/crmPrompt.ts`) does the heavy lifting:

1. **Explicit field-by-field mapping guidance** — for every CRM field, it lists the kinds
   of source-column names that should map to it (e.g. "Phone / Mobile / Contact / WhatsApp /
   Cell" → `mobile_without_country_code`), so the model isn't guessing from a bare schema.
2. **Hard constraints** stated as rules, not suggestions — allowed `crm_status` and
   `data_source` enums, "never invent data," "leave unknown fields blank."
3. **Structured JSON-only output**, one entry per input row, tagged with the row's original
   index — this lets the backend reconcile results even if the model reorders, merges, or
   silently drops a row.
4. **Explicit multi-value handling** — first email/phone wins, the rest get appended to
   `crm_note` rather than lost.
5. **Skip logic pushed into the prompt** — the model marks `skip: true` with a reason for
   rows with no email/phone, but the backend **never trusts this alone** (see below).

### Why validation happens twice

The AI is a strong guesser, not a source of truth. `backend/src/utils/validators.ts`
re-checks every field the model returns:
- Email against a regex; anything that fails is dropped to `""`.
- Phone stripped to digits-only.
- `crm_status` / `data_source` checked against the literal allowlists — anything outside
  it is blanked rather than trusted.
- Dates checked with `new Date(...)` — unparseable strings are blanked.
- Even the "must have email or phone" skip rule is re-enforced in code, independent of
  what the AI decided.

### Batching, concurrency, and failure handling

- Rows are chunked into batches (`BATCH_SIZE`, default 25) to stay within token limits and
  keep retries cheap.
- Batches run with bounded concurrency (`AI_CONCURRENCY`, default 3) via `p-limit`, so a
  10,000-row file doesn't fire thousands of parallel requests.
- Each batch retries up to `MAX_RETRIES` times with exponential backoff on malformed JSON
  or API errors.
- If a batch still fails after retries, its rows are marked skipped with a clear reason
  instead of silently disappearing — `Promise.allSettled` ensures one bad batch never
  takes down the rest of the import.
- Rows the model returns no verdict for at all (a partial/truncated response) are also
  surfaced as skipped, not lost.

## Assumptions

- "Primary" email/phone is whichever the AI judges first/most prominent per row; there's
  no assumption about column order in the source file.
- Dates are preserved as given (after a parseability check) rather than reformatted, since
  the only hard requirement is that `new Date(created_at)` succeeds.
- The importer is stateless — nothing is persisted server-side; the browser holds the
  result until the user downloads it or imports another file.

## Future improvements

- Streaming/incremental results (SSE or WebSocket) so the UI can render CRM rows as each
  batch completes, rather than waiting for the whole file.
- Duplicate detection (by email/phone) across a single import.
- A confidence score per field, with a review UI for low-confidence mappings before final
  import.
- Persisting import history in a database for auditing.

## Submission

- Position applied for: **`<Intern / Full-Time>`**
- Public app: `<link>`
- Public repo: `<link>`
