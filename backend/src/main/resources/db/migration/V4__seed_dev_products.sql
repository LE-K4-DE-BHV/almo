-- Dev-only test data, NOT the real catalog (see Sprint 2 decision in docs/backlog.md: the old
-- almofrontenddesign/js/products.js placeholders are deliberately not migrated - real products
-- come from the admin UI in Sprint 5). Just enough variety here to exercise every filter
-- (category, price range, metal_color, stock status) and the search index while building the
-- shop UI. Fine to leave running in early environments; gets superseded by real admin-entered
-- products once Sprint 5 ships, not something that needs cleaning up by hand.

INSERT INTO products (id, category_id, price, compare_at_price, stock_quantity, metal_color, badge, image_refs) VALUES
    (1, 1, 14.90, 19.90, 12, 'gold', 'Bestseller', ARRAY['https://images.pexels.com/photos/1616096/pexels-photo-1616096.jpeg?auto=compress&cs=tinysrgb&w=800']),
    (2, 1, 9.90,  NULL,  20, 'silver', NULL, ARRAY['https://images.pexels.com/photos/8398912/pexels-photo-8398912.jpeg?auto=compress&cs=tinysrgb&w=800']),
    (3, 1, 13.90, NULL,  0,  'bicolor', NULL, ARRAY['https://images.pexels.com/photos/265906/pexels-photo-265906.jpeg?auto=compress&cs=tinysrgb&w=800']),
    (4, 2, 17.90, 24.90, 8,  'gold', 'Neu', ARRAY['https://images.pexels.com/photos/7134458/pexels-photo-7134458.jpeg?auto=compress&cs=tinysrgb&w=800']),
    (5, 3, 8.90,  NULL,  15, 'gold', NULL, ARRAY['https://images.pexels.com/photos/5370641/pexels-photo-5370641.jpeg?auto=compress&cs=tinysrgb&w=800']),
    (6, 4, 12.90, NULL,  3,  'gold', NULL, ARRAY['https://images.pexels.com/photos/12194325/pexels-photo-12194325.jpeg?auto=compress&cs=tinysrgb&w=800']);
SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT max(id) FROM products));

INSERT INTO product_translations (product_id, lang, name, description, details) VALUES
    (1, 'de', 'Ring Aurelia', 'Schlichter goldfarbener Ring mit einem facettierten Zirkonia-Stein.', ARRAY['Material: Legierung, vergoldet', 'Stein: Zirkonia', 'Nickelfrei']),
    (1, 'en', 'Aurelia Ring', 'Simple gold-tone ring with a faceted cubic zirconia stone.', ARRAY['Material: alloy, gold-plated', 'Stone: cubic zirconia', 'Nickel-free']),
    (1, 'fr', 'Bague Aurelia', 'Bague dorée épurée ornée d''une pierre zircone à facettes.', ARRAY['Materiau : alliage plaqué or', 'Pierre : zircone', 'Sans nickel']),

    (2, 'de', 'Ring Luna', 'Minimalistischer silberfarbener Ring, perfekt zum Kombinieren.', ARRAY['Material: Legierung, rhodiniert', 'Nickelfrei']),
    (2, 'en', 'Luna Ring', 'Minimalist silver-tone ring, perfect for stacking.', ARRAY['Material: alloy, rhodium-plated', 'Nickel-free']),
    (2, 'fr', 'Bague Luna', 'Bague argentée minimaliste, parfaite à superposer.', ARRAY['Materiau : alliage rhodié', 'Sans nickel']),

    (3, 'de', 'Ring Topaz', 'Bunter Statement-Ring mit farbigem Glasstein.', ARRAY['Material: Legierung, bicolor', 'Stein: Glasstein']),
    (3, 'en', 'Topaz Ring', 'Colorful statement ring with a glass stone.', ARRAY['Material: alloy, two-tone', 'Stone: glass']),
    (3, 'fr', 'Bague Topaz', 'Bague statement colorée avec une pierre en verre.', ARRAY['Materiau : alliage bicolore', 'Pierre : verre']),

    (4, 'de', 'Halskette Stella', 'Zarte goldfarbene Kette mit Sternanhaenger, Laenge 40-45 cm verstellbar.', ARRAY['Material: Legierung, vergoldet', 'Laenge: 40-45 cm verstellbar']),
    (4, 'en', 'Stella Necklace', 'Delicate gold-tone chain with a star pendant, adjustable 40-45 cm.', ARRAY['Material: alloy, gold-plated', 'Length: 40-45 cm adjustable']),
    (4, 'fr', 'Collier Stella', 'Chaîne dorée délicate avec pendentif étoile, réglable 40-45 cm.', ARRAY['Materiau : alliage plaqué or', 'Longueur : 40-45 cm réglable']),

    (5, 'de', 'Ohrringe Vera', 'Kleine Creolen aus goldfarbenem Material, leicht und alltagstauglich.', ARRAY['Material: Legierung, vergoldet', 'Durchmesser: 18 mm']),
    (5, 'en', 'Vera Earrings', 'Small gold-tone hoops, lightweight and everyday-friendly.', ARRAY['Material: alloy, gold-plated', 'Diameter: 18 mm']),
    (5, 'fr', 'Boucles d''oreilles Vera', 'Petites créoles dorées, légères et faciles à porter au quotidien.', ARRAY['Materiau : alliage plaqué or', 'Diametre : 18 mm']),

    (6, 'de', 'Armband Mira', 'Filigranes Kettenarmband mit kleinem Herzanhaenger.', ARRAY['Material: Legierung, vergoldet', 'Laenge: 16-19 cm verstellbar']),
    (6, 'en', 'Mira Bracelet', 'Delicate chain bracelet with a small heart charm.', ARRAY['Material: alloy, gold-plated', 'Length: 16-19 cm adjustable']),
    (6, 'fr', 'Bracelet Mira', 'Bracelet chaîne délicat avec petit pendentif cœur.', ARRAY['Materiau : alliage plaqué or', 'Longueur : 16-19 cm réglable']);
