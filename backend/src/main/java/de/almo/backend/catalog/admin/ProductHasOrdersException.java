package de.almo.backend.catalog.admin;

/**
 * Thrown when deleting a product hits the order_items.product_id FK (not cascaded, see
 * V1__init.sql).
 */
public class ProductHasOrdersException extends RuntimeException {

  public ProductHasOrdersException() {
    super("Product has existing orders and cannot be deleted");
  }
}
