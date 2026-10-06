import type { AgentRequest } from "./types.js";

export class InputValidationError extends Error {
  constructor(
    message: string,
    public readonly details: string[] = [],
  ) {
    super(message);
    this.name = "InputValidationError";
  }
}

export const agentRequestJsonSchema = {
  $id: "AgentRequest",
  type: "object",
  additionalProperties: false,
  required: ["question"],
  properties: {
    question: { type: "string", minLength: 1, maxLength: 500 },
    customerId: { type: "string", minLength: 1, maxLength: 80, pattern: "^[A-Za-z0-9_-]+$" },
    asOfDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
  },
} as const;

export const agentRunResultJsonSchema = {
  $id: "AgentRunResult",
  type: "object",
  additionalProperties: false,
  required: ["intent", "summary", "confidence", "structuredResult", "evidence", "decisionRationale", "limitations", "toolTrace"],
  properties: {
    intent: { enum: ["customer_profile", "ltv_analysis", "churn_analysis", "campaign_recommendation"] },
    summary: { $ref: "#/$defs/localizedText" },
    confidence: { enum: ["high", "medium", "low"] },
    structuredResult: {},
    evidence: { type: "array" },
    decisionRationale: { type: "array", items: { $ref: "#/$defs/localizedText" } },
    limitations: { type: "array", items: { $ref: "#/$defs/localizedText" } },
    toolTrace: { type: "array" },
  },
  $defs: {
    localizedText: {
      type: "object",
      additionalProperties: false,
      required: ["en", "ja", "zh"],
      properties: {
        en: { type: "string" },
        ja: { type: "string" },
        zh: { type: "string" },
      },
    },
  },
} as const;

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseAgentRequest(value: unknown): AgentRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InputValidationError("Request body must be a JSON object.");
  }

  const candidate = value as Record<string, unknown>;
  const allowed = new Set(["question", "customerId", "asOfDate"]);
  const unknown = Object.keys(candidate).filter((key) => !allowed.has(key));
  const details: string[] = [];

  if (unknown.length > 0) details.push("Unknown fields are not allowed.");
  if (typeof candidate.question !== "string" || candidate.question.trim().length === 0) {
    details.push("question is required.");
  } else if (candidate.question.length > 500) {
    details.push("question must be 500 characters or fewer.");
  }
  if (candidate.customerId !== undefined && (typeof candidate.customerId !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(candidate.customerId))) {
    details.push("customerId must contain 1–80 letters, digits, underscores or hyphens.");
  }
  if (candidate.asOfDate !== undefined && (typeof candidate.asOfDate !== "string" || !isIsoDate(candidate.asOfDate))) {
    details.push("asOfDate must be a valid YYYY-MM-DD date.");
  }
  if (details.length > 0) throw new InputValidationError("Invalid agent request.", details);

  return {
    question: (candidate.question as string).trim(),
    ...(candidate.customerId === undefined ? {} : { customerId: (candidate.customerId as string).trim() }),
    ...(candidate.asOfDate === undefined ? {} : { asOfDate: candidate.asOfDate as string }),
  };
}
