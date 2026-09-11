package de.almo.backend.wishlist;

import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * wishlist_items has a composite primary key (user_id, product_id) and no other columns (see
 * V1__init.sql) - not worth a JPA entity/@IdClass for two plain SQL statements.
 */
@Repository
public class WishlistRepository {

  private final JdbcClient jdbcClient;

  public WishlistRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  public List<Long> findProductIds(long userId) {
    return jdbcClient
        .sql("SELECT product_id FROM wishlist_items WHERE user_id = :userId")
        .param("userId", userId)
        .query(Long.class)
        .list();
  }

  public void add(long userId, long productId) {
    jdbcClient
        .sql(
            """
            INSERT INTO wishlist_items (user_id, product_id) VALUES (:userId, :productId)
            ON CONFLICT DO NOTHING
            """)
        .param("userId", userId)
        .param("productId", productId)
        .update();
  }

  public void remove(long userId, long productId) {
    jdbcClient
        .sql("DELETE FROM wishlist_items WHERE user_id = :userId AND product_id = :productId")
        .param("userId", userId)
        .param("productId", productId)
        .update();
  }
}
