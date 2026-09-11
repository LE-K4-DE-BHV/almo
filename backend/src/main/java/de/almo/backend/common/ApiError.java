package de.almo.backend.common;

/** Uniform error body for every non-2xx response the API returns. */
public record ApiError(String message) {}
