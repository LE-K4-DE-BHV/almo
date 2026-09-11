package de.almo.backend.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * productName is a snapshot taken at checkout time, not a live lookup - see the Sprint 4 decision
 * in docs/backlog.md: order history must keep showing the name a customer actually bought under,
 * even after a product gets renamed or deleted (Sprint 5 makes both possible).
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "order_id", nullable = false)
  private Order order;

  @Column(name = "product_id", nullable = false)
  private Long productId;

  @Column(name = "product_name", nullable = false)
  private String productName;

  @Column(nullable = false)
  private Integer quantity;

  @Column(name = "price_at_order", nullable = false)
  private BigDecimal priceAtOrder;

  public OrderItem(Long productId, String productName, Integer quantity, BigDecimal priceAtOrder) {
    this.productId = productId;
    this.productName = productName;
    this.quantity = quantity;
    this.priceAtOrder = priceAtOrder;
  }
}
