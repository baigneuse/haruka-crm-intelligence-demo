import { calculateCustomerMetrics } from "../../analytics/metrics.js";
import { localized, type ChurnRisk } from "../../domain/types.js";
import type { CrmRepository } from "../../repositories/crm-repository.js";
import type { AgentTool } from "../tool.js";

export interface FindChurnRiskInput {
  asOfDate: string;
  customerId?: string;
}

export interface ChurnCandidate {
  customerId: string;
  displayName: string;
  churnRisk: ChurnRisk;
  daysSinceLastPurchase: number | null;
  orderCount: number;
}

export interface FindChurnRiskOutput {
  asOfDate: string;
  thresholds: { mediumDays: 60; highDays: 120 };
  customers: ChurnCandidate[];
}

const rank: Record<ChurnRisk, number> = { high: 3, medium: 2, low: 1 };

export class FindChurnRiskTool implements AgentTool<FindChurnRiskInput, FindChurnRiskOutput> {
  readonly name = "find_churn_risk";
  readonly version = "1.0.0";
  readonly responsibility = localized(
    "Classify churn risk from recency using explicit, reviewable thresholds.",
    "明示された検証可能な閾値で最終購買日から離反リスクを分類します。",
    "依据明确且可审查的最近购买阈值划分流失风险。",
  );

  constructor(private readonly repository: CrmRepository) {}

  async execute(input: FindChurnRiskInput) {
    const allCustomers = await this.repository.listCustomers();
    const selected = input.customerId
      ? allCustomers.filter((customer) => customer.id === input.customerId)
      : allCustomers;
    const customers = await Promise.all(selected.map(async (customer) => {
      const metrics = await calculateCustomerMetrics(this.repository, customer.id, input.asOfDate);
      return {
        customerId: customer.id,
        displayName: customer.displayName,
        churnRisk: metrics.churnRisk,
        daysSinceLastPurchase: metrics.daysSinceLastPurchase,
        orderCount: metrics.orderCount,
      };
    }));
    customers.sort((a, b) => rank[b.churnRisk] - rank[a.churnRisk]
      || (b.daysSinceLastPurchase ?? Number.MAX_SAFE_INTEGER) - (a.daysSinceLastPurchase ?? Number.MAX_SAFE_INTEGER));

    const evidence = customers.map((customer) => ({
      id: `metric:${customer.customerId}:churn`,
      kind: "metric" as const,
      statement: localized(
        customer.daysSinceLastPurchase === null
          ? `${customer.customerId} has no purchase, so the deterministic rule assigns high risk.`
          : `${customer.customerId} is ${customer.churnRisk} risk at ${customer.daysSinceLastPurchase} days since last purchase.`,
        customer.daysSinceLastPurchase === null
          ? `${customer.customerId} は購買実績がないため、決定論ルールで高リスクと判定されます。`
          : `${customer.customerId} は最終購買から ${customer.daysSinceLastPurchase} 日で、${customer.churnRisk} リスクです。`,
        customer.daysSinceLastPurchase === null
          ? `${customer.customerId} 无购买记录，因此确定性规则将其判为高风险。`
          : `${customer.customerId} 距上次购买 ${customer.daysSinceLastPurchase} 天，风险为 ${customer.churnRisk}。`,
      ),
      sourceEntity: "rules" as const,
      sourceIds: ["RULE-CHURN-060-120"],
      value: customer.churnRisk,
    }));

    return {
      tool: this.name,
      version: this.version,
      result: { asOfDate: input.asOfDate, thresholds: { mediumDays: 60 as const, highDays: 120 as const }, customers },
      evidence,
      caveats: [localized(
        "Recency thresholds are deterministic portfolio rules and require calibration before production use.",
        "購買間隔の閾値はポートフォリオ用の決定論ルールであり、本番利用前の調整が必要です。",
        "最近购买阈值是作品集用的确定性规则，生产使用前需要校准。",
      )],
    };
  }
}
