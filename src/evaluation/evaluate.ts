import type { AgentOrchestrator } from "../agent/orchestrator.js";
import type { AgentIntent, AgentRequest, LocalizedText } from "../domain/types.js";

export interface EvaluationCase {
  id: string;
  title: LocalizedText;
  request: AgentRequest;
  expect: {
    intent: AgentIntent;
    toolSequence: string[];
    confidence?: "high" | "medium" | "low";
    values?: Record<string, unknown>;
    evidenceKinds?: string[];
  };
}

export interface EvaluationResult {
  id: string;
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; expected: unknown; actual: unknown }>;
}

function valueAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    if (Array.isArray(current)) return current[Number(part)];
    return (current as Record<string, unknown>)[part];
  }, value);
}

function same(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export async function evaluateCase(orchestrator: AgentOrchestrator, scenario: EvaluationCase): Promise<EvaluationResult> {
  const result = await orchestrator.run(scenario.request);
  const checks: EvaluationResult["checks"] = [];
  const check = (name: string, actual: unknown, expected: unknown) => {
    checks.push({ name, actual, expected, passed: same(actual, expected) });
  };

  check("intent", result.intent, scenario.expect.intent);
  check("tool sequence", result.toolTrace.map((trace) => trace.tool), scenario.expect.toolSequence);
  if (scenario.expect.confidence) check("confidence", result.confidence, scenario.expect.confidence);
  for (const [path, expected] of Object.entries(scenario.expect.values ?? {})) {
    check(`structuredResult.${path}`, valueAtPath(result.structuredResult, path), expected);
  }
  for (const kind of scenario.expect.evidenceKinds ?? []) {
    check(`evidence kind: ${kind}`, result.evidence.some((item) => item.kind === kind), true);
  }

  return { id: scenario.id, passed: checks.every((item) => item.passed), checks };
}
