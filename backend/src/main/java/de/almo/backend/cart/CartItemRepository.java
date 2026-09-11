package de.almo.backend.cart;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

  List<CartItem> findByUserId(Long userId);

  List<CartItem> findBySessionIdAndUserIdIsNull(String sessionId);

  Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);

  Optional<CartItem> findBySessionIdAndUserIdIsNullAndProductId(String sessionId, Long productId);
}
