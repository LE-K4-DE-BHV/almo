package de.almo.backend.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Named distinctly from ProductSearchRepository (read side) - see CategoryJpaRepository. */
public interface ProductJpaRepository extends JpaRepository<Product, Long> {

  // JOIN FETCH for the same reason as CategoryJpaRepository - `translations` is lazy.
  @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.translations")
  List<Product> findAllWithTranslations();

  @Query("SELECT p FROM Product p LEFT JOIN FETCH p.translations WHERE p.id = :id")
  Optional<Product> findByIdWithTranslations(@Param("id") Long id);
}
