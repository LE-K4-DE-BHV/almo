package de.almo.backend.review;

/** Matches the `status` CHECK constraint on the reviews table (V1__init.sql). */
public enum ReviewStatus {
  PUBLISHED,
  HIDDEN
}
