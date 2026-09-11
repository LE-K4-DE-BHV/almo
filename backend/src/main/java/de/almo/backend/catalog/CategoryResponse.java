package de.almo.backend.catalog;

/** `key` is the stable slug (e.g. "rings"), `name` is already localized to the requested lang. */
public record CategoryResponse(String key, String name) {}
