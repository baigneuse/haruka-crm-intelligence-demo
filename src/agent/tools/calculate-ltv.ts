import { calculateMetrics } from "../../analytics/metrics.js";
import { localized, type CustomerMetrics } from "../../domain/types.js";
import type { CrmRepository } from "../../repositories/crm-repository.js";
import { CustomerNotFoundError, type AgentTool } from "../tool.js";

export interface CalculateLtvInput {
  customerId: string;
  asOfDate: string;
}

export interface CalculateLtvOutput {
  metrics: CustomerMetrics;
  formula: "observed_revenue_x_frequency_multiplier";
  multiplier: number;
}

export class CalculateLtvTool implements AgentTool<CalculateLtvInput, CalculateLtvOutput> {
  readonly name = "calculate_ltv";
  readonly version = "1.0.0";
  readonly responsibility = localized(
    "Calculate transparent customer-level purchase metrics and heuristic LTV.",
    "顧客単位の購買指標とヒューリスティックLTVを透明な計算式で算出します。",
    "以透明公式计算客户级购买指标和启发式 LTV。",
  );

  constructor(private readonly repository: CrmRepository) {}

  async execute(input: CalculateLtvInput) {
    if (!(await this.repository.getCustomer(input.customerId))) {
      throw new CustomerNotFoundError(input.customerId);
    }
    const orders = (await this.repository.listOrdersForCustomer(input.customerId))
      .filter((order) => order.orderedAt <= input.asOfDate);
    const items = await this.repository.listOrderItems(orders.map((order) => order.id));
    const metrics = calculateMetrics(input.customerId, orders, items, input.asOfDate);
    const multiplier = metrics.orderCount >= 4 ? 2.8 : metrics.orderCount >= 2 ? 2 : metrics.orderCount === 1 ? 1.2 : 0;

    return {
      tool: this.name,
      version: this.version,
      result: { metrics, formula: "observed_revenue_x_frequency_multiplier" as const, multiplier },
      evidence: [
        {
          id: `metric:${input.customerId}:revenue`,
          kind: "metric" as const,
          statement: localized(
            `Observed net revenue is JPY ${metrics.totalRevenue.toLocaleString("en-US")} across ${metrics.orderCount} orders.`,
            `観測純売上は ${metrics.orderCount} 件で ${metrics.totalRevenue.toLocaleString("ja-JP")} 円です。`,
            `观测净销售额为 ${metrics.totalRevenue.toLocaleString("zh-CN")} 日元，共 ${metrics.orderCount} 笔订单。`,
          ),
          sourceEntity: "order_items" as const,
          sourceIds: items.map((item) => item.id),
          value: metrics.totalRevenue,
        },
        {
          id: `metric:${input.customerId}:ltv`,
          kind: "rule" as const,
          statement: localized(
            `Estimated LTV is observed revenue multiplied by ${multiplier}; it is a planning heuristic, not a predictive model.`,
            `推定LTVは観測売上に ${multiplier} を乗じた計画用ヒューリスティックであり、予測モデルではありません。`,
            `估算 LTV 为观测销售额乘以 ${multiplier}；这是规划启发式规则，不是预测模型。`,
          ),
          sourceEntity: "rules" as const,
          sourceIds: ["RULE-LTV-001"],
          value: metrics.estimatedLtv,
        },
      ],
      caveats: [localized(
        "The estimate excludes gross margin, acquisition cost, returns, and survival modeling.",
        "本推定には粗利、獲得費用、返品、生存分析を含みません。",
        "该估算不包含毛利、获客成本、退货和生存分析。",
      )],
    };
  }
}
