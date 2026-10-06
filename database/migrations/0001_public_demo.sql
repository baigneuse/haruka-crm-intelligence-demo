-- Sanitized portfolio schema. No production roles, URLs, or credentials are included.
BEGIN;

CREATE TABLE customers (
  id text PRIMARY KEY,
  display_name text NOT NULL CHECK (length(trim(display_name)) > 0),
  joined_at date NOT NULL,
  segment text NOT NULL CHECK (segment IN ('new', 'loyal', 'dormant', 'price_sensitive', 'high_value')),
  beauty_concern text NOT NULL CHECK (length(trim(beauty_concern)) > 0),
  price_sensitivity text NOT NULL CHECK (price_sensitivity IN ('low', 'medium', 'high')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id text PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  category text NOT NULL CHECK (length(trim(category)) > 0),
  role text NOT NULL CHECK (role IN ('lotion', 'serum', 'cream', 'uv', 'makeup', 'haircare')),
  list_price numeric(12, 2) NOT NULL CHECK (list_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campaigns (
  id text PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  target_segment text NOT NULL CHECK (target_segment IN ('new', 'loyal', 'dormant', 'price_sensitive', 'high_value')),
  action text NOT NULL CHECK (length(trim(action)) > 0),
  status text NOT NULL CHECK (status IN ('draft', 'active', 'completed')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  budget numeric(14, 2) NOT NULL CHECK (budget >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_date_order CHECK (end_date >= start_date)
);

CREATE TABLE orders (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  ordered_at date NOT NULL,
  channel text NOT NULL CHECK (channel IN ('owned_ec', 'store', 'marketplace', 'subscription')),
  discount_rate numeric(5, 2) NOT NULL DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  coupon_used boolean NOT NULL DEFAULT false,
  campaign_id text REFERENCES campaigns(id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_items_order_product_unique UNIQUE (order_id, product_id)
);

CREATE INDEX orders_customer_date_idx ON orders (customer_id, ordered_at DESC);
CREATE INDEX orders_campaign_idx ON orders (campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX order_items_product_idx ON order_items (product_id);
CREATE INDEX campaigns_segment_status_idx ON campaigns (target_segment, status);

-- Direct browser access is denied by default. A private deployment must add narrowly scoped policies.
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

COMMIT;
