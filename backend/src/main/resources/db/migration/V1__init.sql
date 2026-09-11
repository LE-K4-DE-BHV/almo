-- Baseline schema, derived from docs/superpowers/specs/2026-09-11-almo-shop-design.md.
-- Keep this file and the spec in sync: if the data model changes, add a new
-- Vn__*.sql migration (never edit this one once it has shipped to any environment).

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ  NOT NULL,
    used_at    TIMESTAMPTZ
);

CREATE TABLE categories (
    id  BIGSERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE category_translations (
    id          BIGSERIAL PRIMARY KEY,
    category_id BIGINT      NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    lang        VARCHAR(2)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    UNIQUE (category_id, lang)
);

CREATE TABLE products (
    id                BIGSERIAL PRIMARY KEY,
    category_id       BIGINT        NOT NULL REFERENCES categories (id),
    price             NUMERIC(10,2) NOT NULL,
    compare_at_price  NUMERIC(10,2),
    stock_quantity    INTEGER       NOT NULL DEFAULT 0,
    metal_color       VARCHAR(50),
    badge             VARCHAR(50),
    -- Derived from stock_quantity per spec, not settable directly: a GENERATED
    -- STORED column means status can never drift out of sync with stock (no
    -- app-code path can update one without the other), and it's still indexable/
    -- filterable like a normal column.
    status            VARCHAR(20) GENERATED ALWAYS AS (
                          CASE
                              WHEN stock_quantity = 0 THEN 'out_of_stock'
                              WHEN stock_quantity < 5 THEN 'low_stock'
                              ELSE 'in_stock'
                          END
                      ) STORED,
    image_refs        TEXT[]        NOT NULL DEFAULT '{}',
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE product_translations (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    lang        VARCHAR(2)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    details     TEXT[]      NOT NULL DEFAULT '{}',
    UNIQUE (product_id, lang)
);

CREATE TABLE reviews (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    status     VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'HIDDEN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT        NOT NULL REFERENCES users (id),
    status              VARCHAR(20)   NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CONTACTED', 'DONE')),
    contact_preference  VARCHAR(20)   NOT NULL CHECK (contact_preference IN ('WHATSAPP', 'EMAIL')),
    shipping_cost       NUMERIC(10,2) NOT NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    id             BIGSERIAL PRIMARY KEY,
    order_id       BIGINT        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id     BIGINT        NOT NULL REFERENCES products (id),
    quantity       INTEGER       NOT NULL CHECK (quantity > 0),
    price_at_order NUMERIC(10,2) NOT NULL
);

CREATE TABLE wishlist_items (
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, product_id)
);

-- A cart row belongs to either a guest session or a logged-in user, never both:
-- session_id is set for guests, user_id replaces it once they log in (cart merge
-- happens in application code, see backlog Sprint 3). The CHECK just guards
-- against a row with neither ever being written.
CREATE TABLE cart_items (
    id         BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    user_id    BIGINT REFERENCES users (id) ON DELETE CASCADE,
    product_id BIGINT  NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    CONSTRAINT cart_items_owner_present CHECK (session_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE TABLE newsletter_subscribers (
    id             BIGSERIAL PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Foreign-key columns get an explicit index: Postgres does NOT index them
-- automatically (only the referenced side, via the PK, is indexed by default),
-- and every one of these is joined/filtered on in the product/order/cart flows.
CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_product_translations_product_id ON product_translations (product_id);
CREATE INDEX idx_reviews_product_id ON reviews (product_id);
CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_cart_items_session_id ON cart_items (session_id);
CREATE INDEX idx_cart_items_user_id ON cart_items (user_id);
