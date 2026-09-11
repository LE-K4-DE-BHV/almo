package de.almo.backend.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {

  /** Base URL the reset-password link points at - the frontend origin, not the API. */
  private String frontendUrl = "http://localhost:8093";

  /** Sprint 1 decision (docs/backlog.md): reset links are valid for 1 hour. */
  private long passwordResetTokenTtlMinutes = 60;

  public String getFrontendUrl() {
    return frontendUrl;
  }

  public void setFrontendUrl(String frontendUrl) {
    this.frontendUrl = frontendUrl;
  }

  public long getPasswordResetTokenTtlMinutes() {
    return passwordResetTokenTtlMinutes;
  }

  public void setPasswordResetTokenTtlMinutes(long passwordResetTokenTtlMinutes) {
    this.passwordResetTokenTtlMinutes = passwordResetTokenTtlMinutes;
  }
}
