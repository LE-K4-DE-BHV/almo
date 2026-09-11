package de.almo.backend.wishlist;

import jakarta.validation.constraints.NotNull;

public record AddWishlistItemRequest(@NotNull Long productId) {}
