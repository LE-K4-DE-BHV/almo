package de.almo.backend.catalog;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Write-side entity for Sprint 5's admin CRUD - the customer-facing browse/search path
 * (CategoryRepository, ProductSearchRepository) stays on JdbcClient as decided in Sprint 2; this is
 * a separate, purely admin-facing model, not a replacement for that one.
 */
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String key;

  @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<CategoryTranslation> translations = new ArrayList<>();

  public Category(String key) {
    this.key = key;
  }

  public void addTranslation(CategoryTranslation translation) {
    translations.add(translation);
    translation.setCategory(this);
  }
}
