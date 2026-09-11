-- Sprint 4: checkout needs contact/address fields that V1 didn't anticipate, and order_items
-- needs a product name snapshot - products are editable/deletable from Sprint 5 onward, so order
-- history must not depend on the current state of the products table to render correctly.
-- Both tables are empty in every environment so far (nothing has created an order before this
-- sprint), so NOT NULL without a DEFAULT is safe here.

ALTER TABLE orders
    ADD COLUMN shipping_name    VARCHAR(255) NOT NULL,
    ADD COLUMN shipping_address VARCHAR(255) NOT NULL,
    ADD COLUMN shipping_city    VARCHAR(255) NOT NULL;

ALTER TABLE order_items
    ADD COLUMN product_name VARCHAR(255) NOT NULL;
