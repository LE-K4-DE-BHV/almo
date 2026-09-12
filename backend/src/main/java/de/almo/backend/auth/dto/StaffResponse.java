package de.almo.backend.auth.dto;

import de.almo.backend.user.User;
import java.time.Instant;

public record StaffResponse(Long id, String email, String name, Instant createdAt) {

  public static StaffResponse from(User user) {
    return new StaffResponse(user.getId(), user.getEmail(), user.getName(), user.getCreatedAt());
  }
}
