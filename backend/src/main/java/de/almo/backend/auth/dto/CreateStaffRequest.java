package de.almo.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStaffRequest(
    @NotBlank @Email String email, @NotBlank @Size(max = 255) String name) {}
