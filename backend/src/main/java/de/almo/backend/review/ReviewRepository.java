package de.almo.backend.review;

import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Sprint 5 added admin moderation (status/rating only, see UpdateReviewRequest). The
 * customer-facing write path below (hasPurchased/hasReviewed/insert) was the one piece deferred
 * since Sprint 3 - orders exist as of Sprint 4, so there's finally something real to check a
 * purchase against.
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

  /** Gates review submission - "bought it" means at least one order_item for this product on one
      of this user's orders, regardless of order status (see Sprint 4/5 decisions - status here
      tracks admin follow-up, not payment, there's nothing stronger than "they ordered it" to
      check against). */
  public boolean hasPurchased(long userId, long productId) {
    Boolean result =
        jdbcClient
            .sql(
                """
                SELECT EXISTS (
                  SELECT 1 FROM order_items oi
                  JOIN orders o ON o.id = oi.order_id
                  WHERE o.user_id = :userId AND oi.product_id = :productId
                )
                """)
            .param("userId", userId)
            .param("productId", productId)
            .query(Boolean.class)
            .single();
    return Boolean.TRUE.equals(result);
  }

  /** One review per user per product - checked regardless of the existing review's status, so a
      hidden review still blocks a second submission rather than silently allowing a do-over. */
  public boolean hasReviewed(long userId, long productId) {
    Boolean result =
        jdbcClient
            .sql("SELECT EXISTS (SELECT 1 FROM reviews WHERE user_id = :userId AND product_id = :productId)")
            .param("userId", userId)
            .param("productId", productId)
            .query(Boolean.class)
            .single();
    return Boolean.TRUE.equals(result);
  }

  /** userName is passed in rather than re-joined from `users` - the caller (ReviewController)
      already has the authenticated User on hand from the purchase/duplicate checks. */
  public ReviewResponse insert(long productId, long userId, String userName, int rating, String comment) {
    return jdbcClient
        .sql(
            """
            INSERT INTO reviews (product_id, user_id, rating, comment)
            VALUES (:productId, :userId, :rating, :comment)
            RETURNING id, created_at
            """)
        .param("productId", productId)
        .param("userId", userId)
        .param("rating", rating)
        .param("comment", comment)
        .query(
            (rs, rowNum) ->
                new ReviewResponse(
                    rs.getLong("id"), userName, rating, comment, rs.getTimestamp("created_at").toInstant()))
        .single();
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
