package de.almo.backend.catalog;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Split out from ProductSearchRepository (which is read-only by design, see its class comment) -
 * this is the one write path the catalog has before Sprint 5's admin CRUD: checkout decrements
 * stock.
 */
@Repository
public class ProductStockRepository {

  private final JdbcClient jdbcClient;

  public ProductStockRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  /**
   * Atomic, race-safe decrement: the WHERE clause re-checks stock at the moment of the UPDATE, not
   * at the moment some earlier SELECT ran - two concurrent checkouts for the last unit of a product
   * can't both succeed. Returns false (nothing updated) if there wasn't enough stock, letting the
   * caller roll back the whole order in one transaction rather than leaving a half-decremented
   * order behind.
   */
  public boolean decrementStock(long productId, int quantity) {
    int updated =
        jdbcClient
            .sql(
                "UPDATE products SET stock_quantity = stock_quantity - :quantity "
                    + "WHERE id = :id AND stock_quantity >= :quantity")
            .param("quantity", quantity)
            .param("id", productId)
            .update();
    return updated > 0;
  }
}
