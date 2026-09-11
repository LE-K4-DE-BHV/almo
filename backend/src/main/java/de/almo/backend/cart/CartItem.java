package de.almo.backend.cart;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Deliberately no {@code @ManyToOne} to a Product entity - there is no Product JPA entity (see
 * Sprint 2 decision: the catalog read side uses JdbcClient, not JPA). productId is looked up
 * against {@link de.almo.backend.catalog.ProductSearchRepository} instead, at the point a response
 * actually needs product details.
 *
 * <p>Exactly one of sessionId/userId is set at any time by convention (see CartService): guest
 * items carry sessionId, items get reassigned to userId once merged after login.
 */
@Entity
@Table(name = "cart_items")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CartItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "session_id")
  private String sessionId;

  @Column(name = "user_id")
  private Long userId;

  @Column(name = "product_id", nullable = false)
  private Long productId;

  @Column(nullable = false)
  private Integer quantity;

  public CartItem(String sessionId, Long userId, Long productId, Integer quantity) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.productId = productId;
    this.quantity = quantity;
  }
}
