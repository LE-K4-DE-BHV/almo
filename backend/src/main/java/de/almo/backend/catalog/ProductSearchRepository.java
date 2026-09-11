package de.almo.backend.catalog;

import java.sql.Array;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Deliberately not a Spring Data JPA repository / entity: the listing query joins two translation
 * tables, filters on an arbitrary subset of optional criteria, and needs a correlated-subquery
 * average rating - modeling that as JPA entities (plus mapping Postgres text[] and the generated
 * tsvector column through Hibernate) would fight the ORM for no benefit on what is, for now, a
 * read-only endpoint. Sprint 5's admin CRUD can introduce proper JPA entities for the write side
 * without this class needing to change.
 */
@Repository
public class ProductSearchRepository {

  private final JdbcClient jdbcClient;

  public ProductSearchRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  public List<ProductSummary> search(ProductSearchCriteria criteria) {
    StringBuilder sql =
        new StringBuilder(
            """
            SELECT
              p.id,
              c.key AS category_key,
              ct.name AS category_name,
              pt.name AS product_name,
              p.metal_color,
              p.badge,
              p.status,
              p.price,
              p.compare_at_price,
              p.image_refs,
              (SELECT avg(r.rating)::float FROM reviews r
                WHERE r.product_id = p.id AND r.status = 'PUBLISHED') AS avg_rating,
              (SELECT count(*) FROM reviews r
                WHERE r.product_id = p.id AND r.status = 'PUBLISHED') AS review_count
            FROM products p
            JOIN categories c ON c.id = p.category_id
            JOIN category_translations ct ON ct.category_id = c.id AND ct.lang = :lang
            JOIN product_translations pt ON pt.product_id = p.id AND pt.lang = :lang
            WHERE 1 = 1
            """);

    // Every filter is appended conditionally - JdbcClient still needs a value bound for each
    // :placeholder actually present in the SQL, so params are only added alongside their clause.
    if (criteria.categoryKey() != null) {
      sql.append(" AND c.key = :categoryKey\n");
    }
    if (criteria.minPrice() != null) {
      sql.append(" AND p.price >= :minPrice\n");
    }
    if (criteria.maxPrice() != null) {
      sql.append(" AND p.price <= :maxPrice\n");
    }
    if (criteria.metalColor() != null) {
      sql.append(" AND p.metal_color = :metalColor\n");
    }
    if (criteria.availability() != null) {
      sql.append(" AND p.status = :availability\n");
    }
    if (criteria.search() != null && !criteria.search().isBlank()) {
      sql.append(" AND pt.search_vector @@ plainto_tsquery('simple', :search)\n");
    }

    sql.append(" ORDER BY ").append(orderByClause(criteria));

    JdbcClient.StatementSpec spec = jdbcClient.sql(sql.toString()).param("lang", criteria.lang());
    if (criteria.categoryKey() != null) {
      spec = spec.param("categoryKey", criteria.categoryKey());
    }
    if (criteria.minPrice() != null) {
      spec = spec.param("minPrice", criteria.minPrice());
    }
    if (criteria.maxPrice() != null) {
      spec = spec.param("maxPrice", criteria.maxPrice());
    }
    if (criteria.metalColor() != null) {
      spec = spec.param("metalColor", criteria.metalColor());
    }
    if (criteria.availability() != null) {
      spec = spec.param("availability", criteria.availability());
    }
    if (criteria.search() != null && !criteria.search().isBlank()) {
      spec = spec.param("search", criteria.search());
    }

    return spec.query(
            (rs, rowNum) ->
                new ProductSummary(
                    rs.getLong("id"),
                    rs.getString("category_key"),
                    rs.getString("category_name"),
                    rs.getString("product_name"),
                    rs.getString("metal_color"),
                    rs.getString("badge"),
                    rs.getString("status"),
                    rs.getBigDecimal("price"),
                    rs.getBigDecimal("compare_at_price"),
                    toStringList(rs.getArray("image_refs")),
                    (Double) rs.getObject("avg_rating"), // nullable - no PUBLISHED reviews yet
                    rs.getLong("review_count")))
        .list();
  }

  /**
   * The sort value comes from a request parameter but is never concatenated into SQL directly -
   * only these hardcoded, whitelisted column expressions are, so there's no injection surface here
   * despite the dynamic ORDER BY.
   */
  private static String orderByClause(ProductSearchCriteria criteria) {
    String sort = criteria.sort();
    if (sort == null && criteria.search() != null && !criteria.search().isBlank()) {
      // No explicit sort chosen but this is a search - best matches first.
      return "ts_rank(pt.search_vector, plainto_tsquery('simple', :search)) DESC";
    }
    if (sort == null) {
      return "p.id DESC";
    }
    return switch (sort) {
      case "price-asc" -> "p.price ASC";
      case "price-desc" -> "p.price DESC";
      case "name" -> "pt.name ASC";
      case "rating" -> "avg_rating DESC NULLS LAST";
      default -> "p.id DESC";
    };
  }

  private static List<String> toStringList(Array sqlArray) {
    if (sqlArray == null) return List.of();
    try {
      Object[] raw = (Object[]) sqlArray.getArray();
      List<String> result = new ArrayList<>(raw.length);
      for (Object o : raw) result.add((String) o);
      return result;
    } catch (SQLException e) {
      throw new IllegalStateException("Failed to read image_refs array", e);
    }
  }
}
