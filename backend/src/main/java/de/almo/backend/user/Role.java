package de.almo.backend.user;

/**
 * Matches the `role` CHECK constraint on the users table (V1__init.sql, extended for STAFF in
 * V6__add_staff_role.sql). STAFF has the same access as ADMIN to /api/admin/** (see SecurityConfig)
 * except staff-account management itself (AdminStaffController), which stays ADMIN-only.
 */
public enum Role {
  CUSTOMER,
  ADMIN,
  STAFF
}
