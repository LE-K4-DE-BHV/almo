package de.almo.backend.order;

/**
 * Thrown both when the id doesn't exist and when it belongs to someone else - see
 * CartItemNotFoundException for why that's deliberate.
 */
public class OrderNotFoundException extends RuntimeException {

  public OrderNotFoundException() {
    super("Order not found");
  }
}
