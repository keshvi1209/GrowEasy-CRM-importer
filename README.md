# GrowEasy CSV → CRM Importer

An AI-powered importer that turns any lead CSV — Facebook Lead Ads, Google Ads exports,
Excel-saved sheets, real-estate CRM exports, sales reports, or a manually made spreadsheet
— into clean, standardized GrowEasy CRM records, regardless of column names or layout.

The hard problem here isn't parsing CSV. It's **schema mapping**: every source names its
columns differently ("Customer" vs "Full Name" vs "Contact Person" all mean `name`). This
project solves that with an LLM-driven extraction layer, backed by deterministic
validation so the AI's guesses never silently corrupt the CRM.

## Contents

- [Features](#features)
- [Supported inputs & limits](#supported-inputs--limits)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [API reference](#api-reference)
- [Output schema](#output-schema)
- [AI prompt strategy](#ai-prompt-strategy)
- [Batching, concurrency, and failure handling](#batching-concurrency-and-failure-handling)
- [Configuration reference](#configuration-reference)
- [Troubleshooting](#troubleshooting)
- [Assumptions & known limitations](#assumptions--known-limitations)
- [Future improvements](#future-improvements)

## Features

- **Schema-agnostic mapping** — no column-mapping UI, no per-source parser; an LLM reads
  each row and maps it onto the fixed CRM schema regardless of header names or order.
- **Deterministic validation on top of the AI** — every AI-returned field is re-checked in
  code (email regex, digits-only phone, enum allowlists, date parseability) so a bad guess
  never reaches the CRM silently.
- **Handles large files without blocking** — imports run as a background job; the UI polls
  for progress instead of holding a single HTTP request open for minutes.
- **Nothing is silently dropped** — rows the AI skips, fails to return, or hallucinates are
  all surfaced in a "Skipped" table with a specific reason, never just missing.
- **Light/dark theme**, persisted per-browser, with no flash of the wrong theme on load.
- **Responsive layout** — usable from a phone up through a desktop, including the pipeline
  sidebar and virtualized data tables.
- **Stateless backend** — nothing is persisted to disk or a database; results live in the
  browser until downloaded.

## Supported inputs & limits

| | |
|---|---|
| **File type** | `.csv` only. Despite "Excel sheets" in the pitch above, this means a CSV *exported or saved from* Excel/Google Sheets — native `.xlsx`/`.xls` binaries are rejected. There's no spreadsheet-parsing library in the stack (no `xlsx`/`exceljs`), only a CSV parser (`csv-parse` on the backend, PapaParse for the client-side preview). |
| **Max file size** | **15 MB by default.** Enforced in two places that must be kept in sync: the backend rejects oversized uploads via Multer (`MAX_FILE_SIZE_MB`, `backend/.env`), and the frontend dropzone pre-emptively rejects them client-side before upload (`NEXT_PUBLIC_MAX_FILE_SIZE_MB`, `frontend/.env.local`). Raise both together if you need bigger files. |
| **Row count** | No hard cap in code. Rows are chunked into AI batches (`BATCH_SIZE`, default 100) and processed with bounded concurrency, so very large files just take longer rather than failing outright — see [Batching](#batching-concurrency-and-failure-handling). In practice you're bounded by your Gemini key's request quota (free tier caps requests *per day*) long before any code-level limit. |
| **Encoding** | UTF-8 assumed. A leading BOM is stripped, and stray zero-width/invisible Unicode characters commonly left behind by Excel/ad-platform exports are cleaned from every cell. Other encodings (e.g. Latin-1, UTF-16) aren't detected or transcoded. |
| **Columns/layout** | Arbitrary. Headers are read as-is and handed to the AI mapping layer untouched — no fixed schema is assumed at parse time. |

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
│        │  returns { jobId } immediately                   │
│        ▼                                                  │
│  GET /api/import/:jobId  (polled every 1.5s for progress) │
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
│  jobStore.ts           → in-memory job status + result     │
│                           (1hr TTL, no external DB)         │
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

**Frontend** — Next.js 14 (App Router), TypeScript, Tailwind CSS (class-based dark mode),
TanStack Table/Virtual (virtualized tables for large CSVs), react-dropzone (drag & drop),
PapaParse (client-side preview parsing), axios, react-hot-toast.

**Backend** — Node.js, Express, TypeScript, Multer (upload handling, in-memory), csv-parse,
Google Generative AI SDK (Gemini) for extraction, hand-written validators (no runtime
schema library), p-limit (bounded AI concurrency), Jest for unit tests.

**AI** — Gemini (`gemini-flash-latest` by default, configurable via `AI_MODEL`). This
points at whatever Gemini currently designates as its recommended flash model, so it keeps
working as Google retires dated snapshots (see [Troubleshooting](#troubleshooting)). The
system prompt and field-mapping strategy live in `backend/src/prompts/crmPrompt.ts`.

## Getting started

### Prerequisites
- Node.js 18+ (native `fetch` support is required by the Gemini SDK)
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

### Docker (backend only — the frontend isn't containerized)

```bash
cd backend
docker build -t groweasy-importer-backend .
docker run -p 4000:4000 --env-file .env groweasy-importer-backend
```

Or via the root `docker-compose.yml`, which wires up the same backend env vars:

```bash
GEMINI_API_KEY=your_key_here docker compose up --build
```

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check — `{ status: "ok", timestamp }`. |
| `POST` | `/api/import` | Multipart upload, field name `csv`. Returns `202` immediately with `{ jobId, totalRows, totalBatches }`; processing continues in the background. |
| `GET` | `/api/import/:jobId` | Poll for status: `{ status: "processing" \| "done" \| "error", totalRows, totalBatches, processedBatches, result?, error? }`. The frontend polls this every 1.5s. Jobs are kept in memory for 1 hour, then garbage-collected — polling an expired `jobId` returns `404`. |

## Output schema

Every imported row is normalized to this shape (`backend/src/types/index.ts`). All fields
are optional strings — the AI is instructed to leave a field blank rather than invent data:

| Field | Notes |
|---|---|
| `created_at` | Preserved as given if parseable (`new Date(...)` must succeed), not reformatted. |
| `name` | |
| `email` | Regex-validated; blanked if invalid. |
| `country_code` / `mobile_without_country_code` | Phone stripped to digits-only. |
| `company` / `city` / `state` / `country` | |
| `lead_owner` | |
| `crm_status` | One of `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`, or blank. Anything else the AI returns is blanked, not trusted. |
| `crm_note` | Also collects any secondary email/phone found in the row (see [AI prompt strategy](#ai-prompt-strategy)). |
| `data_source` | One of `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`, or blank. |
| `possession_time` | |
| `description` | |

A row is **skipped** (not imported) if it has neither a valid email nor phone after
validation — this rule is enforced in code independent of what the AI decides.

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

## Batching, concurrency, and failure handling

- Rows are chunked into batches (`BATCH_SIZE`, default 100) to stay within token limits and
  minimize AI request count — important since providers like Gemini's free tier cap
  requests *per day*, not just per minute.
- Batches run with bounded concurrency (`AI_CONCURRENCY`, default 6) via `p-limit`, so a
  10,000-row file doesn't fire hundreds of parallel requests.
- Imports run as a background job: `POST /api/import` returns a `jobId` immediately, and
  the client polls `GET /api/import/:jobId` for progress until it completes. This means
  large files aren't bound by a single HTTP request's lifetime/timeout.
- Each batch retries up to `MAX_RETRIES` times with exponential backoff on malformed JSON
  or API errors.
- If a batch still fails after retries, its rows are marked skipped with a clear reason
  instead of silently disappearing — `Promise.allSettled` ensures one bad batch never
  takes down the rest of the import.
- Rows the model returns no verdict for at all (a partial/truncated response) are also
  surfaced as skipped, not lost.

## Configuration reference

### Backend (`backend/.env`, see `backend/.env.example`)

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `4000` | |
| `NODE_ENV` | `development` | |
| `FRONTEND_ORIGIN` | — | Comma-separated allowed CORS origins. Must include wherever the frontend is actually served from. |
| `GEMINI_API_KEY` | — | **Required.** From [aistudio.google.com/apikey](https://aistudio.google.com/apikey). |
| `AI_MODEL` | `gemini-flash-latest` | See [Troubleshooting](#troubleshooting) before pinning this to a dated snapshot. |
| `BATCH_SIZE` | `100` | Rows sent to the AI per request. |
| `AI_CONCURRENCY` | `6` | Max simultaneous batch requests to Gemini. |
| `MAX_RETRIES` | `3` | Retry attempts per batch before it's marked failed/skipped. |
| `MAX_FILE_SIZE_MB` | `15` | Server-side upload cap (Multer). Keep in sync with the frontend's value below. |

### Frontend (`frontend/.env.local`, see `frontend/.env.local.example`)

| Variable | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | Where the frontend sends `/api/*` requests. |
| `NEXT_PUBLIC_MAX_FILE_SIZE_MB` | `15` | Client-side dropzone rejection threshold. **Must match the backend's `MAX_FILE_SIZE_MB`** — raising one without the other means either a confusing client-side rejection of files the server would accept, or an upload that the client allows but the server then rejects.


## Assumptions & known limitations

- "Primary" email/phone is whichever the AI judges first/most prominent per row; there's
  no assumption about column order in the source file.
- Dates are preserved as given (after a parseability check) rather than reformatted, since
  the only hard requirement is that `new Date(created_at)` succeeds.
- The importer is stateless on disk/DB — nothing is persisted beyond the in-memory job
  store's 1-hour TTL; the browser holds the result until the user downloads it or imports
  another file.
- Single-process job store: horizontal scaling (multiple backend instances behind a load
  balancer) isn't supported out of the box, since job state isn't shared externally.

## Future improvements

- Streaming/incremental results (SSE or WebSocket) so the UI can render CRM rows as each
  batch completes, rather than waiting for the whole file.
- Duplicate detection (by email/phone) across a single import.
- A confidence score per field, with a review UI for low-confidence mappings before final
  import.
- Persisting import history in a real database for auditing (replacing the in-memory job
  store), enabling multi-instance deployments.
- Native `.xlsx`/`.xls` support so users don't need to pre-export to CSV.

