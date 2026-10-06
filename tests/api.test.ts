import test from "node:test";
import assert from "node:assert/strict";
import { createApiHandler } from "../src/api/app.js";
import { syntheticDataset } from "../src/data/synthetic.js";
import { InMemoryCrmRepository } from "../src/repositories/in-memory-crm-repository.js";

const api = createApiHandler(new InMemoryCrmRepository(syntheticDataset), syntheticDataset.asOfDate);

test("health endpoint reports the active synthetic dataset", async () => {
  const response = await api(new Request("http://demo.test/api/health"));
  assert.equal(response.status, 200);
  const body = await response.json() as { dataMode: string; counts: { customers: number; orders: number } };
  assert.equal(body.dataMode, "synthetic");
  assert.deepEqual(body.counts, { customers: 6, products: 5, orders: 11, campaigns: 3 });
});

test("agent endpoint returns a structured, evidence-backed result", async () => {
  const response = await api(new Request("http://demo.test/api/agent/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "Calculate LTV", customerId: "CUST-004" }),
  }));
  assert.equal(response.status, 200);
  const body = await response.json() as { intent: string; evidence: unknown[]; structuredResult: { metrics: { estimatedLtv: number } } };
  assert.equal(body.intent, "ltv_analysis");
  assert.equal(body.structuredResult.metrics.estimatedLtv, 109200);
  assert.ok(body.evidence.length >= 3);
});

test("API validation returns useful status codes without leaking internals", async () => {
  const invalid = await api(new Request("http://demo.test/api/agent/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "" }),
  }));
  assert.equal(invalid.status, 400);

  const missing = await api(new Request("http://demo.test/api/agent/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "Show profile", customerId: "CUST-NOT-FOUND" }),
  }));
  assert.equal(missing.status, 404);
  const missingBody = await missing.json() as { error: { code: string } };
  assert.equal(missingBody.error.code, "customer_not_found");
});
