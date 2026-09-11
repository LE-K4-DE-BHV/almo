package de.almo.backend.auth;

public class InvalidResetTokenException extends RuntimeException {

  public InvalidResetTokenException() {
    super("Reset token is invalid, expired, or already used");
  }
}
