# Evaluation

## Purpose

Evaluation answers a narrow question: does the implemented deterministic workflow consistently select the expected tools and return the expected business result for known synthetic cases?

It does not claim that the recommendation creates causal lift, that the thresholds generalize to a real company, or that an unimplemented LLM reasons correctly.

## Evaluation dimensions

| Dimension | Check |
|---|---|
| Calculation accuracy | Exact revenue, discount, AOV, LTV, recency, and threshold boundary assertions. |
| Tool selection | Intent maps to the expected ordered sequence of versioned tools. |
| Structured contract | Key result paths equal known expected values. |
| Invalid input | Empty questions, malformed JSON, missing IDs, and unknown customers return explicit errors. |
| Insufficient evidence | A no-purchase customer receives low confidence, an evidence limitation, and no inferred affinity. |
| Recommendation consistency | The same input facts produce the same action code, priority, KPI, explanation, and guardrail. |
| Data-access safety | PostgreSQL customer lookup uses a `$1` parameter rather than string interpolation. |

## Published cases

| Scenario | Primary assertion |
|---|---|
| `01-customer-profile.json` | One source-fact query and a loyal segment profile. |
| `02-high-value-ltv.json` | JPY 39,000 observed revenue and JPY 109,200 heuristic LTV. |
| `03-dormant-churn-risk.json` | 303 inactive days maps to high risk. |
| `04-win-back-recommendation.json` | High recency risk maps to a personalized win-back hypothesis. |
| `05-insufficient-evidence.json` | No purchase history maps to low-confidence onboarding education. |

Each JSON file contains a multilingual title, user request, expected intent, exact tool sequence, optional confidence, structured-value assertions, and required evidence kinds.

## Running evaluation

```bash
npm test
npm run eval
```

`npm test` covers individual formulas, boundaries, API behavior, orchestration, repository parameterization, and all example files. `npm run eval` provides a concise case-by-case report suitable for review.

## Failure interpretation

- A calculation failure means a business formula or fixture changed; inspect the formula and data before changing the expected value.
- A tool-sequence failure means orchestration behavior changed; confirm whether that was an intentional architecture decision.
- An evidence failure means a result can no longer show the required provenance or limitation.
- A recommendation failure may indicate rule priority drift; compare the input facts against the rule order.

Expected outputs should not be updated only to make a failing run green. A changed business rule requires an explicit design decision, a new rule version, and corresponding documentation.

## Recommended future evaluation

If a private LLM layer is added later, evaluate tool-call validity, abstention under insufficient evidence, resistance to prompt injection in CRM text fields, citation fidelity, latency, and cost separately from deterministic business-metric tests.
