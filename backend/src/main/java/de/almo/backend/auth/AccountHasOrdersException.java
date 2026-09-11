package de.almo.backend.auth;

/**
 * Thrown when self-deletion hits the orders.user_id foreign key - deliberately not cascaded (see
 * Sprint 4 decision in docs/backlog.md: order history must survive account deletion for the admin's
 * records), so the delete fails instead of silently losing/anonymizing past orders.
 */
public class AccountHasOrdersException extends RuntimeException {

  public AccountHasOrdersException() {
    super("Account has existing orders and cannot be deleted - contact the shop admin");
  }
}
