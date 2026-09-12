package de.almo.backend.review;

public class AlreadyReviewedException extends RuntimeException {

  public AlreadyReviewedException() {
    super("You have already reviewed this product");
  }
}
