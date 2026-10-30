ALTER TABLE products ADD COLUMN highlights TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE wishlist_items (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE coupons (
  code               TEXT PRIMARY KEY CHECK (code = upper(code)),
  description        TEXT NOT NULL,
  percent_off        INTEGER NOT NULL CHECK (percent_off BETWEEN 1 AND 90),
  min_subtotal_cents INTEGER NOT NULL DEFAULT 0,
  active             BOOLEAN NOT NULL DEFAULT true,
  expires_at         TIMESTAMPTZ
);

ALTER TABLE orders
  ADD COLUMN recipient_name TEXT,
  ADD COLUMN phone          TEXT,
  ADD COLUMN subtotal_cents INTEGER,
  ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN shipping_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN coupon_code    TEXT REFERENCES coupons(code);
UPDATE orders SET subtotal_cents = total_cents;
ALTER TABLE orders ALTER COLUMN subtotal_cents SET NOT NULL;

-- One row per status change, for the order-tracking timeline.
CREATE TABLE order_events (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_idx ON order_events(order_id);
INSERT INTO order_events (order_id, status, created_at) SELECT id, status, created_at FROM orders;

CREATE TABLE newsletter_subscribers (
  email      TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
