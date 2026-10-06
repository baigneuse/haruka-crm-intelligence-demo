import { localized, type Customer, type CustomerMetrics, type LocalizedText, type ProductRole } from "../../domain/types.js";
import type { AgentTool } from "../tool.js";

export interface RecommendCampaignInput {
  customer: Customer;
  metrics: CustomerMetrics;
  purchasedRoles: ProductRole[];
}

export interface CampaignRecommendation {
  customerId: string;
  actionCode:
    | "onboarding_education"
    | "personalized_win_back"
    | "high_value_concierge_win_back"
    | "loyalty_early_access"
    | "value_bundle"
    | "lotion_to_serum_cross_sell"
    | "replenishment_reminder";
  objective: "activate" | "retain" | "recover" | "cross_sell";
  priority: "high" | "medium" | "low";
  suggestedChannel: "email" | "owned_app" | "assisted_service";
  expectedKpi: "first_purchase_rate" | "repeat_purchase_rate" | "reactivation_rate" | "cross_sell_rate";
  reasonCode: string;
  explanation: LocalizedText;
  guardrail: LocalizedText;
}

type RuleDecision = Omit<CampaignRecommendation, "customerId"> & { ruleId: string };

function decide(input: RecommendCampaignInput): RuleDecision {
  const { customer, metrics, purchasedRoles } = input;

  if (metrics.orderCount === 0) {
    return {
      ruleId: "RULE-CAMPAIGN-NEW-001",
      actionCode: "onboarding_education",
      objective: "activate",
      priority: "medium",
      suggestedChannel: "email",
      expectedKpi: "first_purchase_rate",
      reasonCode: "no_purchase_evidence",
      explanation: localized(
        "Use education and product guidance because there is no purchase signal yet.",
        "購買シグナルがまだないため、商品理解を促す教育コンテンツを優先します。",
        "尚无购买信号，因此优先提供产品教育和选购指引。",
      ),
      guardrail: localized(
        "Do not infer product affinity until a purchase or explicit preference is observed.",
        "購買または明示的な嗜好が確認されるまで、商品嗜好を推定しません。",
        "在观察到购买或明确偏好前，不推断产品倾向。",
      ),
    };
  }

  if (metrics.churnRisk === "high") {
    const highValue = metrics.estimatedLtv >= 60_000 || customer.segment === "high_value";
    return {
      ruleId: highValue ? "RULE-CAMPAIGN-HV-WINBACK-001" : "RULE-CAMPAIGN-WINBACK-001",
      actionCode: highValue ? "high_value_concierge_win_back" : "personalized_win_back",
      objective: "recover",
      priority: "high",
      suggestedChannel: highValue ? "assisted_service" : "email",
      expectedKpi: "reactivation_rate",
      reasonCode: highValue ? "high_ltv_and_high_churn" : "high_churn_recency",
      explanation: localized(
        highValue
          ? "High estimated value and long inactivity justify a higher-touch recovery action."
          : "Long inactivity makes a personalized win-back action the clearest next test.",
        highValue
          ? "推定価値が高く休眠期間も長いため、より手厚い復帰施策が妥当です。"
          : "長期休眠のため、個別化した復帰施策が最も明確な次の検証です。",
        highValue
          ? "估算价值高且长期未购买，适合采用更高接触度的召回措施。"
          : "长期未购买，因此个性化召回是最明确的下一项测试。",
      ),
      guardrail: localized(
        "Use a holdout group and cap contact frequency before interpreting lift.",
        "効果判定にはホールドアウト群を設け、接触頻度に上限を設定します。",
        "评估增量效果前应设置对照组并限制触达频率。",
      ),
    };
  }

  if (metrics.estimatedLtv >= 60_000 || customer.segment === "high_value") {
    return {
      ruleId: "RULE-CAMPAIGN-LOYALTY-001",
      actionCode: "loyalty_early_access",
      objective: "retain",
      priority: "high",
      suggestedChannel: "owned_app",
      expectedKpi: "repeat_purchase_rate",
      reasonCode: "high_estimated_ltv",
      explanation: localized(
        "High observed value supports a recognition-led retention action rather than a broad discount.",
        "観測価値が高いため、一律値引きではなく優良顧客向けの特典施策を推奨します。",
        "观测价值较高，适合以会员认可型留存措施替代普遍折扣。",
      ),
      guardrail: localized(
        "Measure incremental repeat behavior and avoid training customers to wait for discounts.",
        "増分リピートを測定し、値引き待ち行動を助長しないようにします。",
        "衡量增量复购，并避免培养客户等待折扣的行为。",
      ),
    };
  }

  if (metrics.couponRate >= 0.5 || customer.priceSensitivity === "high") {
    return {
      ruleId: "RULE-CAMPAIGN-VALUE-001",
      actionCode: "value_bundle",
      objective: "retain",
      priority: "medium",
      suggestedChannel: "email",
      expectedKpi: "repeat_purchase_rate",
      reasonCode: "price_sensitivity_signal",
      explanation: localized(
        "Frequent coupon use suggests testing a value bundle with a controlled incentive.",
        "クーポン利用率が高いため、割引幅を管理したセット提案を検証します。",
        "优惠券使用频率较高，建议测试激励受控的价值组合。",
      ),
      guardrail: localized(
        "Track contribution margin and compare against a no-discount control.",
        "限界利益を追跡し、無値引き対照群と比較します。",
        "跟踪贡献毛利，并与无折扣对照组比较。",
      ),
    };
  }

  if (purchasedRoles.includes("lotion") && !purchasedRoles.includes("serum")) {
    return {
      ruleId: "RULE-CAMPAIGN-CROSSSELL-001",
      actionCode: "lotion_to_serum_cross_sell",
      objective: "cross_sell",
      priority: "medium",
      suggestedChannel: "owned_app",
      expectedKpi: "cross_sell_rate",
      reasonCode: "lotion_without_serum",
      explanation: localized(
        "The observed lotion purchase creates a testable serum cross-sell path.",
        "化粧水の購買実績から、美容液へのクロスセル仮説を検証できます。",
        "已观察到化妆水购买，可测试精华产品的交叉销售路径。",
      ),
      guardrail: localized(
        "Present this as a hypothesis; the data does not prove personal product preference.",
        "仮説として提示し、データが個人の嗜好を証明するとは扱いません。",
        "应作为假设提出；数据并不能证明个人产品偏好。",
      ),
    };
  }

  return {
    ruleId: "RULE-CAMPAIGN-REPLENISH-001",
    actionCode: "replenishment_reminder",
    objective: "retain",
    priority: "low",
    suggestedChannel: "email",
    expectedKpi: "repeat_purchase_rate",
    reasonCode: "active_customer_default",
    explanation: localized(
      "No higher-priority rule fired, so a low-pressure replenishment reminder is the default test.",
      "高優先度ルールに該当しないため、控えめな買い替えリマインドを既定施策とします。",
      "未触发更高优先级规则，因此默认测试低压力补货提醒。",
    ),
    guardrail: localized(
      "Suppress the message when the customer has received a recent campaign contact.",
      "直近で施策接触がある顧客には配信しません。",
      "若客户近期已收到活动触达，则应抑制该消息。",
    ),
  };
}

export class RecommendCampaignTool implements AgentTool<RecommendCampaignInput, CampaignRecommendation> {
  readonly name = "recommend_campaign";
  readonly version = "1.0.0";
  readonly responsibility = localized(
    "Convert customer facts into one rule-based campaign hypothesis with a guardrail.",
    "顧客事実を、ガードレール付きのルールベース施策仮説に変換します。",
    "将客户事实转换为一项带护栏的规则型活动假设。",
  );

  async execute(input: RecommendCampaignInput) {
    const { ruleId, ...recommendation } = decide(input);
    return {
      tool: this.name,
      version: this.version,
      result: { customerId: input.customer.id, ...recommendation },
      evidence: [
        {
          id: `rule:${input.customer.id}:${ruleId}`,
          kind: "rule" as const,
          statement: recommendation.explanation,
          sourceEntity: "rules" as const,
          sourceIds: [ruleId],
          value: recommendation.actionCode,
        },
      ],
      caveats: [recommendation.guardrail],
    };
  }
}
