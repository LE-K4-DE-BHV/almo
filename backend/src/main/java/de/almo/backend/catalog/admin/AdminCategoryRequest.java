package de.almo.backend.catalog.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Map;

/** translations: lang ("de"/"en"/"fr") -> display name. */
public record AdminCategoryRequest(
    @NotBlank String key, @NotEmpty Map<String, String> translations) {}
