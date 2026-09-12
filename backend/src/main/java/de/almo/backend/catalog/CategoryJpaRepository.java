package de.almo.backend.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Named distinctly from {@link CategoryRepository} (the JdbcClient-based read side, see Sprint 2)
 * so both can coexist in this package without a name clash - this one is Sprint 5's admin-CRUD
 * write path.
 */
public interface CategoryJpaRepository extends JpaRepository<Category, Long> {

  boolean existsByKey(String key);

  // JOIN FETCH loads translations eagerly - without it, `translations` is a lazy collection that
  // throws LazyInitializationException the moment AdminCategoryResponse.from() reads it outside
  // this method's transaction. Hit this in practice (Sprint 4 had the identical bug with
  // Order.items), not just in theory.
  @Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.translations")
  List<Category> findAllWithTranslations();

  @Query("SELECT c FROM Category c LEFT JOIN FETCH c.translations WHERE c.id = :id")
  Optional<Category> findByIdWithTranslations(@Param("id") Long id);
}
