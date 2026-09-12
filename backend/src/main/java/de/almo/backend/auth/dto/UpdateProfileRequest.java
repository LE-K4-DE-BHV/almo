package de.almo.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(max = 255) String name,
    // Optional - null/blank means "keep the current password". Same length bound as
    // RegisterRequest.password for the same reason (Argon2id makes storage length irrelevant, this
    // just caps hashing-CPU-burning input).
    @Size(min = 8, max = 200) String newPassword) {}
