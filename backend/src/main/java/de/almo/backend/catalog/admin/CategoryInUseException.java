package de.almo.backend.catalog.admin;

/**
 * Thrown when deleting a category hits the products.category_id FK (not cascaded, see
 * V1__init.sql).
 */
public class CategoryInUseException extends RuntimeException {

  public CategoryInUseException() {
    super("Category has products assigned and cannot be deleted");
  }
}
