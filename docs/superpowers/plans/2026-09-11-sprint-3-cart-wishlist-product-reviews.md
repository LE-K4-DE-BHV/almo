# Sprint 3 - Cart, Wishlist, Produktseite, Reviews - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guest+user cart with login-merge, auth-only wishlist, a real product detail page (gallery, sticky add-to-cart bar, buy-now, recently-viewed, reviews), and a purchase-gated review system - the full "Produktentdeckungs-Flow bis zum vollen Warenkorb" from docs/backlog.md Sprint 3.

**Architecture:** Backend adds three new feature packages (`cart`, `wishlist`, `review`) alongside the existing `catalog`/`auth`/`user` packages, following the same layering already in place: JPA entities + Spring Data repositories for owned, mutable rows (cart_items, reviews - mirrors `User`/`PasswordResetToken`), plain `JdbcClient` repositories for read-joins and the one wishlist table with no surrogate key (mirrors `ProductSearchRepository`/`CategoryRepository`). Frontend adds `CartProvider`/`WishlistProvider` (mirrors the existing `AuthProvider` pattern exactly) plus three new pages and wires the two placeholder buttons already stubbed in `Header.tsx`/`ProductCard.tsx` since Sprint 2.

**Tech Stack:** Spring Boot 4.1 / Java 25 / Spring Data JPA / `JdbcClient` / PostgreSQL / Flyway (backend, unchanged from Sprint 1-2), React 19 / TypeScript / react-router v8 / react-i18next / Tailwind v4 (frontend, unchanged).

**Spec:** `docs/superpowers/specs/2026-09-11-almo-shop-design.md` (data model, section 3 order flow), `docs/backlog.md` Sprint 3 section (task list this plan implements).

## Global Constraints

- Java: version floor per `backend/pom.xml` is Java 25; no new Maven dependency is needed for this sprint (JPA, validation, webmvc, security already present) - if a task seems to need one, stop and check `pom.xml` first.
- TypeScript: `erasableSyntaxOnly` is on (`frontend/tsconfig.app.json`) - never use constructor parameter-property shorthand; this project has no `import React from 'react'` anywhere, only named imports (`import { useState, type FormEvent } from 'react'`) - never write bare `React.something`.
- react-router v8: all exports (`Routes`, `Route`, `Link`, `useNavigate`, `useParams`, ...) come from the package `react-router`, never `react-router/dom`.
- Tailwind v4: any new bare (non-Tailwind) CSS rule must live inside `@layer base` in `frontend/src/index.css`, or it silently overrides every Tailwind utility - see the comment already there from the Sprint 2 bug. This plan adds no new bare CSS, but if a future task does, remember this.
- **Testing convention for this project (deliberate deviation from the generic TDD template):** Sprints 1-2 shipped with zero automated tests (`backend/src/test` still holds only the placeholder `BackendApplicationTests` context-load smoke test; `frontend/package.json` has no test runner at all) and were verified by direct `curl`/browser runs against the live VPS deployment after each change - see the "Durchgetestet"/"Manuell + ... durchgespielt" notes in `docs/backlog.md` for Sprint 1 and Sprint 2. This plan follows that same, already-established pattern: every task ends in a concrete `curl` (or browser) verification step with an expected result, not a JUnit/Vitest test file. Automated E2E tests are explicitly Sprint 6 scope per the backlog.
- Every backend endpoint returns/accepts JSON; every non-2xx response goes through `GlobalExceptionHandler` into the shared `ApiError { message }` shape - see existing handlers.
- Do not commit or push at any step unless the user says so explicitly (see project `CLAUDE.md`) - "Commit" steps below stage and commit locally only, framed as "ready to commit, do it once you (the user) give the go-ahead" is NOT how this plan is executed: the executing agent commits locally after each task (matching how Sprints 1-2 were built - see `git log`), but never pushes, and never force-anything.
- Write commit messages and any user-facing doc text as if the working developer wrote them - no "Claude", no AI self-reference anywhere (see project `CLAUDE.md`).

## Known, deliberate scope decisions (read before implementing)

1. **Guest cart identity: a dedicated `CART_SID` cookie, not Spring's `HttpSession`.** Spring Session's HTTP session (backed by Redis) is only created today when a user actually logs in (`HttpSessionSecurityContextRepository` only writes on `persistSession`) - an anonymous browsing session never gets one, and CSRF's `.spa()` mode uses its own cookie-based token independent of `HttpSession` too. Piggy-backing cart identity on `HttpSession` would mean forcing a session to exist for every anonymous visitor just to have an ID, entangling cart code with session-fixation/CSRF concerns it doesn't need. A dedicated long-lived (180-day), httpOnly, `SameSite=Lax` cookie is simpler, matches the `cart_items.session_id` column's actual purpose 1:1, and is exactly what the spec's own migration comment anticipates ("session_id is set for guests... cart merge happens in application code, see backlog Sprint 3").
2. **Reviews are purchase-gated against `orders`/`order_items` even though Sprint 4 (checkout) hasn't shipped yet.** Both tables already exist (`V1__init.sql`) and are structurally ready to query - the gate is implemented for real now (`EXISTS (... JOIN orders ...)`), it will just always say "not purchased" for every real customer until Sprint 4 starts writing order rows. Verification for this sprint inserts a fake `orders`/`order_items` row directly via SQL to exercise the "allowed" path - see Task 6.
3. **"Zuletzt angesehen" (recently viewed) stays client-only (`localStorage`), not a new backend table.** Section 8 of the spec says "serverseitig pro User statt localStorage", written before this level of implementation detail existed. Building a guest-and-user-aware recently-viewed table would duplicate the entire guest-identity mechanism Task 1-3 already build for the cart, for a feature with no business criticality (unlike the cart, losing recently-viewed state costs nothing). YAGNI: ships as a small `recentlyViewed.ts` helper storing the last 8 viewed products in the browser, per the writing-plans skill's "YAGNI ruthlessly" instruction. Flagging this explicitly rather than silently deviating from the spec text.
4. **"Jetzt kaufen" (buy now) navigates to `/cart`, not `/checkout`.** `/checkout` doesn't exist until Sprint 4. The button adds to cart then routes to the cart page; a one-line change swaps the target once Sprint 4 lands - noted with a code comment at the call site.
5. **No stock-quantity enforcement on cart add/update.** The spec's stock deduction happens at order placement (Sprint 4: "Backend: Order-Anlage, `stock_quantity`-Abzug"), not at cart time - a cart can hold more than is in stock; the UI just shows the product's current status (`in_stock`/`low_stock`/`out_of_stock`) next to each line so nothing hides that, but doesn't block it. Right-sized for Sprint 3; revisit only if Sprint 4 needs it.

---

## Task 1: Cart data layer - migration, entity, repository

**Files:**
- Create: `backend/src/main/resources/db/migration/V5__cart_unique_indexes.sql`
- Create: `backend/src/main/java/de/almo/backend/cart/CartItem.java`
- Create: `backend/src/main/java/de/almo/backend/cart/CartItemRepository.java`

**Interfaces:**
- Produces: `CartItem` (JPA entity, table `cart_items`) with constructors `CartItem(User user, long productId, int quantity)` and `CartItem(String sessionId, long productId, int quantity)`, getters/setters via Lombok (`getId()`, `getSessionId()`, `getUser()`, `getProductId()`, `getQuantity()`, `setQuantity(int)`).
- Produces: `CartItemRepository extends JpaRepository<CartItem, Long>` with `findByUser(User)`, `findBySessionId(String)`, `findByUserAndProductId(User, long)`, `findBySessionIdAndProductId(String, long)`, `deleteByUserAndProductId(User, long)`, `deleteBySessionIdAndProductId(String, long)`, `deleteBySessionId(String)`.

- [ ] **Step 1: Write the migration**

```sql
-- Sprint 3: lets CartService find-or-create a row per owner+product instead of always
-- inserting a new one - V1__init.sql's cart_items table allowed unlimited duplicate rows
-- for the same owner+product, this closes that gap. Two partial unique indexes (not one
-- plain unique constraint) because exactly one of session_id/user_id is set per row (see
-- the cart_items_owner_present CHECK in V1) - a single index across both columns would
-- treat two different guests' rows (same NULL user_id) as conflicting with each other.
CREATE UNIQUE INDEX ux_cart_items_user_product ON cart_items (user_id, product_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX ux_cart_items_session_product ON cart_items (session_id, product_id) WHERE session_id IS NOT NULL;
```

- [ ] **Step 2: Write the entity**

```java
package de.almo.backend.cart;

import de.almo.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A cart row belongs to either a guest (sessionId, from the CART_SID cookie - see
 * CartGuestIdentity) or a logged-in user, never both - see the cart_items_owner_present CHECK in
 * V1__init.sql. product_id is a plain column, not a @ManyToOne: Product isn't a JPA entity yet
 * (the catalog stays JdbcClient-only/read-only until Sprint 5's admin CRUD, see
 * ProductSearchRepository's class comment) - product display data for the cart view is looked up
 * separately, see CartService.
 */
@Entity
@Table(name = "cart_items")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CartItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "session_id")
  private String sessionId;

  @ManyToOne
  @JoinColumn(name = "user_id")
  private User user;

  @Column(name = "product_id", nullable = false)
  private Long productId;

  @Column(nullable = false)
  private int quantity;

  public CartItem(User user, long productId, int quantity) {
    this.user = user;
    this.productId = productId;
    this.quantity = quantity;
  }

  public CartItem(String sessionId, long productId, int quantity) {
    this.sessionId = sessionId;
    this.productId = productId;
    this.quantity = quantity;
  }
}
```

- [ ] **Step 3: Write the repository**

```java
package de.almo.backend.cart;

import de.almo.backend.user.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

  List<CartItem> findByUser(User user);

  List<CartItem> findBySessionId(String sessionId);

  Optional<CartItem> findByUserAndProductId(User user, long productId);

  Optional<CartItem> findBySessionIdAndProductId(String sessionId, long productId);

  void deleteByUserAndProductId(User user, long productId);

  void deleteBySessionIdAndProductId(String sessionId, long productId);

  void deleteBySessionId(String sessionId);
}
```

- [ ] **Step 4: Verify the migration applies cleanly**

Run (on the dev machine, against the local docker-compose Postgres - adjust host/creds to match your local `.env`):

```bash
cd backend && ./mvnw spring-boot:run
```

Expected: startup log shows `Migrating schema "public" to version "5 - cart unique indexes"` and `Successfully applied 1 migration`, then the app starts normally (same as every prior migration). Stop it with Ctrl+C once confirmed - this task has no runtime behavior to click through yet (no endpoints reference `CartItem` until Task 2).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/resources/db/migration/V5__cart_unique_indexes.sql backend/src/main/java/de/almo/backend/cart/CartItem.java backend/src/main/java/de/almo/backend/cart/CartItemRepository.java
git commit -m "Add cart_items unique indexes and CartItem JPA entity/repository"
```

---

## Task 2: Cart service, controller, guest identity cookie

**Files:**
- Create: `backend/src/main/java/de/almo/backend/cart/CartGuestIdentity.java`
- Create: `backend/src/main/java/de/almo/backend/cart/CartItemView.java`
- Create: `backend/src/main/java/de/almo/backend/cart/CartResponse.java`
- Create: `backend/src/main/java/de/almo/backend/cart/AddToCartRequest.java`
- Create: `backend/src/main/java/de/almo/backend/cart/UpdateCartItemRequest.java`
- Create: `backend/src/main/java/de/almo/backend/cart/CartItemNotFoundException.java`
- Create: `backend/src/main/java/de/almo/backend/cart/CartService.java`
- Create: `backend/src/main/java/de/almo/backend/cart/CartController.java`
- Modify: `backend/src/main/java/de/almo/backend/catalog/ProductSearchRepository.java` (add `findSummariesByIds`, refactor row mapping into a reusable method - see Task 4, done together here since `CartService` needs `findSummariesByIds` to compile)
- Modify: `backend/src/main/java/de/almo/backend/security/SecurityConfig.java` (permitAll on `/api/cart/**`)
- Modify: `backend/src/main/java/de/almo/backend/common/GlobalExceptionHandler.java` (handle `CartItemNotFoundException`)

**Interfaces:**
- Consumes: `ProductSearchRepository.findSummariesByIds(List<Long>, String)` (built in this task, reused again by Task 5's `WishlistService`), `ProductSearchRepository.existsById(long)` (built in this task).
- Produces: `CartService.getCart/addItem/updateItemQuantity/removeItem(...)` returning `CartResponse`, all take `(Authentication, HttpServletRequest, HttpServletResponse, ..., String lang)`. `CartService.mergeGuestCartAfterLogin(HttpServletRequest, HttpServletResponse, User)` - consumed by Task 3.
- Produces: `CartGuestIdentity.resolve/readOnly/clear` - consumed by `CartService` here and again by Task 3.

- [ ] **Step 1: Extend `ProductSearchRepository` with a batch lookup and an existence check**

Replace the whole file (the row-mapping lambda in `search()` becomes a named method so `findSummariesByIds` can reuse it - this is the only change to existing behavior, `search()`'s output is unchanged):

```java
package de.almo.backend.catalog;

import java.math.BigDecimal;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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

  // Shared by search() and findSummariesByIds() - both need the same joined/aggregated shape,
  // just filtered differently. Not reused by findById() in Task 4: that query needs two extra
  // columns (description, details) in the SELECT list itself, which can't be spliced into the
  // middle of this constant without string surgery - a second, self-contained query is safer.
  private static final String SUMMARY_SELECT =
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
      """;

  private final JdbcClient jdbcClient;

  public ProductSearchRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  public List<ProductSummary> search(ProductSearchCriteria criteria) {
    StringBuilder sql = new StringBuilder(SUMMARY_SELECT).append("WHERE 1 = 1\n");

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

    return spec.query(this::mapSummaryRow).list();
  }

  /**
   * Sprint 3: batch product lookup for the cart/wishlist views, which each hold a list of product
   * ids and need current name/price/image/status for display - one round trip instead of N. Keyed
   * by id so callers can look up display data per cart/wishlist row in O(1).
   */
  public Map<Long, ProductSummary> findSummariesByIds(List<Long> ids, String lang) {
    if (ids.isEmpty()) return Map.of();
    List<ProductSummary> rows =
        jdbcClient
            .sql(SUMMARY_SELECT + "WHERE p.id IN (:ids)")
            .param("lang", lang)
            .param("ids", ids)
            .query(this::mapSummaryRow)
            .list();
    return rows.stream().collect(Collectors.toMap(ProductSummary::id, r -> r));
  }

  /** Sprint 3: cart/wishlist/review writes all need to 404 cleanly on an unknown product id
      instead of letting a foreign-key violation surface as a raw 500. */
  public boolean existsById(long id) {
    Boolean result =
        jdbcClient
            .sql("SELECT EXISTS (SELECT 1 FROM products WHERE id = :id)")
            .param("id", id)
            .query(Boolean.class)
            .single();
    return Boolean.TRUE.equals(result);
  }

  private ProductSummary mapSummaryRow(ResultSet rs, int rowNum) throws SQLException {
    return new ProductSummary(
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
        (Double) rs.getObject("avg_rating"),
        rs.getLong("review_count"));
  }

  /**
   * The sort value comes from a request parameter but is never concatenated into SQL directly -
   * only these hardcoded, whitelisted column expressions are, so there's no injection surface here
   * despite the dynamic ORDER BY.
   */
  private static String orderByClause(ProductSearchCriteria criteria) {
    String sort = criteria.sort();
    if (sort == null && criteria.search() != null && !criteria.search().isBlank()) {
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
      throw new IllegalStateException("Failed to read array column", e);
    }
  }
}
```

- [ ] **Step 2: Write `CartGuestIdentity`**

```java
package de.almo.backend.cart;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * A guest's cart identity lives in its own cookie, not Spring's HttpSession - see "Known,
 * deliberate scope decisions" #1 in the Sprint 3 plan for why. `cookieSecure` mirrors the same
 * property the session cookie uses (server.servlet.session.cookie.secure) so local plain-HTTP dev
 * and the HTTPS-only VPS both get a working cookie without a second env var to remember.
 */
@Component
public class CartGuestIdentity {

  private static final String COOKIE_NAME = "CART_SID";
  private static final Duration MAX_AGE = Duration.ofDays(180);

  private final boolean cookieSecure;

  public CartGuestIdentity(@Value("${server.servlet.session.cookie.secure}") boolean cookieSecure) {
    this.cookieSecure = cookieSecure;
  }

  /** Returns the visitor's existing guest cart id, or creates and sets a new one. */
  public String resolve(HttpServletRequest request, HttpServletResponse response) {
    String existing = readOnly(request);
    if (existing != null) return existing;
    String value = UUID.randomUUID().toString();
    setCookie(response, value, MAX_AGE);
    return value;
  }

  /** Returns the visitor's existing guest cart id without creating one - null if they have none. */
  public String readOnly(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) return null;
    for (Cookie cookie : cookies) {
      if (COOKIE_NAME.equals(cookie.getName())) return cookie.getValue();
    }
    return null;
  }

  /** Called once a guest cart has been merged into a user account on login - see CartService. */
  public void clear(HttpServletResponse response) {
    setCookie(response, "", Duration.ZERO);
  }

  private void setCookie(HttpServletResponse response, String value, Duration maxAge) {
    ResponseCookie cookie =
        ResponseCookie.from(COOKIE_NAME, value)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Lax")
            .path("/")
            .maxAge(maxAge)
            .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }
}
```

- [ ] **Step 3: Write the response/request DTOs and the not-found exception**

```java
// backend/src/main/java/de/almo/backend/cart/CartItemView.java
package de.almo.backend.cart;

import java.math.BigDecimal;

/** One cart line as the frontend needs to render it - already resolved against current product
    data (name/price/image/status), not just the raw productId+quantity the DB row holds. */
public record CartItemView(
    long productId,
    String name,
    String imageRef,
    String status,
    BigDecimal price,
    int quantity,
    BigDecimal lineTotal) {}
```

```java
// backend/src/main/java/de/almo/backend/cart/CartResponse.java
package de.almo.backend.cart;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(List<CartItemView> items, BigDecimal subtotal) {}
```

```java
// backend/src/main/java/de/almo/backend/cart/AddToCartRequest.java
package de.almo.backend.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AddToCartRequest(@NotNull Long productId, @NotNull @Min(1) Integer quantity) {}
```

```java
// backend/src/main/java/de/almo/backend/cart/UpdateCartItemRequest.java
package de.almo.backend.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateCartItemRequest(@NotNull @Min(1) Integer quantity) {}
```

```java
// backend/src/main/java/de/almo/backend/cart/CartItemNotFoundException.java
package de.almo.backend.cart;

public class CartItemNotFoundException extends RuntimeException {
  public CartItemNotFoundException() {
    super("Cart item not found");
  }
}
```

- [ ] **Step 4: Write `CartService`**

```java
package de.almo.backend.cart;

import de.almo.backend.catalog.ProductNotFoundException;
import de.almo.backend.catalog.ProductSearchRepository;
import de.almo.backend.catalog.ProductSummary;
import de.almo.backend.user.User;
import de.almo.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

  private final CartItemRepository cartItemRepository;
  private final ProductSearchRepository productSearchRepository;
  private final UserRepository userRepository;
  private final CartGuestIdentity guestIdentity;

  public CartService(
      CartItemRepository cartItemRepository,
      ProductSearchRepository productSearchRepository,
      UserRepository userRepository,
      CartGuestIdentity guestIdentity) {
    this.cartItemRepository = cartItemRepository;
    this.productSearchRepository = productSearchRepository;
    this.userRepository = userRepository;
    this.guestIdentity = guestIdentity;
  }

  public CartResponse getCart(
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response,
      String lang) {
    return toResponse(loadItems(authentication, request, response), lang);
  }

  @Transactional
  public CartResponse addItem(
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response,
      long productId,
      int quantity,
      String lang) {
    requireProductExists(productId);
    User user = authenticatedUserOrNull(authentication);
    if (user != null) {
      upsert(cartItemRepository.findByUserAndProductId(user, productId), quantity, () -> new CartItem(user, productId, quantity));
    } else {
      String sessionId = guestIdentity.resolve(request, response);
      upsert(
          cartItemRepository.findBySessionIdAndProductId(sessionId, productId),
          quantity,
          () -> new CartItem(sessionId, productId, quantity));
    }
    return getCart(authentication, request, response, lang);
  }

  @Transactional
  public CartResponse updateItemQuantity(
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response,
      long productId,
      int quantity,
      String lang) {
    CartItem item = findOwnedItem(authentication, request, response, productId);
    item.setQuantity(quantity);
    cartItemRepository.save(item);
    return getCart(authentication, request, response, lang);
  }

  @Transactional
  public CartResponse removeItem(
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response,
      long productId,
      String lang) {
    User user = authenticatedUserOrNull(authentication);
    if (user != null) {
      cartItemRepository.deleteByUserAndProductId(user, productId);
    } else {
      cartItemRepository.deleteBySessionIdAndProductId(guestIdentity.resolve(request, response), productId);
    }
    return getCart(authentication, request, response, lang);
  }

  /**
   * Called from AuthController right after a successful login/register (see Task 3) - folds any
   * guest cart the visitor had (identified by their CART_SID cookie, if any) into their new
   * account's cart, summing quantities for products present in both, then clears the guest cookie
   * so a later logout on the same browser doesn't resurrect the merged rows as a "new" guest cart.
   */
  @Transactional
  public void mergeGuestCartAfterLogin(HttpServletRequest request, HttpServletResponse response, User user) {
    String sessionId = guestIdentity.readOnly(request);
    if (sessionId == null) return;

    for (CartItem guestItem : cartItemRepository.findBySessionId(sessionId)) {
      upsert(
          cartItemRepository.findByUserAndProductId(user, guestItem.getProductId()),
          guestItem.getQuantity(),
          () -> new CartItem(user, guestItem.getProductId(), guestItem.getQuantity()));
    }
    cartItemRepository.deleteBySessionId(sessionId);
    guestIdentity.clear(response);
  }

  private void upsert(Optional<CartItem> existing, int quantityDelta, Supplier<CartItem> factoryForNewRow) {
    if (existing.isPresent()) {
      CartItem item = existing.get();
      item.setQuantity(item.getQuantity() + quantityDelta);
      cartItemRepository.save(item);
    } else {
      cartItemRepository.save(factoryForNewRow.get());
    }
  }

  private CartItem findOwnedItem(
      Authentication authentication, HttpServletRequest request, HttpServletResponse response, long productId) {
    User user = authenticatedUserOrNull(authentication);
    Optional<CartItem> item =
        user != null
            ? cartItemRepository.findByUserAndProductId(user, productId)
            : cartItemRepository.findBySessionIdAndProductId(guestIdentity.resolve(request, response), productId);
    return item.orElseThrow(CartItemNotFoundException::new);
  }

  private List<CartItem> loadItems(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
    User user = authenticatedUserOrNull(authentication);
    return user != null
        ? cartItemRepository.findByUser(user)
        : cartItemRepository.findBySessionId(guestIdentity.resolve(request, response));
  }

  private User authenticatedUserOrNull(Authentication authentication) {
    if (authentication == null || authentication instanceof AnonymousAuthenticationToken) return null;
    return userRepository
        .findByEmail(authentication.getName())
        .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + authentication.getName()));
  }

  private void requireProductExists(long productId) {
    if (!productSearchRepository.existsById(productId)) throw new ProductNotFoundException();
  }

  private CartResponse toResponse(List<CartItem> items, String lang) {
    if (items.isEmpty()) return new CartResponse(List.of(), BigDecimal.ZERO);

    List<Long> ids = items.stream().map(CartItem::getProductId).distinct().toList();
    Map<Long, ProductSummary> products = productSearchRepository.findSummariesByIds(ids, lang);

    List<CartItemView> views = new ArrayList<>();
    BigDecimal subtotal = BigDecimal.ZERO;
    for (CartItem item : items) {
      ProductSummary product = products.get(item.getProductId());
      if (product == null) continue; // product no longer exists - skip silently, nothing to show
      BigDecimal lineTotal = product.price().multiply(BigDecimal.valueOf(item.getQuantity()));
      subtotal = subtotal.add(lineTotal);
      views.add(
          new CartItemView(
              item.getProductId(),
              product.name(),
              product.imageRefs().isEmpty() ? null : product.imageRefs().get(0),
              product.status(),
              product.price(),
              item.getQuantity(),
              lineTotal));
    }
    return new CartResponse(views, subtotal);
  }
}
```

- [ ] **Step 5: Write `CartController`**

```java
package de.almo.backend.cart;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** permitAll under /api/cart/** (see SecurityConfig) - works for both guests and logged-in users,
    CartService branches on Authentication internally. */
@RestController
@RequestMapping("/api/cart")
public class CartController {

  private final CartService cartService;

  public CartController(CartService cartService) {
    this.cartService = cartService;
  }

  @GetMapping
  public CartResponse get(
      @RequestParam(defaultValue = "de") String lang,
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response) {
    return cartService.getCart(authentication, request, response, lang);
  }

  @PostMapping("/items")
  public CartResponse add(
      @RequestParam(defaultValue = "de") String lang,
      @Valid @RequestBody AddToCartRequest body,
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response) {
    return cartService.addItem(authentication, request, response, body.productId(), body.quantity(), lang);
  }

  @PutMapping("/items/{productId}")
  public CartResponse update(
      @PathVariable long productId,
      @RequestParam(defaultValue = "de") String lang,
      @Valid @RequestBody UpdateCartItemRequest body,
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response) {
    return cartService.updateItemQuantity(authentication, request, response, productId, body.quantity(), lang);
  }

  @DeleteMapping("/items/{productId}")
  public CartResponse remove(
      @PathVariable long productId,
      @RequestParam(defaultValue = "de") String lang,
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response) {
    return cartService.removeItem(authentication, request, response, productId, lang);
  }
}
```

- [ ] **Step 6: Open `/api/cart/**` in `SecurityConfig`**

In `customerFilterChain`, add one more `.requestMatchers(...).permitAll()` line (guest carts must work without any account) - insert it among the existing permitAll rules, before `.anyRequest().authenticated()`:

```java
                registry
                    .requestMatchers("/api/auth/**")
                    .permitAll()
                    .requestMatchers("/actuator/health")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/products/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/categories/**")
                    .permitAll()
                    .requestMatchers("/api/cart/**")
                    .permitAll()
                    .anyRequest()
                    .authenticated());
```

- [ ] **Step 7: Handle `CartItemNotFoundException` in `GlobalExceptionHandler`**

Add this method to the existing class (alongside `handleEmailTaken`/`handleInvalidResetToken`):

```java
  @ExceptionHandler(de.almo.backend.cart.CartItemNotFoundException.class)
  public ResponseEntity<ApiError> handleCartItemNotFound(de.almo.backend.cart.CartItemNotFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(e.getMessage()));
  }
```

(Fully-qualified inline rather than a new import, matching this being the first cross-package exception this file handles from outside `auth` - either style is fine; this keeps the diff to one line. `ProductNotFoundException` is handled in Task 4, not here, since it's created there.)

- [ ] **Step 8: Verify with curl against the local backend**

Start the stack locally (`docker compose up -d --build` or `./mvnw spring-boot:run` against a running local Postgres/Redis) and run:

```bash
# Guest add - no cookies yet, expect the response to include a Set-Cookie: CART_SID=...
curl -si -X POST http://localhost:8094/api/cart/items \
  -H "Content-Type: application/json" -c /tmp/almo-cart-cookies.txt \
  -d '{"productId": 1, "quantity": 2}'
# Expected: 200, body has items:[{productId:1, quantity:2, ...}], subtotal > 0, a Set-Cookie: CART_SID=... header

# Same guest, add again - should increment, not duplicate
curl -s -X POST http://localhost:8094/api/cart/items \
  -H "Content-Type: application/json" -b /tmp/almo-cart-cookies.txt \
  -d '{"productId": 1, "quantity": 1}'
# Expected: items still has exactly one entry for productId 1, quantity: 3

# Unknown product - expect 404
curl -si -X POST http://localhost:8094/api/cart/items \
  -H "Content-Type: application/json" -b /tmp/almo-cart-cookies.txt \
  -d '{"productId": 999999, "quantity": 1}'
# Expected: HTTP/1.1 404, body {"message":"Product not found"} (once Task 4 defines ProductNotFoundException's message)

# Remove
curl -s -X DELETE http://localhost:8094/api/cart/items/1 -b /tmp/almo-cart-cookies.txt
# Expected: items: [], subtotal: 0
```

Note: the 404 case needs Task 4's `ProductNotFoundException` to exist to compile - if running Task 2 before Task 4, temporarily skip that one curl check and come back to it once Task 4 lands (or do Task 4 first; the plan lists them in dependency order but `ProductSearchRepository`'s new methods were already written in this task's Step 1, so only the exception class itself is missing).

- [ ] **Step 9: Commit**

```bash
git add backend/src/main/java/de/almo/backend/cart backend/src/main/java/de/almo/backend/catalog/ProductSearchRepository.java backend/src/main/java/de/almo/backend/security/SecurityConfig.java backend/src/main/java/de/almo/backend/common/GlobalExceptionHandler.java
git commit -m "Add cart API: guest+user items, upsert-on-add, CART_SID guest identity"
```

---

## Task 3: Wire cart merge into login/register

**Files:**
- Modify: `backend/src/main/java/de/almo/backend/auth/AuthController.java`

**Interfaces:**
- Consumes: `CartService.mergeGuestCartAfterLogin(HttpServletRequest, HttpServletResponse, User)` from Task 2.

- [ ] **Step 1: Inject `CartService` and call the merge after `persistSession` in both `register` and `login`**

```java
package de.almo.backend.auth;

import de.almo.backend.auth.dto.LoginRequest;
import de.almo.backend.auth.dto.PasswordResetConfirmDto;
import de.almo.backend.auth.dto.PasswordResetRequestDto;
import de.almo.backend.auth.dto.RegisterRequest;
import de.almo.backend.auth.dto.UserResponse;
import de.almo.backend.cart.CartService;
import de.almo.backend.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Customer-facing auth endpoints, permitAll under /api/auth/** (see SecurityConfig). */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final CartService cartService;

  public AuthController(AuthService authService, CartService cartService) {
    this.authService = authService;
    this.cartService = cartService;
  }

  @PostMapping("/register")
  public UserResponse register(
      @Valid @RequestBody RegisterRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) {
    User user = authService.register(request);
    // Registering logs the user in immediately, matching the old localStorage-based flow
    // (almofrontenddesign/js/auth.js registerUser()) - no separate "please log in" step.
    Authentication authentication =
        authService.authenticate(new LoginRequest(request.email(), request.password()));
    authService.persistSession(authentication, httpRequest, httpResponse);
    // A brand-new account can still have a guest cart from browsing before registering -
    // fold it in the same way a returning user's login does (see CartService).
    cartService.mergeGuestCartAfterLogin(httpRequest, httpResponse, user);
    return UserResponse.from(user);
  }

  @PostMapping("/login")
  public UserResponse login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) {
    Authentication authentication = authService.authenticate(request);
    authService.persistSession(authentication, httpRequest, httpResponse);
    User user = authService.findByEmail(authentication.getName());
    cartService.mergeGuestCartAfterLogin(httpRequest, httpResponse, user);
    return UserResponse.from(user);
  }

  /**
   * Lets the SPA figure out on page load whether the session cookie it's holding is still valid,
   * without guessing from cookie presence alone (the cookie can exist and still be an expired/
   * invalidated session). {@code /api/auth/**} is permitAll (see SecurityConfig), so an anonymous
   * caller reaches this method with an {@link AnonymousAuthenticationToken}, not a null
   * Authentication - that's what's actually checked for "not logged in".
   */
  @GetMapping("/me")
  public ResponseEntity<UserResponse> me(Authentication authentication) {
    if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
      return ResponseEntity.status(401).build();
    }
    return ResponseEntity.ok(UserResponse.from(authService.findByEmail(authentication.getName())));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
    new SecurityContextLogoutHandler().logout(request, response, authentication);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/password-reset/request")
  public ResponseEntity<Void> requestPasswordReset(
      @Valid @RequestBody PasswordResetRequestDto request) {
    authService.requestPasswordReset(request.email());
    // 202: "we accepted this", not "we found an account and emailed it" - see AuthService.
    return ResponseEntity.accepted().build();
  }

  @PostMapping("/password-reset/confirm")
  public ResponseEntity<Void> confirmPasswordReset(
      @Valid @RequestBody PasswordResetConfirmDto request) {
    authService.confirmPasswordReset(request.token(), request.newPassword());
    return ResponseEntity.noContent().build();
  }
}
```

- [ ] **Step 2: Verify the merge with curl**

```bash
rm -f /tmp/almo-merge-cookies.txt
# 1. Add to cart as a guest.
curl -s -X POST http://localhost:8094/api/cart/items \
  -H "Content-Type: application/json" -c /tmp/almo-merge-cookies.txt \
  -d '{"productId": 2, "quantity": 1}' | head -c 200
# 2. Register a fresh account on the SAME cookie jar (so the CART_SID cookie rides along).
EMAIL="cartmerge+$(date +%s)@example.com"
curl -s -X POST http://localhost:8094/api/auth/register \
  -H "Content-Type: application/json" -c /tmp/almo-merge-cookies.txt -b /tmp/almo-merge-cookies.txt \
  -d "{\"email\":\"$EMAIL\",\"password\":\"TestPass123!\",\"name\":\"Merge Test\"}" >/dev/null
# 3. Fetch the cart again on the same cookie jar - now authenticated.
curl -s http://localhost:8094/api/cart -b /tmp/almo-merge-cookies.txt
```

Expected: the final `GET /api/cart` response still shows `productId: 2, quantity: 1` even though the request is now authenticated (proves the guest row survived the merge into the new user's cart, and wasn't lost).

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/de/almo/backend/auth/AuthController.java
git commit -m "Merge guest cart into account on register/login"
```

---

## Task 4: Product detail endpoint

**Files:**
- Create: `backend/src/main/java/de/almo/backend/catalog/ProductDetail.java`
- Create: `backend/src/main/java/de/almo/backend/catalog/ProductNotFoundException.java`
- Modify: `backend/src/main/java/de/almo/backend/catalog/ProductSearchRepository.java` (add `findById`)
- Modify: `backend/src/main/java/de/almo/backend/catalog/ProductController.java` (add `GET /{id}`)
- Modify: `backend/src/main/java/de/almo/backend/common/GlobalExceptionHandler.java` (handle `ProductNotFoundException`)

**Interfaces:**
- Produces: `ProductSearchRepository.findById(long, String) -> Optional<ProductDetail>`, `ProductNotFoundException` (404, message `"Product not found"`) - both consumed already by Task 2/`CartService` (which throws `ProductNotFoundException`) and later by Task 5 (`WishlistService`) and Task 6 (`ReviewService`).

- [ ] **Step 1: Write `ProductDetail`**

```java
package de.almo.backend.catalog;

import java.math.BigDecimal;
import java.util.List;

/** ProductSummary's shape plus the long-form fields only the product detail page needs. */
public record ProductDetail(
    long id,
    String categoryKey,
    String categoryName,
    String name,
    String description,
    List<String> details,
    String metalColor,
    String badge,
    String status,
    BigDecimal price,
    BigDecimal compareAtPrice,
    List<String> imageRefs,
    Double avgRating,
    long reviewCount) {}
```

- [ ] **Step 2: Write `ProductNotFoundException`**

```java
package de.almo.backend.catalog;

public class ProductNotFoundException extends RuntimeException {
  public ProductNotFoundException() {
    super("Product not found");
  }
}
```

- [ ] **Step 3: Add `findById` to `ProductSearchRepository`**

Add this method to the class from Task 2 (alongside `search`/`findSummariesByIds`/`existsById`):

```java
  /** Sprint 3: the product detail page needs description/details on top of the summary shape -
      its own self-contained query rather than reusing SUMMARY_SELECT, see that constant's comment. */
  public java.util.Optional<ProductDetail> findById(long id, String lang) {
    return jdbcClient
        .sql(
            """
            SELECT
              p.id,
              c.key AS category_key,
              ct.name AS category_name,
              pt.name AS product_name,
              pt.description,
              pt.details,
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
            WHERE p.id = :id
            """)
        .param("lang", lang)
        .param("id", id)
        .query(
            (rs, rowNum) ->
                new ProductDetail(
                    rs.getLong("id"),
                    rs.getString("category_key"),
                    rs.getString("category_name"),
                    rs.getString("product_name"),
                    rs.getString("description"),
                    toStringList(rs.getArray("details")),
                    rs.getString("metal_color"),
                    rs.getString("badge"),
                    rs.getString("status"),
                    rs.getBigDecimal("price"),
                    rs.getBigDecimal("compare_at_price"),
                    toStringList(rs.getArray("image_refs")),
                    (Double) rs.getObject("avg_rating"),
                    rs.getLong("review_count")))
        .optional();
  }
```

- [ ] **Step 4: Add the detail endpoint to `ProductController`**

```java
package de.almo.backend.catalog;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

  private final ProductSearchRepository productSearchRepository;

  public ProductController(ProductSearchRepository productSearchRepository) {
    this.productSearchRepository = productSearchRepository;
  }

  @GetMapping
  public List<ProductSummary> list(
      @RequestParam(defaultValue = "de") String lang,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) BigDecimal minPrice,
      @RequestParam(required = false) BigDecimal maxPrice,
      @RequestParam(required = false) String metalColor,
      @RequestParam(required = false) String availability,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String sort) {
    return productSearchRepository.search(
        new ProductSearchCriteria(
            lang, category, minPrice, maxPrice, metalColor, availability, search, sort));
  }

  @GetMapping("/{id}")
  public ProductDetail get(@PathVariable long id, @RequestParam(defaultValue = "de") String lang) {
    return productSearchRepository.findById(id, lang).orElseThrow(ProductNotFoundException::new);
  }
}
```

- [ ] **Step 5: Handle `ProductNotFoundException` in `GlobalExceptionHandler`**

```java
  @ExceptionHandler(ProductNotFoundException.class)
  public ResponseEntity<ApiError> handleProductNotFound(ProductNotFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(e.getMessage()));
  }
```

(`ProductNotFoundException` is in `de.almo.backend.catalog`, same as `EmailAlreadyRegisteredException`'s cross-package import from `auth` already in this file - add `import de.almo.backend.catalog.ProductNotFoundException;` at the top alongside the existing imports.)

- [ ] **Step 6: Verify with curl**

```bash
curl -s "http://localhost:8094/api/products/1?lang=de" | python3 -m json.tool
# Expected: 200, full object with "description" and "details" (array) present, matching the V4 dev seed data for product id 1.

curl -si "http://localhost:8094/api/products/999999?lang=de"
# Expected: HTTP/1.1 404, {"message":"Product not found"}
```

Then re-run Task 2 Step 8's skipped 404 check (`POST /api/cart/items` with an unknown `productId`) - it should now also return 404 with the same message.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/de/almo/backend/catalog
git commit -m "Add product detail endpoint (GET /api/products/{id})"
```

---

## Task 5: Wishlist backend

**Files:**
- Create: `backend/src/main/java/de/almo/backend/security/CurrentUser.java`
- Create: `backend/src/main/java/de/almo/backend/wishlist/WishlistRepository.java`
- Create: `backend/src/main/java/de/almo/backend/wishlist/WishlistService.java`
- Create: `backend/src/main/java/de/almo/backend/wishlist/WishlistController.java`

**Interfaces:**
- Produces: `CurrentUser.require(Authentication) -> User` (throws `AccessDeniedException` if anonymous) - reused by Task 6's `ReviewService`.
- Produces: `GET/PUT/DELETE /api/wishlist(/{productId})` - no `SecurityConfig` change needed, these fall through to the existing `.anyRequest().authenticated()` rule (wishlist is intentionally auth-only, unlike cart).

- [ ] **Step 1: Write `CurrentUser`**

```java
package de.almo.backend.security;

import de.almo.backend.user.User;
import de.almo.backend.user.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * Small shared helper for the (several, as of Sprint 3) services that require a logged-in user and
 * need the actual User entity, not just the email Authentication.getName() returns - wishlist and
 * reviews both need this, factored out instead of repeating the same lookup+anonymous-check twice.
 * Cart deliberately does NOT use this - it supports both guest and logged-in callers, see
 * CartService's own authenticatedUserOrNull (which returns null instead of throwing).
 */
@Component
public class CurrentUser {

  private final UserRepository userRepository;

  public CurrentUser(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  /** Throws AccessDeniedException (-> 403 via Spring Security's ExceptionTranslationFilter, not
      GlobalExceptionHandler - the exception is thrown from inside a controller method so it
      propagates back through the filter chain rather than being resolved by Spring MVC) if the
      caller isn't authenticated. */
  public User require(Authentication authentication) {
    if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
      throw new AccessDeniedException("Authentication required");
    }
    return userRepository
        .findByEmail(authentication.getName())
        .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + authentication.getName()));
  }
}
```

- [ ] **Step 2: Write `WishlistRepository`**

```java
package de.almo.backend.wishlist;

import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * JdbcClient, not JPA: wishlist_items has a composite primary key (user_id, product_id) and no
 * surrogate id column (see V1__init.sql) - modeling that with JPA needs an @IdClass/@EmbeddedId
 * derived-identifier mapping for what's really three one-line SQL statements. Matches the same
 * "plain SQL for simple/read-heavy access" reasoning as ProductSearchRepository/CategoryRepository.
 */
@Repository
public class WishlistRepository {

  private final JdbcClient jdbcClient;

  public WishlistRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  public List<Long> findProductIds(long userId) {
    return jdbcClient
        .sql("SELECT product_id FROM wishlist_items WHERE user_id = :userId ORDER BY product_id")
        .param("userId", userId)
        .query(Long.class)
        .list();
  }

  public void add(long userId, long productId) {
    jdbcClient
        .sql("INSERT INTO wishlist_items (user_id, product_id) VALUES (:userId, :productId) ON CONFLICT DO NOTHING")
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
```

- [ ] **Step 3: Write `WishlistService`**

```java
package de.almo.backend.wishlist;

import de.almo.backend.catalog.ProductNotFoundException;
import de.almo.backend.catalog.ProductSearchRepository;
import de.almo.backend.catalog.ProductSummary;
import de.almo.backend.security.CurrentUser;
import de.almo.backend.user.User;
import java.util.ArrayList;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class WishlistService {

  private final WishlistRepository wishlistRepository;
  private final ProductSearchRepository productSearchRepository;
  private final CurrentUser currentUser;

  public WishlistService(
      WishlistRepository wishlistRepository, ProductSearchRepository productSearchRepository, CurrentUser currentUser) {
    this.wishlistRepository = wishlistRepository;
    this.productSearchRepository = productSearchRepository;
    this.currentUser = currentUser;
  }

  public List<ProductSummary> list(Authentication authentication, String lang) {
    User user = currentUser.require(authentication);
    List<Long> ids = wishlistRepository.findProductIds(user.getId());
    if (ids.isEmpty()) return List.of();
    // findSummariesByIds returns a Map (arbitrary order) - re-order to match ids (product_id ASC,
    // see WishlistRepository.findProductIds; wishlist_items has no timestamp column to order by
    // "recently added" instead, see V1__init.sql - not worth a migration for this sprint).
    var summaries = productSearchRepository.findSummariesByIds(ids, lang);
    List<ProductSummary> ordered = new ArrayList<>();
    for (Long id : ids) {
      ProductSummary summary = summaries.get(id);
      if (summary != null) ordered.add(summary); // skip silently if the product was since removed
    }
    return ordered;
  }

  public void add(Authentication authentication, long productId) {
    User user = currentUser.require(authentication);
    if (!productSearchRepository.existsById(productId)) throw new ProductNotFoundException();
    wishlistRepository.add(user.getId(), productId);
  }

  public void remove(Authentication authentication, long productId) {
    User user = currentUser.require(authentication);
    wishlistRepository.remove(user.getId(), productId);
  }
}
```

- [ ] **Step 4: Write `WishlistController`**

```java
package de.almo.backend.wishlist;

import de.almo.backend.catalog.ProductSummary;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** No permitAll rule in SecurityConfig for this path - falls through to .anyRequest().authenticated(),
    which is exactly right: the wishlist is always per-account, there's no guest concept here. */
@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

  private final WishlistService wishlistService;

  public WishlistController(WishlistService wishlistService) {
    this.wishlistService = wishlistService;
  }

  @GetMapping
  public List<ProductSummary> list(@RequestParam(defaultValue = "de") String lang, Authentication authentication) {
    return wishlistService.list(authentication, lang);
  }

  /** PUT, not POST: idempotent "ensure this product is in my wishlist" - matches the
      ON CONFLICT DO NOTHING semantics in WishlistRepository.add. */
  @PutMapping("/{productId}")
  public ResponseEntity<Void> add(@PathVariable long productId, Authentication authentication) {
    wishlistService.add(authentication, productId);
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{productId}")
  public ResponseEntity<Void> remove(@PathVariable long productId, Authentication authentication) {
    wishlistService.remove(authentication, productId);
    return ResponseEntity.noContent().build();
  }
}
```

- [ ] **Step 5: Verify with curl**

```bash
rm -f /tmp/almo-wishlist-cookies.txt
EMAIL="wishlist+$(date +%s)@example.com"
curl -s -X POST http://localhost:8094/api/auth/register \
  -H "Content-Type: application/json" -c /tmp/almo-wishlist-cookies.txt \
  -d "{\"email\":\"$EMAIL\",\"password\":\"TestPass123!\",\"name\":\"Wishlist Test\"}" >/dev/null

# Anonymous access must be rejected
curl -si http://localhost:8094/api/wishlist
# Expected: HTTP/1.1 403 (or 401 - either is acceptable, see Step 6 note below)

# Add while logged in
curl -s -X PUT http://localhost:8094/api/wishlist/1 -b /tmp/almo-wishlist-cookies.txt -w "\nstatus:%{http_code}\n"
# Expected: status:204

curl -s http://localhost:8094/api/wishlist -b /tmp/almo-wishlist-cookies.txt
# Expected: [{"id":1,...}]

curl -s -X DELETE http://localhost:8094/api/wishlist/1 -b /tmp/almo-wishlist-cookies.txt -w "\nstatus:%{http_code}\n"
# Expected: status:204, and a follow-up GET /api/wishlist returns []
```

- [ ] **Step 6: If the anonymous check in Step 5 returned something other than 401/403 (e.g. a 500), the `AccessDeniedException`-from-inside-a-controller-method path needs a fallback handler**

Spring Security's `ExceptionTranslationFilter` normally catches `AccessDeniedException` bubbling up from the servlet chain and converts it to 403 on its own - `CurrentUser.require` relies on this, matching documented Spring Security behavior. If the curl check above does NOT show a 401/403, add an explicit handler to `GlobalExceptionHandler` as a fallback:

```java
  @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
  public ResponseEntity<ApiError> handleAccessDenied() {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError("Authentication required"));
  }
```

then re-run the Step 5 anonymous check to confirm 403. (Expectation based on how Spring Security is documented to behave with this filter-chain setup: no handler should be needed - this step exists so the plan doesn't silently assume that without checking.)

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/de/almo/backend/security/CurrentUser.java backend/src/main/java/de/almo/backend/wishlist backend/src/main/java/de/almo/backend/common/GlobalExceptionHandler.java
git commit -m "Add wishlist API (auth-only)"
```

---

## Task 6: Reviews backend

**Files:**
- Create: `backend/src/main/java/de/almo/backend/review/Review.java`
- Create: `backend/src/main/java/de/almo/backend/review/ReviewRepository.java`
- Create: `backend/src/main/java/de/almo/backend/review/PurchaseVerificationRepository.java`
- Create: `backend/src/main/java/de/almo/backend/review/ReviewResponse.java`
- Create: `backend/src/main/java/de/almo/backend/review/SubmitReviewRequest.java`
- Create: `backend/src/main/java/de/almo/backend/review/NotPurchasedException.java`
- Create: `backend/src/main/java/de/almo/backend/review/AlreadyReviewedException.java`
- Create: `backend/src/main/java/de/almo/backend/review/ReviewService.java`
- Create: `backend/src/main/java/de/almo/backend/review/ReviewController.java`
- Modify: `backend/src/main/java/de/almo/backend/common/GlobalExceptionHandler.java`

**Interfaces:**
- Consumes: `CurrentUser.require` (Task 5), `ProductSearchRepository.existsById` (Task 2).
- Produces: `GET /api/products/{productId}/reviews` (already permitAll via the existing `/api/products/**` GET rule - no SecurityConfig change needed), `POST /api/products/{productId}/reviews` (auth-only, falls through to `.anyRequest().authenticated()`).

- [ ] **Step 1: Write the `Review` entity**

```java
package de.almo.backend.review;

import de.almo.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * productId is a plain column, not a @ManyToOne - same reasoning as CartItem: Product isn't a JPA
 * entity yet. status defaults to PUBLISHED per the CHECK in V1__init.sql; HIDDEN is Sprint 5's
 * admin-moderation value, nothing in Sprint 3 ever writes it.
 */
@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "product_id", nullable = false)
  private Long productId;

  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false)
  private short rating;

  private String comment;

  @Column(nullable = false)
  private String status = "PUBLISHED";

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  public Review(Long productId, User user, short rating, String comment) {
    this.productId = productId;
    this.user = user;
    this.rating = rating;
    this.comment = comment;
  }
}
```

- [ ] **Step 2: Write `ReviewRepository`**

```java
package de.almo.backend.review;

import de.almo.backend.user.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

  Optional<Review> findByProductIdAndUser(Long productId, User user);

  List<Review> findByProductIdAndStatusOrderByCreatedAtDesc(Long productId, String status);
}
```

- [ ] **Step 3: Write `PurchaseVerificationRepository`**

```java
package de.almo.backend.review;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Sprint 4 hasn't shipped checkout yet, but orders/order_items already exist (V1__init.sql) - this
 * query is real and correct today, it will just always say "no" until Sprint 4 starts writing rows.
 * See "Known, deliberate scope decisions" #2 in the Sprint 3 plan.
 */
@Repository
public class PurchaseVerificationRepository {

  private final JdbcClient jdbcClient;

  public PurchaseVerificationRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

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
}
```

- [ ] **Step 4: Write the response/request DTOs and exceptions**

```java
// backend/src/main/java/de/almo/backend/review/ReviewResponse.java
package de.almo.backend.review;

import java.time.Instant;

public record ReviewResponse(long id, String userName, short rating, String comment, Instant createdAt) {

  static ReviewResponse from(Review review) {
    return new ReviewResponse(
        review.getId(), review.getUser().getName(), review.getRating(), review.getComment(), review.getCreatedAt());
  }
}
```

```java
// backend/src/main/java/de/almo/backend/review/SubmitReviewRequest.java
package de.almo.backend.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubmitReviewRequest(
    @NotNull @Min(1) @Max(5) Short rating, @Size(max = 2000) String comment) {}
```

```java
// backend/src/main/java/de/almo/backend/review/NotPurchasedException.java
package de.almo.backend.review;

public class NotPurchasedException extends RuntimeException {
  public NotPurchasedException() {
    super("You can only review products you have ordered");
  }
}
```

```java
// backend/src/main/java/de/almo/backend/review/AlreadyReviewedException.java
package de.almo.backend.review;

public class AlreadyReviewedException extends RuntimeException {
  public AlreadyReviewedException() {
    super("You have already reviewed this product");
  }
}
```

- [ ] **Step 5: Write `ReviewService`**

```java
package de.almo.backend.review;

import de.almo.backend.catalog.ProductNotFoundException;
import de.almo.backend.catalog.ProductSearchRepository;
import de.almo.backend.security.CurrentUser;
import de.almo.backend.user.User;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

  private final ReviewRepository reviewRepository;
  private final PurchaseVerificationRepository purchaseVerificationRepository;
  private final ProductSearchRepository productSearchRepository;
  private final CurrentUser currentUser;

  public ReviewService(
      ReviewRepository reviewRepository,
      PurchaseVerificationRepository purchaseVerificationRepository,
      ProductSearchRepository productSearchRepository,
      CurrentUser currentUser) {
    this.reviewRepository = reviewRepository;
    this.purchaseVerificationRepository = purchaseVerificationRepository;
    this.productSearchRepository = productSearchRepository;
    this.currentUser = currentUser;
  }

  public List<ReviewResponse> list(long productId) {
    return reviewRepository.findByProductIdAndStatusOrderByCreatedAtDesc(productId, "PUBLISHED").stream()
        .map(ReviewResponse::from)
        .toList();
  }

  @Transactional
  public ReviewResponse submit(Authentication authentication, long productId, short rating, String comment) {
    if (!productSearchRepository.existsById(productId)) throw new ProductNotFoundException();
    User user = currentUser.require(authentication);
    if (!purchaseVerificationRepository.hasPurchased(user.getId(), productId)) {
      throw new NotPurchasedException();
    }
    if (reviewRepository.findByProductIdAndUser(productId, user).isPresent()) {
      throw new AlreadyReviewedException();
    }
    return ReviewResponse.from(reviewRepository.save(new Review(productId, user, rating, comment)));
  }
}
```

- [ ] **Step 6: Write `ReviewController`**

```java
package de.almo.backend.review;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/** GET is publicly readable (falls under the existing "/api/products/**" GET permitAll rule in
    SecurityConfig, no path-specific rule needed here - see the constant's own comment there).
    POST falls through to .anyRequest().authenticated(). */
@RestController
@RequestMapping("/api/products/{productId}/reviews")
public class ReviewController {

  private final ReviewService reviewService;

  public ReviewController(ReviewService reviewService) {
    this.reviewService = reviewService;
  }

  @GetMapping
  public List<ReviewResponse> list(@PathVariable long productId) {
    return reviewService.list(productId);
  }

  @PostMapping
  public ResponseEntity<ReviewResponse> submit(
      @PathVariable long productId, @Valid @RequestBody SubmitReviewRequest body, Authentication authentication) {
    ReviewResponse response = reviewService.submit(authentication, productId, body.rating(), body.comment());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }
}
```

- [ ] **Step 7: Handle the two new exceptions in `GlobalExceptionHandler`**

```java
  @ExceptionHandler(de.almo.backend.review.NotPurchasedException.class)
  public ResponseEntity<ApiError> handleNotPurchased(de.almo.backend.review.NotPurchasedException e) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError(e.getMessage()));
  }

  @ExceptionHandler(de.almo.backend.review.AlreadyReviewedException.class)
  public ResponseEntity<ApiError> handleAlreadyReviewed(de.almo.backend.review.AlreadyReviewedException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(e.getMessage()));
  }
```

- [ ] **Step 8: Verify with curl, including the purchase gate**

```bash
rm -f /tmp/almo-review-cookies.txt
EMAIL="review+$(date +%s)@example.com"
curl -s -X POST http://localhost:8094/api/auth/register \
  -H "Content-Type: application/json" -c /tmp/almo-review-cookies.txt \
  -d "{\"email\":\"$EMAIL\",\"password\":\"TestPass123!\",\"name\":\"Review Test\"}" >/dev/null
USER_ID=$(curl -s http://localhost:8094/api/auth/me -b /tmp/almo-review-cookies.txt | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")

# Not purchased yet - expect 403
curl -si -X POST http://localhost:8094/api/products/1/reviews \
  -H "Content-Type: application/json" -b /tmp/almo-review-cookies.txt \
  -d '{"rating": 5, "comment": "Great!"}'
# Expected: HTTP/1.1 403, {"message":"You can only review products you have ordered"}

# Manually fake a purchase (Sprint 4 will do this via real checkout - see plan decision #2).
docker exec almo-db-1 psql -U almo -d almo -c \
  "INSERT INTO orders (user_id, contact_preference, shipping_cost) VALUES ($USER_ID, 'EMAIL', 3.90) RETURNING id;"
# copy the returned id into the next command's order_id value:
docker exec almo-db-1 psql -U almo -d almo -c \
  "INSERT INTO order_items (order_id, product_id, quantity, price_at_order) VALUES (<order_id_from_above>, 1, 1, 14.90);"

# Now it should succeed
curl -si -X POST http://localhost:8094/api/products/1/reviews \
  -H "Content-Type: application/json" -b /tmp/almo-review-cookies.txt \
  -d '{"rating": 5, "comment": "Great!"}'
# Expected: HTTP/1.1 201, body has id/userName/rating/comment/createdAt

# Reviewing again - expect 409
curl -si -X POST http://localhost:8094/api/products/1/reviews \
  -H "Content-Type: application/json" -b /tmp/almo-review-cookies.txt \
  -d '{"rating": 3, "comment": "again"}'
# Expected: HTTP/1.1 409

# List is public - no cookie needed
curl -s http://localhost:8094/api/products/1/reviews
# Expected: 200, array containing the review just posted

# Clean up the fake order so it doesn't confuse Sprint 4's testing later:
docker exec almo-db-1 psql -U almo -d almo -c "DELETE FROM orders WHERE user_id = $USER_ID;"
```

- [ ] **Step 9: Commit**

```bash
git add backend/src/main/java/de/almo/backend/review backend/src/main/java/de/almo/backend/common/GlobalExceptionHandler.java
git commit -m "Add purchase-gated reviews API"
```

---

## Task 7: Frontend API clients

**Files:**
- Modify: `frontend/src/api/catalog.ts` (add `ProductDetail`, `fetchProduct`)
- Create: `frontend/src/api/cart.ts`
- Create: `frontend/src/api/wishlist.ts`
- Create: `frontend/src/api/reviews.ts`

**Interfaces:**
- Produces: types/functions consumed by Task 8-12's contexts/pages.

- [ ] **Step 1: Extend `catalog.ts`**

Add to the end of the existing file (keep everything already there unchanged):

```typescript
export type ProductDetail = Product & {
  description: string | null
  details: string[]
}

export function fetchProduct(id: number, lang: string) {
  return apiFetch<ProductDetail>(`/api/products/${id}?lang=${encodeURIComponent(lang)}`)
}
```

- [ ] **Step 2: Write `cart.ts`**

```typescript
import { apiFetch } from './client'

export type CartItemView = {
  productId: number
  name: string
  imageRef: string | null
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  price: number
  quantity: number
  lineTotal: number
}

export type CartResponse = {
  items: CartItemView[]
  subtotal: number
}

export function fetchCart(lang: string) {
  return apiFetch<CartResponse>(`/api/cart?lang=${encodeURIComponent(lang)}`)
}

export function addToCart(productId: number, quantity: number, lang: string) {
  return apiFetch<CartResponse>(`/api/cart/items?lang=${encodeURIComponent(lang)}`, {
    method: 'POST',
    body: { productId, quantity },
  })
}

export function updateCartItem(productId: number, quantity: number, lang: string) {
  return apiFetch<CartResponse>(`/api/cart/items/${productId}?lang=${encodeURIComponent(lang)}`, {
    method: 'PUT',
    body: { quantity },
  })
}

export function removeCartItem(productId: number, lang: string) {
  return apiFetch<CartResponse>(`/api/cart/items/${productId}?lang=${encodeURIComponent(lang)}`, {
    method: 'DELETE',
  })
}
```

- [ ] **Step 3: Write `wishlist.ts`**

```typescript
import { apiFetch } from './client'
import type { Product } from './catalog'

export function fetchWishlist(lang: string) {
  return apiFetch<Product[]>(`/api/wishlist?lang=${encodeURIComponent(lang)}`)
}

export function addToWishlist(productId: number) {
  return apiFetch<void>(`/api/wishlist/${productId}`, { method: 'PUT' })
}

export function removeFromWishlist(productId: number) {
  return apiFetch<void>(`/api/wishlist/${productId}`, { method: 'DELETE' })
}
```

- [ ] **Step 4: Write `reviews.ts`**

```typescript
import { apiFetch } from './client'

export type Review = {
  id: number
  userName: string
  rating: number
  comment: string | null
  createdAt: string
}

export function fetchReviews(productId: number) {
  return apiFetch<Review[]>(`/api/products/${productId}/reviews`)
}

export function submitReview(productId: number, rating: number, comment: string) {
  return apiFetch<Review>(`/api/products/${productId}/reviews`, {
    method: 'POST',
    body: { rating, comment },
  })
}
```

- [ ] **Step 5: Verify it compiles**

```bash
cd frontend && npx tsc -b --noEmit
```

Expected: no errors (these files aren't imported anywhere yet, so this only checks they're individually well-typed).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api
git commit -m "Add cart/wishlist/reviews/product-detail API clients"
```

---

## Task 8: Cart context/provider

**Files:**
- Create: `frontend/src/cart/CartContext.ts`
- Create: `frontend/src/cart/CartProvider.tsx`
- Create: `frontend/src/cart/useCart.ts`
- Modify: `frontend/src/main.tsx` (nest `CartProvider` inside `AuthProvider`)

**Interfaces:**
- Produces: `useCart() -> { cart: CartResponse | null, loading: boolean, addItem(productId, quantity?), updateItem(productId, quantity), removeItem(productId) }` - consumed by Task 10 (`Header`/`MiniCart`), Task 11 (`ProductCard`), Task 12 (`CartPage`/`ProductPage`).

- [ ] **Step 1: Write `CartContext.ts`**

```typescript
import { createContext } from 'react'
import type { CartResponse } from '../api/cart'

export type CartContextValue = {
  cart: CartResponse | null
  loading: boolean
  addItem: (productId: number, quantity?: number) => Promise<void>
  updateItem: (productId: number, quantity: number) => Promise<void>
  removeItem: (productId: number) => Promise<void>
}

// Split from CartProvider/useCart for the same reason AuthContext is split from AuthProvider -
// mixing components and non-component exports in one file breaks Vite fast-refresh.
export const CartContext = createContext<CartContextValue | null>(null)
```

- [ ] **Step 2: Write `CartProvider.tsx`**

```tsx
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import * as cartApi from '../api/cart'
import { useAuth } from '../auth/useAuth'
import { CartContext } from './CartContext'

export function CartProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [cart, setCart] = useState<cartApi.CartResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // Refetches whenever the logged-in user changes (login/logout/register all update `user`, see
  // AuthProvider) - a login also merges the guest cart server-side (see backend CartService), so
  // this is what picks up the merged result on the client. Waiting for authLoading avoids an
  // extra guest-cart fetch on every page load before the /api/auth/me check resolves.
  useEffect(() => {
    if (authLoading) return
    setLoading(true)
    cartApi
      .fetchCart(i18n.language)
      .then(setCart)
      .finally(() => setLoading(false))
  }, [user, authLoading, i18n.language])

  async function addItem(productId: number, quantity = 1) {
    setCart(await cartApi.addToCart(productId, quantity, i18n.language))
  }

  async function updateItem(productId: number, quantity: number) {
    setCart(await cartApi.updateCartItem(productId, quantity, i18n.language))
  }

  async function removeItem(productId: number) {
    setCart(await cartApi.removeCartItem(productId, i18n.language))
  }

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  )
}
```

- [ ] **Step 3: Write `useCart.ts`**

```typescript
import { useContext } from 'react'
import { CartContext, type CartContextValue } from './CartContext'

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
```

- [ ] **Step 4: Wire it into `main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
// Must run before App renders: it synchronously registers i18next resources
// and picks the initial language, so the first render already has translations
// available instead of flashing untranslated keys.
import './i18n'
import { AuthProvider } from './auth/AuthProvider'
import { CartProvider } from './cart/CartProvider'
import { AppRouter } from './AppRouter'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

(Task 9 adds `WishlistProvider` into this same nest - both tasks touch this file; Task 9's diff assumes this version exists first.)

- [ ] **Step 5: Verify it compiles and the app still boots**

```bash
cd frontend && npx tsc -b --noEmit && npm run dev
```

Open `http://localhost:5173` - expect no console errors, the homepage renders as before (nothing visibly changed yet, `CartProvider` just fetches silently in the background). Check the Network tab: a `GET /api/cart` request should fire once on load.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/cart frontend/src/main.tsx
git commit -m "Add CartProvider (guest+user cart state)"
```

---

## Task 9: Wishlist context/provider

**Files:**
- Create: `frontend/src/wishlist/WishlistContext.ts`
- Create: `frontend/src/wishlist/WishlistProvider.tsx`
- Create: `frontend/src/wishlist/useWishlist.ts`
- Modify: `frontend/src/main.tsx` (nest `WishlistProvider` inside `CartProvider`)

**Interfaces:**
- Produces: `useWishlist() -> { productIds: Set<number>, loading: boolean, toggle(productId) }` - consumed by Task 10 (`Header`), Task 11 (`ProductCard`), Task 12 (`WishlistPage`/`ProductPage`).

- [ ] **Step 1: Write `WishlistContext.ts`**

```typescript
import { createContext } from 'react'

export type WishlistContextValue = {
  productIds: Set<number>
  loading: boolean
  toggle: (productId: number) => Promise<void>
}

export const WishlistContext = createContext<WishlistContextValue | null>(null)
```

- [ ] **Step 2: Write `WishlistProvider.tsx`**

```tsx
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import * as wishlistApi from '../api/wishlist'
import { useAuth } from '../auth/useAuth'
import { WishlistContext } from './WishlistContext'

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [productIds, setProductIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      // Wishlist is auth-only (see backend WishlistController) - nothing to load for a guest.
      setProductIds(new Set())
      setLoading(false)
      return
    }
    setLoading(true)
    wishlistApi
      .fetchWishlist(i18n.language)
      .then((products) => setProductIds(new Set(products.map((p) => p.id))))
      .finally(() => setLoading(false))
  }, [user, authLoading, i18n.language])

  async function toggle(productId: number) {
    if (productIds.has(productId)) {
      await wishlistApi.removeFromWishlist(productId)
      setProductIds((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    } else {
      await wishlistApi.addToWishlist(productId)
      setProductIds((prev) => new Set(prev).add(productId))
    }
  }

  return (
    <WishlistContext.Provider value={{ productIds, loading, toggle }}>{children}</WishlistContext.Provider>
  )
}
```

- [ ] **Step 3: Write `useWishlist.ts`**

```typescript
import { useContext } from 'react'
import { WishlistContext, type WishlistContextValue } from './WishlistContext'

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider')
  return context
}
```

- [ ] **Step 4: Wire it into `main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import './i18n'
import { AuthProvider } from './auth/AuthProvider'
import { CartProvider } from './cart/CartProvider'
import { WishlistProvider } from './wishlist/WishlistProvider'
import { AppRouter } from './AppRouter'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppRouter />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 5: Verify it compiles and boots**

```bash
cd frontend && npx tsc -b --noEmit && npm run dev
```

Log in as an existing test user in the browser - expect a `GET /api/wishlist` request to fire once (visible in Network tab), no console errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/wishlist frontend/src/main.tsx
git commit -m "Add WishlistProvider (auth-only wishlist state)"
```

---

## Task 10: Header wishlist/cart icons + mini-cart flyout

**Files:**
- Modify: `frontend/src/components/Header.tsx`
- Create: `frontend/src/components/MiniCart.tsx`

**Interfaces:**
- Consumes: `useCart()` (Task 8), `useWishlist()` (Task 9).

- [ ] **Step 1: Write `MiniCart.tsx`**

```tsx
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useCart } from '../cart/useCart'

function formatPrice(value: number, lang: string) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(value)
}

export function MiniCart({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const { cart } = useCart()
  const items = cart?.items ?? []

  return (
    <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded border border-brand-border bg-brand-surface p-4 shadow-lg">
      {items.length === 0 ? (
        <p className="text-sm text-brand-text-muted">{t('cart_empty')}</p>
      ) : (
        <>
          <ul className="flex max-h-64 flex-col gap-3 overflow-y-auto">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-2 text-sm">
                {item.imageRef && (
                  <img src={item.imageRef} alt={item.name} className="h-10 w-10 rounded object-cover" />
                )}
                <div className="flex-1">
                  <div>{item.name}</div>
                  <div className="text-xs text-brand-text-muted">
                    {item.quantity} × {formatPrice(item.price, i18n.language)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-3 text-sm font-semibold">
            <span>{t('cart_subtotal')}</span>
            <span>{formatPrice(cart!.subtotal, i18n.language)}</span>
          </div>
        </>
      )}
      <Link
        to="/cart"
        onClick={onClose}
        className="mt-4 block rounded bg-brand-text px-4 py-2 text-center text-xs uppercase tracking-wide text-white hover:bg-black"
      >
        {t('cart_view')}
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `Header.tsx`, replacing the disabled placeholder icons**

```tsx
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { useWishlist } from '../wishlist/useWishlist'
import { MiniCart } from './MiniCart'

const LANGUAGES = ['de', 'en', 'fr'] as const

export function Header() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { cart } = useCart()
  const { productIds } = useWishlist()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [cartOpen, setCartOpen] = useState(false)

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const wishlistCount = productIds.size

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const trimmed = searchTerm.trim()
    navigate(trimmed ? `/shop?search=${encodeURIComponent(trimmed)}` : '/shop')
  }

  return (
    <header className="sticky top-0 z-10 border-b border-brand-border bg-brand-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
        <Link to="/" className="text-xl font-semibold tracking-wide">
          {t('app_title')}
        </Link>

        <nav className="flex gap-4 text-sm uppercase tracking-wide">
          <Link to="/" className="hover:text-brand-accent">
            {t('nav_home')}
          </Link>
          <Link to="/shop" className="hover:text-brand-accent">
            {t('nav_shop')}
          </Link>
        </nav>

        <form onSubmit={handleSearch} className="ml-auto min-w-40 flex-1 max-w-sm">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full rounded border border-brand-border bg-brand-bg px-3 py-1.5 text-sm outline-none focus:border-brand-accent"
          />
        </form>

        <div className="flex items-center gap-3 text-sm">
          <Link to="/wishlist" className="relative" title={t('nav_wishlist')}>
            ♡
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button type="button" onClick={() => setCartOpen((open) => !open)} className="relative" title={t('nav_cart')}>
              🛍
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] text-white">
                  {cartCount}
                </span>
              )}
            </button>
            {cartOpen && <MiniCart onClose={() => setCartOpen(false)} />}
          </div>

          <Link to={user ? '/account' : '/login'} className="hover:text-brand-accent">
            {user ? user.name : t('nav_login')}
          </Link>

          <div className="flex gap-1 border-l border-brand-border pl-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => i18n.changeLanguage(lang)}
                aria-current={i18n.language === lang}
                className={
                  i18n.language === lang
                    ? 'font-semibold text-brand-accent'
                    : 'text-brand-text-muted hover:text-brand-text'
                }
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Verify in the browser**

`npm run dev`, then: add a product to the cart via any means available so far (none yet until Task 11 wires `ProductCard` - skip visual verification of the badge count here, just confirm no console errors and that clicking the cart icon opens/closes the (empty) `MiniCart` panel, and the wishlist heart link navigates to `/wishlist` - it 404s via React Router until Task 12 adds the route, that's expected at this point).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Header.tsx frontend/src/components/MiniCart.tsx
git commit -m "Wire live cart/wishlist icons and mini-cart flyout into the header"
```

---

## Task 11: ProductCard - one-click add to cart + wishlist toggle

**Files:**
- Modify: `frontend/src/components/ProductCard.tsx`

**Interfaces:**
- Consumes: `useCart()`, `useWishlist()`, `useAuth()`.

- [ ] **Step 1: Rewrite `ProductCard.tsx`**

```tsx
import { type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Product } from '../api/catalog'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { useWishlist } from '../wishlist/useWishlist'

const STOCK_STYLES: Record<Product['status'], string> = {
  in_stock: 'text-brand-text-muted',
  low_stock: 'text-brand-sale',
  out_of_stock: 'text-brand-text-muted line-through',
}

function formatPrice(value: number, lang: string) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(value)
}

export function ProductCard({ product }: { product: Product }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { addItem } = useCart()
  const { productIds: wishlistIds, toggle: toggleWishlist } = useWishlist()
  const image = product.imageRefs[0]
  const isWishlisted = wishlistIds.has(product.id)

  function handleAddToCart(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem(product.id, 1)
  }

  function handleToggleWishlist(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product.id)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded border border-brand-border bg-brand-surface">
      <Link to={`/product/${product.id}`} className="contents">
        <div className="relative aspect-square overflow-hidden bg-brand-bg">
          {image && (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          )}
          {product.badge && (
            <span className="absolute left-2 top-2 rounded bg-brand-text px-2 py-0.5 text-xs uppercase tracking-wide text-white">
              {product.badge}
            </span>
          )}
          {user && (
            <button
              type="button"
              onClick={handleToggleWishlist}
              title={t(isWishlisted ? 'wishlist_remove' : 'wishlist_add')}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-surface shadow"
            >
              <span className={isWishlisted ? 'text-brand-accent' : 'text-brand-text-muted'}>♡</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.status === 'out_of_stock'}
            title={t('add_to_cart')}
            className={`absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-surface text-brand-text-muted shadow hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-50 ${user ? 'top-12' : 'top-2'}`}
          >
            🛍
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <span className="text-xs uppercase tracking-wide text-brand-text-muted">{product.categoryName}</span>
          <h3 className="text-sm font-medium">{product.name}</h3>

          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="font-semibold">{formatPrice(product.price, i18n.language)}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-brand-text-muted line-through">
                {formatPrice(product.compareAtPrice, i18n.language)}
              </span>
            )}
          </div>

          <span className={`text-xs ${STOCK_STYLES[product.status]}`}>{t(`stock_${product.status}`)}</span>
        </div>
      </Link>
    </article>
  )
}
```

- [ ] **Step 2: Verify in the browser**

On `/shop`: click a card's cart icon - the header's cart badge count should increment immediately, and `MiniCart` (Task 10) should show the item when opened. Click the whole card body (not the icons) - should navigate to `/product/{id}` (this 404s via React Router until Task 12 adds the route, expected at this point). Log in, confirm the wishlist heart appears and toggling it updates the header's wishlist badge.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ProductCard.tsx
git commit -m "Wire one-click add-to-cart and wishlist toggle on product cards"
```

---

## Task 12: Product page, cart page, wishlist page, recently-viewed, routes

**Files:**
- Create: `frontend/src/recentlyViewed.ts`
- Create: `frontend/src/pages/ProductPage.tsx`
- Create: `frontend/src/pages/CartPage.tsx`
- Create: `frontend/src/pages/WishlistPage.tsx`
- Modify: `frontend/src/AppRouter.tsx` (add `/product/:id`, `/cart`, `/wishlist`)

**Interfaces:**
- Consumes: `fetchProduct`, `fetchReviews`, `submitReview`, `useCart`, `useWishlist`, `useAuth`, `ProductCard`.

- [ ] **Step 1: Write `recentlyViewed.ts`**

```typescript
import type { Product } from './api/catalog'

const KEY = 'almo_recently_viewed'
const MAX = 8

/** Client-only by design (not a backend table) - see "Known, deliberate scope decisions" #3 in
    the Sprint 3 plan. Wrapped in try/catch: localStorage can throw in private-browsing contexts,
    and this feature is low-stakes enough that silently doing nothing beats crashing the page. */
export function recordView(product: Product) {
  try {
    const list = readAll().filter((p) => p.id !== product.id)
    list.unshift(product)
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    // ignore - recently-viewed is a nice-to-have, not core commerce data
  }
}

export function readRecentlyViewed(excludeId: number): Product[] {
  return readAll().filter((p) => p.id !== excludeId)
}

function readAll(): Product[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Product[]) : []
  } catch {
    return []
  }
}
```

- [ ] **Step 2: Write `ProductPage.tsx`**

```tsx
import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { fetchProduct, type ProductDetail, type Product } from '../api/catalog'
import { fetchReviews, submitReview, type Review } from '../api/reviews'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { useWishlist } from '../wishlist/useWishlist'
import { ProductCard } from '../components/ProductCard'
import { recordView, readRecentlyViewed } from '../recentlyViewed'

function formatPrice(value: number, lang: string) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(value)
}

export function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { addItem } = useCart()
  const { productIds: wishlistIds, toggle: toggleWishlist } = useWishlist()
  const navigate = useNavigate()

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState<Review[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    setProduct(null)
    fetchProduct(productId, i18n.language).then((p) => {
      setProduct(p)
      setActiveImage(0)
      recordView(p)
      setRecentlyViewed(readRecentlyViewed(p.id))
    })
    fetchReviews(productId).then(setReviews)
  }, [productId, i18n.language])

  async function handleSubmitReview(e: FormEvent) {
    e.preventDefault()
    setReviewError(null)
    setReviewSubmitting(true)
    try {
      const review = await submitReview(productId, reviewRating, reviewComment)
      setReviews((prev) => [review, ...prev])
      setReviewComment('')
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : t('review_submit_error'))
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (!product) return null

  const isWishlisted = wishlistIds.has(product.id)

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 pb-28">
      <div className="grid gap-10 sm:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded bg-brand-bg">
            {product.imageRefs[activeImage] && (
              <img src={product.imageRefs[activeImage]} alt={product.name} className="h-full w-full object-cover" />
            )}
          </div>
          {product.imageRefs.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.imageRefs.map((img, index) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`h-16 w-16 overflow-hidden rounded border ${index === activeImage ? 'border-brand-accent' : 'border-brand-border'}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs uppercase tracking-wide text-brand-text-muted">{product.categoryName}</span>
          <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-semibold">{formatPrice(product.price, i18n.language)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-brand-text-muted line-through">
                {formatPrice(product.compareAtPrice, i18n.language)}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm">{t(`stock_${product.status}`)}</p>

          {product.description && <p className="mt-4 text-sm text-brand-text-muted">{product.description}</p>}

          {product.details.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-brand-text-muted">
              {product.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-16 rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm"
            />
            {user && (
              <button type="button" onClick={() => toggleWishlist(product.id)} className="text-sm hover:text-brand-accent">
                {isWishlisted ? t('wishlist_remove') : t('wishlist_add')}
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">{t('reviews_title')}</h2>

        {reviews.length === 0 && <p className="text-sm text-brand-text-muted">{t('reviews_empty')}</p>}

        <ul className="flex flex-col gap-4">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-brand-border pb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </span>
                <span>{review.userName}</span>
              </div>
              {review.comment && <p className="mt-1 text-sm text-brand-text-muted">{review.comment}</p>}
            </li>
          ))}
        </ul>

        {user ? (
          <form onSubmit={handleSubmitReview} className="mt-6 flex max-w-md flex-col gap-3">
            <h3 className="text-sm font-semibold">{t('reviews_form_title')}</h3>
            <select
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
              className="w-32 rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {'★'.repeat(value)}
                </option>
              ))}
            </select>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={t('reviews_form_comment')}
              className="rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm"
              rows={3}
            />
            {reviewError && <p className="text-sm text-brand-sale">{reviewError}</p>}
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="self-start rounded bg-brand-text px-6 py-2 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
            >
              {t('reviews_form_submit')}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-brand-text-muted">
            <Link to="/login" className="underline">
              {t('nav_login')}
            </Link>{' '}
            {t('reviews_login_hint')}
          </p>
        )}
      </section>

      {recentlyViewed.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">{t('recently_viewed_title')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-brand-border bg-brand-surface px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <span className="font-semibold">{formatPrice(product.price * quantity, i18n.language)}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addItem(product.id, quantity)}
              disabled={product.status === 'out_of_stock'}
              className="rounded border border-brand-text px-6 py-2 text-xs uppercase tracking-wide hover:bg-brand-bg disabled:opacity-50"
            >
              {t('add_to_cart')}
            </button>
            <button
              type="button"
              onClick={async () => {
                await addItem(product.id, quantity)
                // Sprint 4 adds /checkout - this points at /cart until then, see plan decision #4.
                navigate('/cart')
              }}
              disabled={product.status === 'out_of_stock'}
              className="rounded bg-brand-text px-6 py-2 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
            >
              {t('buy_now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `CartPage.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCart } from '../cart/useCart'

function formatPrice(value: number, lang: string) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(value)
}

export function CartPage() {
  const { t, i18n } = useTranslation()
  const { cart, loading, updateItem, removeItem } = useCart()

  if (loading) return null

  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-brand-text-muted">{t('cart_empty')}</p>
        <Link to="/shop" className="mt-4 inline-block rounded bg-brand-text px-6 py-2 text-xs uppercase tracking-wide text-white hover:bg-black">
          {t('shop_all_products')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">{t('cart_title')}</h1>

      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4 border-b border-brand-border pb-4">
            {item.imageRef && <img src={item.imageRef} alt={item.name} className="h-20 w-20 rounded object-cover" />}
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-brand-text-muted">{formatPrice(item.price, i18n.language)}</div>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(item.productId, Math.max(1, Number(e.target.value)))}
              className="w-16 rounded border border-brand-border bg-brand-surface px-2 py-1.5 text-sm"
            />
            <span className="w-20 text-right text-sm font-medium">{formatPrice(item.lineTotal, i18n.language)}</span>
            <button type="button" onClick={() => removeItem(item.productId)} className="text-sm text-brand-text-muted underline hover:text-brand-sale">
              {t('cart_remove')}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between text-lg font-semibold">
        <span>{t('cart_subtotal')}</span>
        <span>{formatPrice(cart!.subtotal, i18n.language)}</span>
      </div>

      {/* Sprint 4 adds real checkout - this points at the shop for now, see plan decision #4. */}
      <Link to="/shop" className="mt-6 block rounded bg-brand-text px-6 py-3 text-center text-xs uppercase tracking-wide text-white hover:bg-black">
        {t('cart_checkout_placeholder')}
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: Write `WishlistPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { fetchWishlist } from '../api/wishlist'
import type { Product } from '../api/catalog'
import { ProductCard } from '../components/ProductCard'
import { useWishlist } from '../wishlist/useWishlist'

export function WishlistPage() {
  const { t, i18n } = useTranslation()
  const { productIds } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Re-fetches whenever the wishlist's size changes - e.g. a card's heart toggle on this same
  // page removing an item (ProductCard has no separate "remove" affordance, the same toggle button
  // both adds and removes - see ProductCard.tsx).
  useEffect(() => {
    setLoading(true)
    fetchWishlist(i18n.language)
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [i18n.language, productIds.size])

  if (loading) return null

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-brand-text-muted">{t('wishlist_empty')}</p>
        <Link to="/shop" className="mt-4 inline-block rounded bg-brand-text px-6 py-2 text-xs uppercase tracking-wide text-white hover:bg-black">
          {t('shop_all_products')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">{t('wishlist_title')}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add the three routes to `AppRouter.tsx`**

```tsx
import { Routes, Route } from 'react-router'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductPage } from './pages/ProductPage'
import { CartPage } from './pages/CartPage'
import { WishlistPage } from './pages/WishlistPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { AccountPage } from './pages/AccountPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminHomePage } from './pages/AdminHomePage'
import { RequireAuth } from './auth/RequireAuth'
import { RequireAdmin } from './auth/RequireAdmin'

/**
 * Kept separate from main.tsx so AuthProvider (which needs to sit above this, see main.tsx) isn't
 * forced into the same file as the route table.
 *
 * Admin routes deliberately sit outside <Layout> (no shop header/footer) - the admin area is a
 * separate context, matching the backend's separate /api/admin/auth/* endpoint and filter chain.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/wishlist"
          element={
            <RequireAuth>
              <WishlistPage />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminHomePage />
          </RequireAdmin>
        }
      />
    </Routes>
  )
}
```

(`/cart` is intentionally NOT `RequireAuth`-wrapped - guests need it too. `/wishlist` is, matching the backend's auth-only `WishlistController`.)

- [ ] **Step 6: Verify the full flow in the browser**

- `/shop` → click a product card's image → lands on `/product/:id` with gallery, description, details, sticky bottom bar.
- Change the quantity input, click "In den Warenkorb" → header cart badge updates, `MiniCart` shows the item.
- Click "Jetzt kaufen" on a different product → lands on `/cart` with both items listed.
- Update a quantity on `/cart`, remove an item, confirm the subtotal recalculates each time.
- Log in, go back to a product page, submit a review while `hasPurchased` is false → error message from the backend's 403 shows inline (`t('review_submit_error')` fallback only fires for non-`ApiError` failures, e.g. network errors - the 403 case shows the backend's own message).
- Scroll to the bottom of a product page after visiting 2-3 different products → "Zuletzt angesehen" strip shows the others, most-recent first, current product excluded.
- Click a card's heart icon while logged in → `/wishlist` shows it; toggle it off from the wishlist page itself → it disappears from the page immediately.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/recentlyViewed.ts frontend/src/pages/ProductPage.tsx frontend/src/pages/CartPage.tsx frontend/src/pages/WishlistPage.tsx frontend/src/AppRouter.tsx
git commit -m "Add product/cart/wishlist pages and routes"
```

---

## Task 13: Locale keys (DE/EN/FR)

**Files:**
- Modify: `frontend/src/i18n/locales/de.json`
- Modify: `frontend/src/i18n/locales/en.json`
- Modify: `frontend/src/i18n/locales/fr.json`

- [ ] **Step 1: Add the new keys to `de.json`**

Replace the last line (`"add_to_cart": "In den Warenkorb"`) with:

```json
  "add_to_cart": "In den Warenkorb",
  "buy_now": "Jetzt kaufen",

  "nav_wishlist": "Wunschliste",
  "nav_cart": "Warenkorb",

  "cart_title": "Warenkorb",
  "cart_empty": "Dein Warenkorb ist leer.",
  "cart_subtotal": "Zwischensumme",
  "cart_view": "Warenkorb ansehen",
  "cart_remove": "Entfernen",
  "cart_checkout_placeholder": "Weiter zur Kasse",

  "wishlist_title": "Wunschliste",
  "wishlist_empty": "Deine Wunschliste ist leer.",
  "wishlist_add": "Zur Wunschliste hinzufuegen",
  "wishlist_remove": "Von Wunschliste entfernen",

  "reviews_title": "Bewertungen",
  "reviews_empty": "Noch keine Bewertungen.",
  "reviews_form_title": "Bewertung abgeben",
  "reviews_form_comment": "Dein Kommentar (optional)",
  "reviews_form_submit": "Bewertung abschicken",
  "reviews_login_hint": "um eine Bewertung abzugeben.",
  "review_submit_error": "Bewertung konnte nicht gesendet werden.",

  "recently_viewed_title": "Zuletzt angesehen"
}
```

- [ ] **Step 2: Add the matching keys to `en.json`**

```json
  "add_to_cart": "Add to cart",
  "buy_now": "Buy now",

  "nav_wishlist": "Wishlist",
  "nav_cart": "Cart",

  "cart_title": "Cart",
  "cart_empty": "Your cart is empty.",
  "cart_subtotal": "Subtotal",
  "cart_view": "View cart",
  "cart_remove": "Remove",
  "cart_checkout_placeholder": "Proceed to checkout",

  "wishlist_title": "Wishlist",
  "wishlist_empty": "Your wishlist is empty.",
  "wishlist_add": "Add to wishlist",
  "wishlist_remove": "Remove from wishlist",

  "reviews_title": "Reviews",
  "reviews_empty": "No reviews yet.",
  "reviews_form_title": "Write a review",
  "reviews_form_comment": "Your comment (optional)",
  "reviews_form_submit": "Submit review",
  "reviews_login_hint": "to write a review.",
  "review_submit_error": "Could not submit your review.",

  "recently_viewed_title": "Recently viewed"
}
```

- [ ] **Step 3: Add the matching keys to `fr.json`**

```json
  "add_to_cart": "Ajouter au panier",
  "buy_now": "Acheter maintenant",

  "nav_wishlist": "Liste de souhaits",
  "nav_cart": "Panier",

  "cart_title": "Panier",
  "cart_empty": "Votre panier est vide.",
  "cart_subtotal": "Sous-total",
  "cart_view": "Voir le panier",
  "cart_remove": "Retirer",
  "cart_checkout_placeholder": "Passer la commande",

  "wishlist_title": "Liste de souhaits",
  "wishlist_empty": "Votre liste de souhaits est vide.",
  "wishlist_add": "Ajouter aux souhaits",
  "wishlist_remove": "Retirer des souhaits",

  "reviews_title": "Avis",
  "reviews_empty": "Aucun avis pour le moment.",
  "reviews_form_title": "Laisser un avis",
  "reviews_form_comment": "Votre commentaire (optionnel)",
  "reviews_form_submit": "Envoyer l'avis",
  "reviews_login_hint": "pour laisser un avis.",
  "review_submit_error": "L'avis n'a pas pu etre envoye.",

  "recently_viewed_title": "Vus recemment"
}
```

- [ ] **Step 4: Verify all three languages render correctly**

In the browser, switch the language selector between DE/EN/FR on `/cart`, `/wishlist`, and a `/product/:id` page - every new label from this sprint should be translated, nothing shows a raw `key.like.this` (i18next's fallback-to-key-string behavior on a missing key, easy to spot).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/i18n/locales
git commit -m "Add DE/EN/FR locale keys for cart, wishlist, reviews, recently-viewed"
```

---

## Task 14: Full end-to-end pass + backlog update

**Files:**
- Modify: `docs/backlog.md`

- [ ] **Step 1: Rebuild and redeploy to the VPS**

Following the exact same pattern used to close the Sprint-1 deploy gap (see `docs/backlog.md` Sprint 1's "Deploy-Lücke" note):

```bash
docker compose up -d --build
```

- [ ] **Step 2: Re-run every curl check from Tasks 2, 3, 4, 5, 6 against the live VPS domain**

Same commands as before, but against `https://almo-group.vn-nspace.de` with `-k` (self-signed-safe) and `-H "Host: almo-group.vn-nspace.de"` if hitting `127.0.0.1` directly, exactly like the verification pattern used for Sprint 1/2. All expected results carry over unchanged.

- [ ] **Step 3: Full manual browser pass against the live site**

Repeat Task 12 Step 6's browser checklist against `https://almo-group.vn-nspace.de` instead of localhost - this is what actually proves the sprint is done, not just "committed" (see the Sprint 1 lesson: a rebuild step was missed and the live site ran stale code for a while before anyone checked).

- [ ] **Step 4: Update `docs/backlog.md`**

Mark all seven Sprint 3 checklist items `[x]`, and add a short note (matching the style of the existing Sprint 1/2 "Durchgetestet"/"Deploy-Lücke" paragraphs) describing what was actually verified live and any deviations found. Do not silently mark it done without having completed Steps 2-3 above first - that was exactly the mistake the Sprint 1 deploy-gap note exists to call out.

- [ ] **Step 5: Commit**

```bash
git add docs/backlog.md
git commit -m "Mark Sprint 3 complete - cart, wishlist, product page, reviews verified live"
```
