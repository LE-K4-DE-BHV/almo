package de.almo.backend.order;

public class EmptyCartException extends RuntimeException {

  public EmptyCartException() {
    super("Cannot check out an empty cart");
  }
}
