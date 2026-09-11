package de.almo.backend.order;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
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

/**
 * No FK relation mapping to a User entity (there is no User JPA relation elsewhere in this codebase
 * either, see CartItem) - userId is a plain column, looked up against UserRepository where needed.
 *
 * <p>Deliberately no {@code ON DELETE CASCADE} on the underlying users_id FK (see V1__init.sql) -
 * order history must survive a customer deleting their account. See AccountService for how
 * self-deletion handles that.
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private OrderStatus status = OrderStatus.OPEN;

  @Enumerated(EnumType.STRING)
  @Column(name = "contact_preference", nullable = false)
  private ContactPreference contactPreference;

  @Column(name = "shipping_cost", nullable = false)
  private BigDecimal shippingCost;

  @Column(name = "shipping_name", nullable = false)
  private String shippingName;

  @Column(name = "shipping_address", nullable = false)
  private String shippingAddress;

  @Column(name = "shipping_city", nullable = false)
  private String shippingCity;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @OneToMany(
      mappedBy = "order",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  private List<OrderItem> items = new ArrayList<>();

  public Order(
      Long userId,
      ContactPreference contactPreference,
      BigDecimal shippingCost,
      String shippingName,
      String shippingAddress,
      String shippingCity) {
    this.userId = userId;
    this.contactPreference = contactPreference;
    this.shippingCost = shippingCost;
    this.shippingName = shippingName;
    this.shippingAddress = shippingAddress;
    this.shippingCity = shippingCity;
  }

  public void addItem(OrderItem item) {
    items.add(item);
    item.setOrder(this);
  }

  /** "ALM-000042" - derived from the id rather than stored separately, no collision risk. */
  public String orderNumber() {
    return "ALM-%06d".formatted(id);
  }

  public BigDecimal itemsTotal() {
    return items.stream()
        .map(item -> item.getPriceAtOrder().multiply(BigDecimal.valueOf(item.getQuantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  public BigDecimal total() {
    return itemsTotal().add(shippingCost);
  }
}
