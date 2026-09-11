package de.almo.backend.catalog;

public class ProductNotFoundException extends RuntimeException {

  public ProductNotFoundException(long id) {
    super("No product with id " + id);
  }
}
