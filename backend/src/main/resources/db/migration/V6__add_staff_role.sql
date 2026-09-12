-- Sprint 7: multi-user admin dashboard. STAFF can manage the same catalog/order/review data as
-- ADMIN, but only ADMIN can create/manage STAFF accounts (see AdminStaffController).
ALTER TABLE users
    DROP CONSTRAINT users_role_check,
    ADD CONSTRAINT users_role_check CHECK (role IN ('CUSTOMER', 'ADMIN', 'STAFF'));
