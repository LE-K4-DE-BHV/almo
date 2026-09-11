package de.almo.backend.order;

/** Matches the `status` CHECK constraint on the orders table (V1__init.sql). */
public enum OrderStatus {
  OPEN,
  CONTACTED,
  DONE
}
