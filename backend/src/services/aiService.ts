import { GoogleGenerativeAI } from "@google/generative-ai";
import { RawCsvRow, AIExtractionResult } from "../types";
import { buildSystemPrompt, buildUserPrompt } from "../prompts/crmPrompt";

const AI_MODEL = process.env.AI_MODEL || "gemini-flash-latest";

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AIServiceError(
        "GEMINI_API_KEY is not configured on the server."
      );
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIServiceError";
  }
}

/** Strips markdown code fences the model sometimes wraps JSON in, despite instructions. */
function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

/**
 * Sends a single batch of raw rows to Gemini and parses the structured
 * JSON response into AIExtractionResult[]. Throws AIServiceError on
 * malformed responses so the caller's retry logic can kick in.
 */
export async function extractBatch(
  rows: RawCsvRow[],
  startIndex: number
): Promise<AIExtractionResult[]> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: AI_MODEL,
    systemInstruction: buildSystemPrompt(),
    generationConfig: {
      // gemini-2.5-flash's actual output ceiling -- batches are now much
      // larger (see BATCH_SIZE), so this needs the full available budget.
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
    },
  });

  const response = await model.generateContent(
    buildUserPrompt(rows, startIndex)
  );

  const text = response.response.text();
  if (!text) {
    throw new AIServiceError("AI response contained no text content.");
  }

  const cleaned = stripCodeFences(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AIServiceError(
      "AI returned malformed JSON that could not be parsed."
    );
  }

  if (!Array.isArray(parsed)) {
    throw new AIServiceError("AI response was not a JSON array.");
  }

  // Basic shape validation -- reject anything without a numeric rowIndex.
  const results = parsed.filter(
    (item): item is AIExtractionResult =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).rowIndex === "number"
  );

  if (results.length === 0 && rows.length > 0) {
    throw new AIServiceError("AI response did not contain any valid entries.");
  }

  return results;
}
