-- Generated fictional portfolio data. These records do not represent real people or customers.
BEGIN;

INSERT INTO customers (id, display_name, joined_at, segment, beauty_concern, price_sensitivity) VALUES
  ('CUST-001', 'Synthetic Customer 001', '2025-11-10', 'loyal', 'hydration', 'low'),
  ('CUST-002', 'Synthetic Customer 002', '2025-09-15', 'dormant', 'sensitive skin', 'medium'),
  ('CUST-003', 'Synthetic Customer 003', '2026-05-20', 'price_sensitive', 'makeup', 'high'),
  ('CUST-004', 'Synthetic Customer 004', '2024-08-03', 'high_value', 'aging care', 'low'),
  ('CUST-005', 'Synthetic Customer 005', '2026-08-21', 'new', 'hydration', 'medium'),
  ('CUST-006', 'Synthetic Customer 006', '2026-09-12', 'new', 'UV care', 'medium');

INSERT INTO products (id, name, category, role, list_price) VALUES
  ('PROD-LOTION', 'Synthetic Hydrating Lotion', 'skincare', 'lotion', 4000),
  ('PROD-SERUM', 'Synthetic Renewal Serum', 'aging_care', 'serum', 6000),
  ('PROD-CREAM', 'Synthetic Barrier Cream', 'skincare', 'cream', 7000),
  ('PROD-UV', 'Synthetic UV Protector', 'uv_care', 'uv', 3500),
  ('PROD-MAKEUP', 'Synthetic Color Base', 'makeup', 'makeup', 5000);

INSERT INTO campaigns (id, name, target_segment, action, status, start_date, end_date, budget) VALUES
  ('CAMP-001', 'Synthetic Second Purchase Nurture', 'new', 'education', 'active', '2026-09-01', '2026-09-30', 50000),
  ('CAMP-002', 'Synthetic Loyalty Preview', 'high_value', 'early_access', 'draft', '2026-10-01', '2026-10-31', 80000),
  ('CAMP-003', 'Synthetic Win-back', 'dormant', 'personalized_reminder', 'completed', '2026-06-01', '2026-06-30', 40000);

INSERT INTO orders (id, customer_id, ordered_at, channel, discount_rate, coupon_used) VALUES
  ('ORD-100', 'CUST-001', '2026-06-01', 'owned_ec', 0, false),
  ('ORD-101', 'CUST-001', '2026-07-01', 'store', 0, false),
  ('ORD-102', 'CUST-001', '2026-08-15', 'owned_ec', 10, true),
  ('ORD-200', 'CUST-002', '2025-12-01', 'marketplace', 0, false),
  ('ORD-300', 'CUST-003', '2026-07-10', 'owned_ec', 20, true),
  ('ORD-301', 'CUST-003', '2026-09-01', 'owned_ec', 10, true),
  ('ORD-400', 'CUST-004', '2026-05-01', 'subscription', 0, false),
  ('ORD-401', 'CUST-004', '2026-06-10', 'subscription', 0, false),
  ('ORD-402', 'CUST-004', '2026-07-20', 'subscription', 0, false),
  ('ORD-403', 'CUST-004', '2026-09-15', 'subscription', 0, false),
  ('ORD-500', 'CUST-005', '2026-09-05', 'owned_ec', 0, false);

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
  ('ITEM-100', 'ORD-100', 'PROD-LOTION', 1, 4000),
  ('ITEM-101', 'ORD-101', 'PROD-SERUM', 1, 6000),
  ('ITEM-102', 'ORD-102', 'PROD-CREAM', 1, 7000),
  ('ITEM-200', 'ORD-200', 'PROD-LOTION', 1, 4000),
  ('ITEM-300', 'ORD-300', 'PROD-MAKEUP', 1, 5000),
  ('ITEM-301', 'ORD-301', 'PROD-UV', 1, 3500),
  ('ITEM-400', 'ORD-400', 'PROD-SERUM', 2, 6000),
  ('ITEM-401', 'ORD-401', 'PROD-CREAM', 1, 7000),
  ('ITEM-402', 'ORD-402', 'PROD-SERUM', 1, 6000),
  ('ITEM-403', 'ORD-403', 'PROD-CREAM', 2, 7000),
  ('ITEM-500', 'ORD-500', 'PROD-LOTION', 1, 4000);

COMMIT;
