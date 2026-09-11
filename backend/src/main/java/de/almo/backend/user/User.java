package de.almo.backend.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A shop account. The same table backs both customers and admins - the {@link #role} field is what
 * a security filter chain checks, not a separate table (see Sprint 1 decision in docs/backlog.md:
 * admin gets a separate login endpoint/filter chain, not a separate identity store).
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor(
    access =
        AccessLevel
            .PROTECTED) // JPA needs a no-arg constructor; app code should use the all-args one
// below
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String email;

  // Argon2id hash (see SecurityConfig), never the raw password.
  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(nullable = false)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role = Role.CUSTOMER;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  public User(String email, String passwordHash, String name, Role role) {
    this.email = email;
    this.passwordHash = passwordHash;
    this.name = name;
    this.role = role;
  }
}
