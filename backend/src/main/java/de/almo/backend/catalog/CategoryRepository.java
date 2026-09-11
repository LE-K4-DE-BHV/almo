package de.almo.backend.catalog;

import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class CategoryRepository {

  private final JdbcClient jdbcClient;

  public CategoryRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  public List<CategoryResponse> findAll(String lang) {
    return jdbcClient
        .sql(
            """
            SELECT c.key, ct.name
            FROM categories c
            JOIN category_translations ct ON ct.category_id = c.id AND ct.lang = :lang
            ORDER BY c.id
            """)
        .param("lang", lang)
        .query((rs, rowNum) -> new CategoryResponse(rs.getString("key"), rs.getString("name")))
        .list();
  }
}
