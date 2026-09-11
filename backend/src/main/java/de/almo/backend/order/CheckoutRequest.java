package de.almo.backend.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Deliberately no product/price/quantity fields here - the order is built from the user's
 * server-side cart (see OrderService.checkout), never from client-supplied line items. Trusting the
 * client for prices would let anyone check out at whatever price they typed.
 */
public record CheckoutRequest(
    @NotBlank String name,
    @NotBlank String address,
    @NotBlank String city,
    @NotNull ContactPreference contactPreference) {}
