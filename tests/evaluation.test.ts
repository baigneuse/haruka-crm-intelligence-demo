import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { AgentOrchestrator } from "../src/agent/orchestrator.js";
import { syntheticDataset } from "../src/data/synthetic.js";
import { evaluateCase, type EvaluationCase } from "../src/evaluation/evaluate.js";
import { InMemoryCrmRepository } from "../src/repositories/in-memory-crm-repository.js";

test("all published evaluation scenarios execute and pass", async () => {
  const directory = join(process.cwd(), "examples");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();
  assert.ok(files.length >= 5);
  const orchestrator = new AgentOrchestrator(new InMemoryCrmRepository(syntheticDataset), syntheticDataset.asOfDate);
  for (const file of files) {
    const scenario = JSON.parse(await readFile(join(directory, file), "utf8")) as EvaluationCase;
    const result = await evaluateCase(orchestrator, scenario);
    assert.equal(result.passed, true, `${scenario.id}: ${JSON.stringify(result.checks.filter((check) => !check.passed))}`);
  }
});
