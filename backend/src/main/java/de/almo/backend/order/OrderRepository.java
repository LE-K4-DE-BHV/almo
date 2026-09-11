package de.almo.backend.order;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

  // JOIN FETCH loads items eagerly in the same query - without it, `items` is a lazy collection
  // (see Order entity) that throws LazyInitializationException the moment anything touches it
  // after this method returns and the Hibernate session closes (OrderSummaryResponse.from calls
  // order.total(), which reads items - this bit us in practice, not just in theory).
  @Query(
      "SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.userId = :userId ORDER BY o.createdAt DESC")
  List<Order> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

  @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id = :id AND o.userId = :userId")
  Optional<Order> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}
