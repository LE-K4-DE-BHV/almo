package de.almo.backend.auth.dto;

import de.almo.backend.user.Role;
import de.almo.backend.user.User;

/** Never expose {@link User#getPasswordHash()} - this is the shape that actually leaves the API. */
public record UserResponse(Long id, String email, String name, Role role) {

  public static UserResponse from(User user) {
    return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
  }
}
