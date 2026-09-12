package de.almo.backend.catalog.admin;

import java.util.List;

public record ProductTranslationDto(String name, String description, List<String> details) {}
