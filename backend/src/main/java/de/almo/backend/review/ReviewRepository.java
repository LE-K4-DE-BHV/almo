package de.almo.backend.review;

import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Read-only for now (Sprint 3, see docs/backlog.md): writing a review is gated on having bought the
 * product, which needs the orders table Sprint 4 populates - until then there's nothing real to
 * check a purchase against, so the write side isn't built yet. Sprint 5 adds admin moderation
 * (status/rating only, see UpdateReviewRequest) - still no customer-facing write endpoint.
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

  /**
   * Every review regardless of status - the admin moderation queue needs to see hidden ones too.
   */
  public List<AdminReviewResponse> findAllForAdmin() {
    return jdbcClient
        .sql(
            """
            SELECT r.id, r.product_id, pt.name AS product_name, u.name AS user_name,
                   r.rating, r.comment, r.status, r.created_at
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            JOIN product_translations pt ON pt.product_id = r.product_id AND pt.lang = 'de'
            ORDER BY r.created_at DESC
            """)
        .query(
            (rs, rowNum) ->
                new AdminReviewResponse(
                    rs.getLong("id"),
                    rs.getLong("product_id"),
                    rs.getString("product_name"),
                    rs.getString("user_name"),
                    rs.getInt("rating"),
                    rs.getString("comment"),
                    rs.getString("status"),
                    rs.getTimestamp("created_at").toInstant()))
        .list();
  }

  public boolean updateModeration(long id, ReviewStatus status, int rating) {
    int updated =
        jdbcClient
            .sql("UPDATE reviews SET status = :status, rating = :rating WHERE id = :id")
            .param("status", status.name())
            .param("rating", rating)
            .param("id", id)
            .update();
    return updated > 0;
  }
}
