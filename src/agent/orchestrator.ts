import { localized, type AgentIntent, type AgentRequest, type AgentRunResult, type Evidence, type ToolTrace } from "../domain/types.js";
import type { CrmRepository } from "../repositories/crm-repository.js";
import { InputValidationError } from "../domain/validation.js";
import { CalculateLtvTool } from "./tools/calculate-ltv.js";
import { FindChurnRiskTool } from "./tools/find-churn-risk.js";
import { QueryCustomerTool } from "./tools/query-customer.js";
import { RecommendCampaignTool } from "./tools/recommend-campaign.js";

const CAMPAIGN_TERMS = ["campaign", "recommend", "action", "施策", "キャンペーン", "推荐", "活动", "营销"];
const CHURN_TERMS = ["churn", "dormant", "risk", "離反", "休眠", "流失", "沉睡"];
const LTV_TERMS = ["ltv", "lifetime value", "顧客生涯価値", "生命周期价值"];

export function routeIntent(question: string): AgentIntent {
  const normalized = question.toLowerCase();
  if (CAMPAIGN_TERMS.some((term) => normalized.includes(term))) return "campaign_recommendation";
  if (CHURN_TERMS.some((term) => normalized.includes(term))) return "churn_analysis";
  if (LTV_TERMS.some((term) => normalized.includes(term))) return "ltv_analysis";
  return "customer_profile";
}

function deduplicateEvidence(evidence: Evidence[]): Evidence[] {
  return [...new Map(evidence.map((item) => [item.id, item])).values()];
}

export class AgentOrchestrator {
  private readonly queryCustomer: QueryCustomerTool;
  private readonly calculateLtv: CalculateLtvTool;
  private readonly findChurnRisk: FindChurnRiskTool;
  private readonly recommendCampaign = new RecommendCampaignTool();

  constructor(private readonly repository: CrmRepository, private readonly defaultAsOfDate: string) {
    this.queryCustomer = new QueryCustomerTool(repository);
    this.calculateLtv = new CalculateLtvTool(repository);
    this.findChurnRisk = new FindChurnRiskTool(repository);
  }

  async run(request: AgentRequest): Promise<AgentRunResult> {
    const intent = routeIntent(request.question);
    const asOfDate = request.asOfDate ?? this.defaultAsOfDate;
    const traces: ToolTrace[] = [];
    const evidence: Evidence[] = [];

    if (intent === "churn_analysis" && !request.customerId) {
      const churn = await this.findChurnRisk.execute({ asOfDate });
      evidence.push(...churn.evidence);
      traces.push({
        sequence: 1,
        tool: churn.tool,
        responsibility: this.findChurnRisk.responsibility,
        input: { asOfDate },
        outcome: localized(
          `${churn.result.customers.length} customers classified.`,
          `${churn.result.customers.length} 名を分類しました。`,
          `已对 ${churn.result.customers.length} 名客户进行分类。`,
        ),
        evidenceIds: churn.evidence.map((item) => item.id),
      });
      return {
        intent,
        summary: localized(
          "Customers were ranked using explicit recency thresholds.",
          "明示的な購買間隔の閾値で顧客を順位付けしました。",
          "已使用明确的最近购买阈值对客户排序。",
        ),
        confidence: "medium",
        structuredResult: churn.result,
        evidence: deduplicateEvidence(evidence),
        decisionRationale: [localized(
          "The tool applies the same 60-day and 120-day thresholds to every customer.",
          "全顧客に同じ60日・120日の閾値を適用しています。",
          "该工具对所有客户应用相同的 60 天和 120 天阈值。",
        )],
        limitations: churn.caveats,
        toolTrace: traces,
      };
    }

    if (!request.customerId) {
      throw new InputValidationError("customerId is required for this intent.", [`Intent ${intent} requires customerId.`]);
    }

    const profile = await this.queryCustomer.execute({ customerId: request.customerId, asOfDate });
    evidence.push(...profile.evidence);
    traces.push({
      sequence: traces.length + 1,
      tool: profile.tool,
      responsibility: this.queryCustomer.responsibility,
      input: { customerId: request.customerId, asOfDate },
      outcome: localized(
        `${profile.result.orders.length} orders retrieved.`,
        `${profile.result.orders.length} 件の注文を取得しました。`,
        `已检索 ${profile.result.orders.length} 笔订单。`,
      ),
      evidenceIds: profile.evidence.map((item) => item.id),
    });

    if (intent === "customer_profile") {
      return {
        intent,
        summary: localized(
          `Profile assembled for ${profile.result.customer.id}.`,
          `${profile.result.customer.id} の顧客プロファイルを作成しました。`,
          `已生成 ${profile.result.customer.id} 的客户画像。`,
        ),
        confidence: profile.result.orders.length > 0 ? "high" : "low",
        structuredResult: profile.result,
        evidence: deduplicateEvidence(evidence),
        decisionRationale: [localized(
          "The result reports source facts without adding a behavioral prediction.",
          "行動予測を加えず、元データの事実を提示しています。",
          "结果仅呈现源数据事实，不附加行为预测。",
        )],
        limitations: profile.caveats,
        toolTrace: traces,
      };
    }

    const ltv = await this.calculateLtv.execute({ customerId: request.customerId, asOfDate });
    evidence.push(...ltv.evidence);
    traces.push({
      sequence: traces.length + 1,
      tool: ltv.tool,
      responsibility: this.calculateLtv.responsibility,
      input: { customerId: request.customerId, asOfDate },
      outcome: localized(
        `Estimated LTV: JPY ${ltv.result.metrics.estimatedLtv.toLocaleString("en-US")}.`,
        `推定LTV: ${ltv.result.metrics.estimatedLtv.toLocaleString("ja-JP")} 円。`,
        `估算 LTV：${ltv.result.metrics.estimatedLtv.toLocaleString("zh-CN")} 日元。`,
      ),
      evidenceIds: ltv.evidence.map((item) => item.id),
    });

    if (intent === "ltv_analysis") {
      return {
        intent,
        summary: localized(
          `Estimated LTV for ${request.customerId} is JPY ${ltv.result.metrics.estimatedLtv.toLocaleString("en-US")}.`,
          `${request.customerId} の推定LTVは ${ltv.result.metrics.estimatedLtv.toLocaleString("ja-JP")} 円です。`,
          `${request.customerId} 的估算 LTV 为 ${ltv.result.metrics.estimatedLtv.toLocaleString("zh-CN")} 日元。`,
        ),
        confidence: ltv.result.metrics.orderCount >= 2 ? "high" : ltv.result.metrics.orderCount === 1 ? "medium" : "low",
        structuredResult: ltv.result,
        evidence: deduplicateEvidence(evidence),
        decisionRationale: [localized(
          "The formula is deterministic and exposes its observed revenue and frequency multiplier.",
          "決定論的な式で、観測売上と頻度倍率を明示しています。",
          "公式为确定性计算，并公开观测销售额与频次乘数。",
        )],
        limitations: [...profile.caveats, ...ltv.caveats],
        toolTrace: traces,
      };
    }

    const churn = await this.findChurnRisk.execute({ customerId: request.customerId, asOfDate });
    evidence.push(...churn.evidence);
    traces.push({
      sequence: traces.length + 1,
      tool: churn.tool,
      responsibility: this.findChurnRisk.responsibility,
      input: { customerId: request.customerId, asOfDate },
      outcome: localized(
        `Risk classified as ${ltv.result.metrics.churnRisk}.`,
        `リスクを ${ltv.result.metrics.churnRisk} と分類しました。`,
        `风险分类为 ${ltv.result.metrics.churnRisk}。`,
      ),
      evidenceIds: churn.evidence.map((item) => item.id),
    });

    if (intent === "churn_analysis") {
      return {
        intent,
        summary: localized(
          `${request.customerId} is classified as ${ltv.result.metrics.churnRisk} churn risk.`,
          `${request.customerId} の離反リスクは ${ltv.result.metrics.churnRisk} です。`,
          `${request.customerId} 的流失风险为 ${ltv.result.metrics.churnRisk}。`,
        ),
        confidence: ltv.result.metrics.orderCount > 0 ? "medium" : "low",
        structuredResult: churn.result,
        evidence: deduplicateEvidence(evidence),
        decisionRationale: [localized(
          "Risk is derived only from days since the last purchase.",
          "リスクは最終購買からの経過日数のみで算出しています。",
          "风险仅由距上次购买天数推导。",
        )],
        limitations: [...profile.caveats, ...churn.caveats],
        toolTrace: traces,
      };
    }

    const recommendation = await this.recommendCampaign.execute({
      customer: profile.result.customer,
      metrics: ltv.result.metrics,
      purchasedRoles: profile.result.purchasedRoles,
    });
    evidence.push(...recommendation.evidence);
    traces.push({
      sequence: traces.length + 1,
      tool: recommendation.tool,
      responsibility: this.recommendCampaign.responsibility,
      input: {
        customerId: request.customerId,
        churnRisk: ltv.result.metrics.churnRisk,
        estimatedLtv: ltv.result.metrics.estimatedLtv,
        purchasedRoles: profile.result.purchasedRoles,
      },
      outcome: recommendation.result.explanation,
      evidenceIds: recommendation.evidence.map((item) => item.id),
    });

    return {
      intent,
      summary: localized(
        `Recommended ${recommendation.result.actionCode} for ${request.customerId}.`,
        `${request.customerId} に ${recommendation.result.actionCode} を推奨します。`,
        `建议对 ${request.customerId} 执行 ${recommendation.result.actionCode}。`,
      ),
      confidence: ltv.result.metrics.orderCount >= 2 ? "high" : ltv.result.metrics.orderCount === 1 ? "medium" : "low",
      structuredResult: recommendation.result,
      evidence: deduplicateEvidence(evidence),
      decisionRationale: [
        recommendation.result.explanation,
        localized(
          "The recommendation is a testable campaign hypothesis, not an automated customer decision.",
          "本推奨は検証可能な施策仮説であり、顧客への自動意思決定ではありません。",
          "该建议是可测试的营销假设，并非面向客户的自动决策。",
        ),
      ],
      limitations: [...profile.caveats, ...ltv.caveats, ...churn.caveats, ...recommendation.caveats],
      toolTrace: traces,
    };
  }
}
