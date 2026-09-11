package de.almo.backend.cart;

/**
 * Thrown both for a genuinely missing item and for one that exists but belongs to someone else -
 * deliberately the same exception/response either way, so a caller can't probe which cart-item ids
 * exist by comparing error responses.
 */
public class CartItemNotFoundException extends RuntimeException {

  public CartItemNotFoundException() {
    super("Cart item not found");
  }
}
