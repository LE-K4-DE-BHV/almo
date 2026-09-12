package de.almo.backend.catalog.admin;

public class CategoryNotFoundException extends RuntimeException {

  public CategoryNotFoundException() {
    super("Category not found");
  }
}
