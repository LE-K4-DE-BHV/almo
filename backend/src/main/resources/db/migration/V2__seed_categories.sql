-- Category taxonomy is structural (part of the shop's domain model), not placeholder content,
-- so it's seeded here - unlike products, which stay empty until an admin adds real ones
-- (Sprint 5 builds that UI; see docs/backlog.md Sprint 2 decision).

INSERT INTO categories (id, key) VALUES
    (1, 'rings'),
    (2, 'necklaces'),
    (3, 'earrings'),
    (4, 'bracelets');
-- Keep the sequence in sync with the explicit ids above, or the next INSERT without an id
-- collides with these.
SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT max(id) FROM categories));

INSERT INTO category_translations (category_id, lang, name) VALUES
    (1, 'de', 'Ringe'),
    (1, 'en', 'Rings'),
    (1, 'fr', 'Bagues'),
    (2, 'de', 'Halsketten'),
    (2, 'en', 'Necklaces'),
    (2, 'fr', 'Colliers'),
    (3, 'de', 'Ohrringe'),
    (3, 'en', 'Earrings'),
    (3, 'fr', 'Boucles d''oreilles'),
    (4, 'de', 'Armbaender'),
    (4, 'en', 'Bracelets'),
    (4, 'fr', 'Bracelets');
