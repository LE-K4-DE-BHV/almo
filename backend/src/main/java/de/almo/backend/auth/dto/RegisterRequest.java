package de.almo.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Email String email,
    // Argon2id hashing makes the actual storage length irrelevant; the cap here is just a sane
    // upper bound so nobody can post a multi-megabyte "password" to burn CPU on the hash call.
    @NotBlank @Size(min = 8, max = 200) String password,
    @NotBlank @Size(max = 255) String name) {}
