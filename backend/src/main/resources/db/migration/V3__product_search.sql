-- Full-text search over product name + description, per Sprint 2 decision (docs/backlog.md).
-- 'simple' config (no stemming) instead of a language-specific one (german/french): each
-- product_translations row can be DE, EN, or FR depending on `lang`, and Postgres text-search
-- configs are picked per column, not per row - a single stemmed config would mis-stem whichever
-- languages it isn't tuned for. 'simple' is a deliberate compromise: worse recall (no "Ringe"
-- matching "Ring") but no wrong-language mangling. Revisit if search quality becomes a problem.
ALTER TABLE product_translations
    ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(description, '')), 'B')
    ) STORED;

CREATE INDEX idx_product_translations_search ON product_translations USING GIN (search_vector);
