export type CustomerSegment = "new" | "loyal" | "dormant" | "price_sensitive" | "high_value";
export type PriceSensitivity = "low" | "medium" | "high";
export type Channel = "owned_ec" | "store" | "marketplace" | "subscription";
export type ProductRole = "lotion" | "serum" | "cream" | "uv" | "makeup" | "haircare";

export interface Customer {
  id: string;
  displayName: string;
  joinedAt: string;
  segment: CustomerSegment;
  beautyConcern: string;
  priceSensitivity: PriceSensitivity;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  role: ProductRole;
  listPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  orderedAt: string;
  channel: Channel;
  discountRate: number;
  couponUsed: boolean;
  campaignId?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Campaign {
  id: string;
  name: string;
  targetSegment: CustomerSegment;
  action: string;
  status: "draft" | "active" | "completed";
  startDate: string;
  endDate: string;
  budget: number;
}

export interface CrmDataset {
  asOfDate: string;
  customers: Customer[];
  products: Product[];
  orders: Order[];
  orderItems: OrderItem[];
  campaigns: Campaign[];
}

export type ChurnRisk = "low" | "medium" | "high";
export type Locale = "en" | "ja" | "zh";

export interface LocalizedText {
  en: string;
  ja: string;
  zh: string;
}

export interface CustomerMetrics {
  customerId: string;
  orderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastPurchaseDate: string | null;
  daysSinceLastPurchase: number | null;
  couponRate: number;
  estimatedLtv: number;
  churnRisk: ChurnRisk;
}

export interface Evidence {
  id: string;
  kind: "customer_attribute" | "order_fact" | "metric" | "rule" | "limitation";
  statement: LocalizedText;
  sourceEntity: "customers" | "orders" | "order_items" | "products" | "rules";
  sourceIds: string[];
  value?: string | number;
}

export interface ToolExecution<T> {
  tool: string;
  version: string;
  result: T;
  evidence: Evidence[];
  caveats: LocalizedText[];
}

export type AgentIntent = "customer_profile" | "ltv_analysis" | "churn_analysis" | "campaign_recommendation";

export interface AgentRequest {
  question: string;
  customerId?: string;
  asOfDate?: string;
}

export interface ToolTrace {
  sequence: number;
  tool: string;
  responsibility: LocalizedText;
  input: Record<string, unknown>;
  outcome: LocalizedText;
  evidenceIds: string[];
}

export interface AgentRunResult {
  intent: AgentIntent;
  summary: LocalizedText;
  confidence: "high" | "medium" | "low";
  structuredResult: unknown;
  evidence: Evidence[];
  decisionRationale: LocalizedText[];
  limitations: LocalizedText[];
  toolTrace: ToolTrace[];
}

export const localized = (en: string, ja: string, zh: string): LocalizedText => ({ en, ja, zh });
