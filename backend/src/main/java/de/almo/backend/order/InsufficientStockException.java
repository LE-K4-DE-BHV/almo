package de.almo.backend.order;

public class InsufficientStockException extends RuntimeException {

  public InsufficientStockException(String productName) {
    super("Not enough stock for: " + productName);
  }
}
