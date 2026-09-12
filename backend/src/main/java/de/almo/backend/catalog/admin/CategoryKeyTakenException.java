package de.almo.backend.catalog.admin;

public class CategoryKeyTakenException extends RuntimeException {

  public CategoryKeyTakenException(String key) {
    super("Category key already in use: " + key);
  }
}
