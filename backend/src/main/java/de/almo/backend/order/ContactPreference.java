package de.almo.backend.order;

/** Matches the `contact_preference` CHECK constraint on the orders table (V1__init.sql). */
public enum ContactPreference {
  WHATSAPP,
  EMAIL
}
