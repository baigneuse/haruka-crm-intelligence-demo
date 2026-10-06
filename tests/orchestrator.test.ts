import test from "node:test";
import assert from "node:assert/strict";
import { AgentOrchestrator, routeIntent } from "../src/agent/orchestrator.js";
import { syntheticDataset } from "../src/data/synthetic.js";
import { InputValidationError } from "../src/domain/validation.js";
import { InMemoryCrmRepository } from "../src/repositories/in-memory-crm-repository.js";

const orchestrator = new AgentOrchestrator(new InMemoryCrmRepository(syntheticDataset), syntheticDataset.asOfDate);

test("intent routing recognizes English, Japanese, and Chinese prompts", () => {
  assert.equal(routeIntent("Calculate LTV"), "ltv_analysis");
  assert.equal(routeIntent("離反リスクを確認"), "churn_analysis");
  assert.equal(routeIntent("推荐营销活动"), "campaign_recommendation");
  assert.equal(routeIntent("Show customer facts"), "customer_profile");
});

test("campaign workflow composes four tools and preserves evidence", async () => {
  const result = await orchestrator.run({ question: "Recommend a campaign action", customerId: "CUST-002" });
  assert.equal(result.intent, "campaign_recommendation");
  assert.deepEqual(result.toolTrace.map((trace) => trace.tool), [
    "query_customer",
    "calculate_ltv",
    "find_churn_risk",
    "recommend_campaign",
  ]);
  assert.equal((result.structuredResult as { actionCode: string }).actionCode, "personalized_win_back");
  assert.ok(result.evidence.every((item) => item.sourceIds.length > 0 || item.kind === "limitation"));
});

test("missing customer ID is rejected for customer-specific intents", async () => {
  await assert.rejects(
    () => orchestrator.run({ question: "Calculate LTV" }),
    (error: unknown) => error instanceof InputValidationError,
  );
});

test("no-purchase customer returns low confidence and explicit limitation", async () => {
  const result = await orchestrator.run({ question: "Recommend a campaign", customerId: "CUST-006" });
  assert.equal(result.confidence, "low");
  assert.equal((result.structuredResult as { actionCode: string }).actionCode, "onboarding_education");
  assert.ok(result.evidence.some((item) => item.kind === "limitation"));
  assert.ok(result.limitations.length > 0);
});
