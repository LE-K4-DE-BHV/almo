package de.almo.backend.catalog;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.generator.EventType;
import org.hibernate.type.SqlTypes;

/**
 * Write-side entity for Sprint 5's admin CRUD (see Category for why this coexists with the
 * JdbcClient-based read side instead of replacing it).
 *
 * <p>No relation to Category - categoryId is a plain FK column, same convention as CartItem's
 * productId: the admin form posts a category id, it doesn't need a loaded Category graph to do
 * that.
 */
@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "category_id", nullable = false)
  private Long categoryId;

  @Column(nullable = false)
  private BigDecimal price;

  @Column(name = "compare_at_price")
  private BigDecimal compareAtPrice;

  @Column(name = "stock_quantity", nullable = false)
  private Integer stockQuantity = 0;

  @Column(name = "metal_color")
  private String metalColor;

  private String badge;

  // Derived from stock_quantity by the database (see V1__init.sql) - Hibernate must never write
  // to this column, only re-read it after writes so the in-memory entity doesn't go stale the
  // moment stockQuantity changes.
  @Generated(event = {EventType.INSERT, EventType.UPDATE})
  @Column(insertable = false, updatable = false)
  private String status;

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "image_refs", columnDefinition = "text[]")
  private List<String> imageRefs = new ArrayList<>();

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<ProductTranslation> translations = new ArrayList<>();

  public Product(
      Long categoryId,
      BigDecimal price,
      BigDecimal compareAtPrice,
      Integer stockQuantity,
      String metalColor,
      String badge) {
    this.categoryId = categoryId;
    this.price = price;
    this.compareAtPrice = compareAtPrice;
    this.stockQuantity = stockQuantity;
    this.metalColor = metalColor;
    this.badge = badge;
  }

  public void addTranslation(ProductTranslation translation) {
    translations.add(translation);
    translation.setProduct(this);
  }
}
