package de.almo.backend.auth;

/**
 * Thrown both when the id doesn't exist at all and when it exists but isn't a STAFF account (e.g.
 * an ADMIN or CUSTOMER id) - same 404 either way, so this endpoint never confirms which other
 * accounts exist or what role they have.
 */
public class StaffNotFoundException extends RuntimeException {

  public StaffNotFoundException() {
    super("Staff account not found");
  }
}
