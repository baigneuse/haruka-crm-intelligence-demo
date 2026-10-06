/* global document, fetch */

const copy = {
  en: {
    syntheticBadge: "Synthetic data only", eyebrow: "EXPLAINABLE CRM DECISIONS", headline: "Turn customer facts into reviewable retention actions.",
    lede: "A deterministic portfolio demo for customer analytics, tool orchestration, evidence, and evaluation.", boundaryTitle: "Public-demo boundary",
    boundaryText: "No production connection, credentials, personal data, or hidden model reasoning is included.", inputKicker: "BUSINESS QUESTION", inputTitle: "Configure an analysis",
    customerLabel: "Synthetic customer", loading: "Loading…", customerHelp: "Use fictional inputs only. Do not enter personal or confidential information.", scenarioLabel: "Example workflow",
    tryExample: "Try this example · CUST-002", tryHelp: "A dormant customer: inspect the metrics, win-back recommendation and evidence. Then press Run.",
    revenue: "Observed revenue", ltv: "Estimated LTV", risk: "Churn risk", action: "Action", high: "High", medium: "Medium", low: "Low",
    scenarioProfile: "Customer profile", scenarioLtv: "Calculate LTV", scenarioChurn: "Find churn risk", scenarioCampaign: "Recommend campaign",
    questionLabel: "Question sent to the orchestrator", runButton: "Run explainable analysis", outputKicker: "STRUCTURED RESULT", outputTitle: "Decision evidence",
    emptyTitle: "Select a workflow and run the analysis.", emptyText: "The result will show calculated facts, tool sequence, evidence, and limitations.",
    methodOneTitle: "Facts", methodOneText: "Customer, order, item, and product records.", methodTwoTitle: "Deterministic tools", methodTwoText: "Explicit formulas and versioned rules.",
    methodThreeTitle: "Evidence", methodThreeText: "Every recommendation points back to facts or rules.", methodFourTitle: "Evaluation", methodFourText: "Executable scenarios check stable behavior.",
    footerText: "Sanitized portfolio edition · Synthetic data · No production credentials", sourceLink: "Repository documentation", running: "Running tools…", complete: "Analysis complete.",
    loadError: "Could not load the synthetic dataset.", requestError: "The analysis could not be completed.", calculatedFacts: "Calculated facts", evidence: "Evidence", trace: "Tool trace", limitations: "Limitations",
    raw: "Raw structured output", confidence: "confidence", intent: "intent", noLimitations: "No additional limitations.",
    prompts: { profile: "Show the customer profile and purchase facts.", ltv: "Calculate LTV for this customer.", churn: "Assess churn risk for this customer.", campaign: "Recommend a campaign action for this customer." },
  },
  ja: {
    syntheticBadge: "合成データのみ", eyebrow: "説明可能なCRM意思決定", headline: "顧客事実を、検証可能なリテンション施策へ。",
    lede: "顧客分析、ツール連携、根拠、評価を示す決定論的なポートフォリオデモです。", boundaryTitle: "公開デモの境界",
    boundaryText: "本番接続、認証情報、個人データ、非公開のモデル推論は含みません。", inputKicker: "ビジネス質問", inputTitle: "分析を設定",
    customerLabel: "合成顧客", loading: "読み込み中…", customerHelp: "架空の入力のみを使用してください。個人情報・機密情報は入力しないでください。", scenarioLabel: "ワークフロー例",
    tryExample: "この例を試す · CUST-002", tryHelp: "休眠顧客の指標、復帰施策、根拠を確認できます。選択後に「分析を実行」を押してください。",
    revenue: "観測売上", ltv: "推定LTV", risk: "離反リスク", action: "施策", high: "高", medium: "中", low: "低",
    scenarioProfile: "顧客プロファイル", scenarioLtv: "LTVを算出", scenarioChurn: "離反リスクを判定", scenarioCampaign: "施策を推奨",
    questionLabel: "オーケストレーターへの質問", runButton: "説明可能な分析を実行", outputKicker: "構造化結果", outputTitle: "意思決定の根拠",
    emptyTitle: "ワークフローを選び、分析を実行してください。", emptyText: "計算事実、ツール順序、根拠、制約を表示します。",
    methodOneTitle: "事実", methodOneText: "顧客・注文・明細・商品のレコード。", methodTwoTitle: "決定論ツール", methodTwoText: "明示的な式とバージョン管理されたルール。",
    methodThreeTitle: "根拠", methodThreeText: "すべての推奨を事実またはルールに接続。", methodFourTitle: "評価", methodFourText: "実行可能なシナリオで挙動を確認。",
    footerText: "脱敏済みポートフォリオ版 · 合成データ · 本番認証情報なし", sourceLink: "リポジトリ資料", running: "ツールを実行中…", complete: "分析が完了しました。",
    loadError: "合成データを読み込めませんでした。", requestError: "分析を完了できませんでした。", calculatedFacts: "計算事実", evidence: "根拠", trace: "ツール実行履歴", limitations: "制約",
    raw: "構造化出力（Raw）", confidence: "信頼度", intent: "目的", noLimitations: "追加の制約はありません。",
    prompts: { profile: "顧客プロファイルと購買事実を表示してください。", ltv: "この顧客のLTVを計算してください。", churn: "この顧客の離反リスクを評価してください。", campaign: "この顧客にCRM施策を推奨してください。" },
  },
  zh: {
    syntheticBadge: "仅使用合成数据", eyebrow: "可解释的 CRM 决策", headline: "把客户事实转化为可审查的留存行动。",
    lede: "一个展示客户分析、工具编排、证据与评估的确定性作品集演示。", boundaryTitle: "公开演示边界",
    boundaryText: "不包含生产连接、凭据、个人数据或隐藏的模型推理。", inputKicker: "业务问题", inputTitle: "配置分析",
    customerLabel: "合成客户", loading: "加载中…", customerHelp: "请仅使用虚构输入，不要输入个人信息或机密资料。", scenarioLabel: "示例工作流",
    tryExample: "试试这个示例 · CUST-002", tryHelp: "查看休眠客户的指标、召回建议和证据。选择后请点击「运行分析」。",
    revenue: "观测销售额", ltv: "估算 LTV", risk: "流失风险", action: "建议行动", high: "高", medium: "中", low: "低",
    scenarioProfile: "客户画像", scenarioLtv: "计算 LTV", scenarioChurn: "识别流失风险", scenarioCampaign: "推荐营销行动",
    questionLabel: "发送给编排器的问题", runButton: "运行可解释分析", outputKicker: "结构化结果", outputTitle: "决策证据",
    emptyTitle: "选择工作流并运行分析。", emptyText: "结果将显示计算事实、工具顺序、证据和限制。",
    methodOneTitle: "事实", methodOneText: "客户、订单、明细与产品记录。", methodTwoTitle: "确定性工具", methodTwoText: "明确公式与版本化规则。",
    methodThreeTitle: "证据", methodThreeText: "每项建议都能回溯到事实或规则。", methodFourTitle: "评估", methodFourText: "通过可执行场景检查稳定行为。",
    footerText: "脱敏作品集版本 · 合成数据 · 无生产凭据", sourceLink: "仓库文档", running: "正在运行工具…", complete: "分析完成。",
    loadError: "无法加载合成数据集。", requestError: "无法完成分析。", calculatedFacts: "计算事实", evidence: "证据", trace: "工具调用轨迹", limitations: "限制",
    raw: "原始结构化输出", confidence: "置信度", intent: "意图", noLimitations: "没有其他限制。",
    prompts: { profile: "显示该客户的画像和购买事实。", ltv: "计算该客户的 LTV。", churn: "评估该客户的流失风险。", campaign: "为该客户推荐一项营销行动。" },
  },
};

let locale = "en";
let scenario = "profile";
let lastResult = null;

const elements = {
  customer: document.querySelector("#customer"), question: document.querySelector("#question"), run: document.querySelector("#run"),
  status: document.querySelector("#status"), empty: document.querySelector("#empty-state"), result: document.querySelector("#result"),
};

const text = () => copy[locale];
const pick = (localized) => localized?.[locale] ?? localized?.en ?? "";

function applyLocale(nextLocale) {
  locale = nextLocale;
  document.documentElement.lang = nextLocale === "zh" ? "zh-CN" : nextLocale;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (typeof text()[key] === "string") node.textContent = text()[key];
  });
  document.querySelectorAll("[data-locale]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.locale === locale));
  });
  elements.question.value = text().prompts[scenario];
  if (lastResult) renderResult(lastResult);
}

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = String(content);
  return node;
}

function section(title) {
  const wrapper = element("section", "result-section");
  wrapper.append(element("h4", "", title));
  return wrapper;
}

function factEntries(result) {
  const body = result.structuredResult ?? {};
  const metrics = body.metrics;
  if (metrics) return [
    ["total revenue", formatMoney(metrics.totalRevenue)], ["average order value", formatMoney(metrics.averageOrderValue)], ["estimated LTV", formatMoney(metrics.estimatedLtv)],
    ["order count", metrics.orderCount], ["days since purchase", metrics.daysSinceLastPurchase ?? "—"], ["churn risk", metrics.churnRisk],
  ];
  if (body.actionCode) {
    const evidenceValue = (suffix) => result.evidence.find((item) => item.id === `metric:${body.customerId}:${suffix}`)?.value;
    const revenue = evidenceValue("revenue");
    const ltv = evidenceValue("ltv");
    const risk = evidenceValue("churn");
    return [
      [text().revenue, typeof revenue === "number" ? formatMoney(revenue) : "—"],
      [text().ltv, typeof ltv === "number" ? formatMoney(ltv) : "—"], [text().risk, text()[risk] ?? risk ?? "—"],
      [text().action, pick(body.explanation)], ["priority", body.priority], ["expected KPI", body.expectedKpi],
    ];
  }
  if (Array.isArray(body.customers) && body.customers[0]) {
    const customer = body.customers[0];
    return [["customer", customer.customerId], ["churn risk", customer.churnRisk], ["days since purchase", customer.daysSinceLastPurchase ?? "—"], ["order count", customer.orderCount]];
  }
  if (body.customer) return [
    ["customer", body.customer.id], ["segment", body.customer.segment], ["beauty concern", body.customer.beautyConcern], ["orders", body.orders?.length ?? 0], ["purchased roles", (body.purchasedRoles ?? []).join(", ") || "—"],
  ];
  return [];
}

function formatMoney(value) {
  return new Intl.NumberFormat(locale === "ja" ? "ja-JP" : locale === "zh" ? "zh-CN" : "en-US", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value);
}

function renderResult(data) {
  lastResult = data;
  elements.empty.hidden = true;
  elements.result.hidden = false;
  elements.result.replaceChildren();

  const hero = element("div", "result-hero");
  const meta = element("div", "result-meta");
  meta.append(element("span", "pill", `${text().intent}: ${data.intent}`), element("span", "pill", `${text().confidence}: ${data.confidence}`));
  hero.append(meta, element("h3", "", pick(data.summary)));
  elements.result.append(hero);

  const facts = section(text().calculatedFacts);
  const grid = element("div", "fact-grid");
  factEntries(data).forEach(([label, value]) => {
    const card = element("div", "fact");
    card.append(element("span", "", label), element("strong", "", value));
    grid.append(card);
  });
  facts.append(grid);
  elements.result.append(facts);

  const evidenceSection = section(text().evidence);
  const evidenceList = element("ul", "evidence-list");
  data.evidence.forEach((item) => {
    const row = element("li", "evidence-item");
    row.append(element("span", "evidence-kind", item.kind));
    const detail = element("div");
    detail.append(element("p", "", pick(item.statement)), element("span", "evidence-source", `${item.sourceEntity} · ${item.sourceIds.join(", ")}`));
    row.append(detail);
    evidenceList.append(row);
  });
  evidenceSection.append(evidenceList);
  elements.result.append(evidenceSection);

  const traceSection = section(text().trace);
  const traceList = element("ol", "trace-list");
  data.toolTrace.forEach((item) => {
    const row = element("li", "trace-item");
    row.append(element("span", "trace-number", item.sequence));
    const card = element("div", "trace-card");
    card.append(element("strong", "", item.tool), element("p", "", pick(item.responsibility)), element("p", "", pick(item.outcome)));
    row.append(card);
    traceList.append(row);
  });
  traceSection.append(traceList);
  elements.result.append(traceSection);

  const limitSection = section(text().limitations);
  const limitList = element("ul", "limitation-list");
  const limits = data.limitations.length ? data.limitations : [{ en: text().noLimitations, ja: text().noLimitations, zh: text().noLimitations }];
  limits.forEach((item) => limitList.append(element("li", "", pick(item))));
  limitSection.append(limitList);
  elements.result.append(limitSection);

  const details = element("details");
  details.append(element("summary", "", text().raw), element("pre", "", JSON.stringify(data.structuredResult, null, 2)));
  elements.result.append(details);
}

async function loadCustomers() {
  try {
    const response = await fetch("/api/customers");
    if (!response.ok) throw new Error("customer request failed");
    const payload = await response.json();
    elements.customer.replaceChildren();
    payload.customers.forEach((customer) => {
      const option = element("option", "", `${customer.id} · ${customer.displayName} · ${customer.segment}`);
      option.value = customer.id;
      elements.customer.append(option);
    });
    document.querySelector("#try-example").disabled = false;
  } catch {
    elements.status.textContent = text().loadError;
    elements.status.classList.add("error");
  }
}

async function runAnalysis() {
  elements.run.disabled = true;
  elements.status.classList.remove("error");
  elements.status.textContent = text().running;
  try {
    const response = await fetch("/api/agent/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: elements.question.value, customerId: elements.customer.value }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? "request failed");
    renderResult(payload);
    elements.status.textContent = text().complete;
  } catch (error) {
    elements.status.textContent = `${text().requestError} ${error instanceof Error ? error.message : ""}`.trim();
    elements.status.classList.add("error");
  } finally {
    elements.run.disabled = false;
  }
}

document.querySelectorAll("[data-locale]").forEach((button) => button.addEventListener("click", () => applyLocale(button.dataset.locale)));
document.querySelectorAll("[data-scenario]").forEach((button) => button.addEventListener("click", () => {
  scenario = button.dataset.scenario;
  document.querySelectorAll("[data-scenario]").forEach((candidate) => candidate.classList.toggle("active", candidate === button));
  elements.question.value = text().prompts[scenario];
}));
elements.run.addEventListener("click", runAnalysis);
document.querySelector("#try-example").addEventListener("click", () => {
  elements.customer.value = "CUST-002";
  scenario = "campaign";
  document.querySelectorAll("[data-scenario]").forEach((button) => button.classList.toggle("active", button.dataset.scenario === scenario));
  elements.question.value = text().prompts.campaign;
  lastResult = null;
  elements.result.hidden = true;
  elements.empty.hidden = false;
  elements.status.textContent = text().tryHelp;
  elements.run.focus();
});
applyLocale("en");
void loadCustomers();
