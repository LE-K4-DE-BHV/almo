package de.almo.backend.order.admin;

import de.almo.backend.order.Order;
import de.almo.backend.order.OrderNotFoundException;
import de.almo.backend.order.OrderRepository;
import de.almo.backend.user.User;
import de.almo.backend.user.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminOrderService {

  private final OrderRepository orderRepository;
  private final UserRepository userRepository;

  public AdminOrderService(OrderRepository orderRepository, UserRepository userRepository) {
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
  }

  public List<AdminOrderResponse> list() {
    List<Order> orders = orderRepository.findAllWithItems();
    Map<Long, User> usersById =
        userRepository
            .findAllById(orders.stream().map(Order::getUserId).distinct().toList())
            .stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));

    return orders.stream()
        .map(
            order -> {
              User customer = usersById.get(order.getUserId());
              // A customer who self-deleted their account (Sprint 4) leaves their orders behind
              // on purpose (see AccountHasOrdersException) - the order survives, the user row
              // doesn't, so this can legitimately be null here.
              return AdminOrderResponse.from(
                  order,
                  customer != null ? customer.getName() : "(deleted account)",
                  customer != null ? customer.getEmail() : "-");
            })
        .toList();
  }

  @Transactional
  public AdminOrderResponse updateStatus(long id, UpdateOrderStatusRequest request) {
    Order order = orderRepository.findByIdWithItems(id).orElseThrow(OrderNotFoundException::new);
    order.setStatus(request.status());
    User customer = userRepository.findById(order.getUserId()).orElse(null);
    return AdminOrderResponse.from(
        order,
        customer != null ? customer.getName() : "(deleted account)",
        customer != null ? customer.getEmail() : "-");
  }
}
