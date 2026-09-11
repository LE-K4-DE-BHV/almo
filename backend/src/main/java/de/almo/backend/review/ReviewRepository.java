package de.almo.backend.review;

import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Read-only for now (Sprint 3, see docs/backlog.md): writing a review is gated on having bought the
 * product, which needs the orders table Sprint 4 populates - until then there's nothing real to
 * check a purchase against, so the write side isn't built yet.
 */
@Repository
public class ReviewRepository {

  private final JdbcClient jdbcClient;

  public ReviewRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  public List<ReviewResponse> findPublishedByProductId(long productId) {
    return jdbcClient
        .sql(
            """
            SELECT r.id, u.name AS user_name, r.rating, r.comment, r.created_at
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.product_id = :productId AND r.status = 'PUBLISHED'
            ORDER BY r.created_at DESC
            """)
        .param("productId", productId)
        .query(
            (rs, rowNum) ->
                new ReviewResponse(
                    rs.getLong("id"),
                    rs.getString("user_name"),
                    rs.getInt("rating"),
                    rs.getString("comment"),
                    rs.getTimestamp("created_at").toInstant()))
        .list();
  }
}
