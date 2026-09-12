package de.almo.backend.review;

public class NotPurchasedException extends RuntimeException {

  public NotPurchasedException() {
    super("You can only review products you have ordered");
  }
}
