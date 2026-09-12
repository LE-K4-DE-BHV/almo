package de.almo.backend.review;

public class ReviewNotFoundException extends RuntimeException {

  public ReviewNotFoundException() {
    super("Review not found");
  }
}
