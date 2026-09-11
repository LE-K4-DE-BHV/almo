package de.almo.backend.auth;

import de.almo.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A one-time link sent by email for the "forgot password" flow. `usedAt` is set the moment the
 * token is redeemed so a captured reset link can't be replayed - see
 * PasswordResetTokenRepository#findValidToken, which excludes both expired and already-used rows.
 */
@Entity
@Table(name = "password_reset_tokens")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PasswordResetToken {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false, unique = true)
  private String token;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "used_at")
  private Instant usedAt;

  public PasswordResetToken(User user, String token, Instant expiresAt) {
    this.user = user;
    this.token = token;
    this.expiresAt = expiresAt;
  }

  public boolean isValid(Instant now) {
    return usedAt == null && expiresAt.isAfter(now);
  }
}
