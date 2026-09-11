package de.almo.backend.cart;

/**
 * Exactly one of these is set: userId for a logged-in customer, sessionId for a guest. See
 * CartController for how this gets resolved from the request.
 */
public record CartOwner(String sessionId, Long userId) {

  public boolean isGuest() {
    return userId == null;
  }
}
