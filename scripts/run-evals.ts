import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { AgentOrchestrator } from "../src/agent/orchestrator.js";
import { syntheticDataset } from "../src/data/synthetic.js";
import { evaluateCase, type EvaluationCase } from "../src/evaluation/evaluate.js";
import { InMemoryCrmRepository } from "../src/repositories/in-memory-crm-repository.js";

const examplesDirectory = join(process.cwd(), "examples");
const files = (await readdir(examplesDirectory)).filter((file) => file.endsWith(".json")).sort();
const orchestrator = new AgentOrchestrator(new InMemoryCrmRepository(syntheticDataset), syntheticDataset.asOfDate);
let failures = 0;

for (const file of files) {
  const scenario = JSON.parse(await readFile(join(examplesDirectory, file), "utf8")) as EvaluationCase;
  const result = await evaluateCase(orchestrator, scenario);
  const failedChecks = result.checks.filter((check) => !check.passed);
  console.log(`${result.passed ? "PASS" : "FAIL"} ${scenario.id} — ${scenario.title.en}`);
  for (const check of failedChecks) {
    console.error(`  ${check.name}: expected ${JSON.stringify(check.expected)}, received ${JSON.stringify(check.actual)}`);
  }
  if (!result.passed) failures += 1;
}

console.log(`\n${files.length - failures}/${files.length} evaluation scenarios passed.`);
if (failures > 0) process.exitCode = 1;
