# Almo Shop - Developer Guide

Living document. Update this whenever setup steps, project structure, or workflows change - don't let it drift from what's actually in the repo. See [CLAUDE.md](../CLAUDE.md) for working-style rules and [backlog.md](backlog.md) for what's currently being built.

## Prerequisites

- **Docker Desktop** (or Docker Engine + Compose v2) - everything runs in containers, this is the only hard requirement to get the stack up
- **Node.js 22** - only needed if you want to run the frontend outside Docker (faster dev loop with Vite's dev server/HMR)
- **JDK 25** - only needed if you want to run/build the backend outside Docker with `./mvnw`. The backend's Docker image pins JDK 25 internally (`backend/Dockerfile`), so Docker builds work regardless of your local JDK.
- **Git**

You do not need Maven or a global Node install - the backend ships a Maven wrapper (`./mvnw`), and Docker builds don't need Node on the host at all.

## Project layout

```
backend/     Spring Boot 4.1 API (Java 25, Maven)
frontend/    React + TypeScript SPA (Vite, Tailwind CSS v4, react-router, react-i18next)
infra/       Deployment references: .env.example, VPS nginx config
docs/        Specs, backlog, this guide
almofrontenddesign/   Original static HTML/CSS/JS mockup - source of the brand palette/copy
                       (see frontend/src/index.css's @theme block) and page content while
                       frontend/ is being rebuilt; not served, kept for reference (backlog Sprint 2)
```

### Backend package layout

```
auth/       Login/register/logout/password-reset endpoints and services
user/       User entity + repository
security/   SecurityConfig (two filter chains), Argon2 password encoder
mail/       Brevo transactional email client
catalog/    Products/categories - read-only, JdbcClient-based (not JPA entities,
            see Sprint 2 decision in docs/backlog.md), full-text search
common/     Shared API error shape + exception handling
```

## Running the whole stack locally

```bash
cp infra/.env.example .env
docker compose up -d
```

- Frontend: http://127.0.0.1:8093
- Backend: http://127.0.0.1:8094 (health check: `/actuator/health`)
- Postgres and Redis are only reachable from other containers, not from the host - by design, see `docker-compose.yml` comments.

Flyway runs the migrations in `backend/src/main/resources/db/migration/` automatically on backend startup. Tear everything down (including the DB volume) with:

```bash
docker compose down -v
```

`docker compose down` (without `-v`) keeps the Postgres volume so your data survives a restart.

## Running services individually (faster dev loop)

**Backend**, against a Postgres/Redis you start separately (or via `docker compose up -d db redis`):

```bash
cd backend
./mvnw spring-boot:run
```

Needs a local JDK 25 on PATH for this to work (see Prerequisites) - if you only have an older JDK, use the Docker path above instead, or build the jar in Docker and run it locally: `docker compose build backend`.

**Frontend**, with hot reload instead of a static build:

```bash
cd frontend
npm install
npm run dev
```

`vite.config.ts` already proxies `/api/*` to `http://localhost:8094` (see the `server.proxy` block), so `npm run dev` talks to a backend running on the default port with no extra setup - just make sure something's actually listening there (`docker compose up -d db redis backend`, or `./mvnw spring-boot:run`).

The Docker-built frontend (`docker compose up`) also proxies `/api/*`, via nginx this time (`frontend/nginx.conf`) - so the full stack works standalone through `docker compose up` alone, without needing `npm run dev` at all. That nginx block mirrors what the VPS-level nginx does in production (see `infra/nginx`).

## Database migrations

- Flyway, files under `backend/src/main/resources/db/migration/`, named `V<n>__description.sql`.
- **Never edit a migration that has already run anywhere** (local, CI, VPS) - Flyway checksums each applied migration and refuses to start if a file changed underneath it. Add a new `Vn+1__*.sql` instead.
- After adding a migration, restart the backend (`docker compose restart backend` or re-run `spring-boot:run`) - Flyway applies pending migrations on startup, there's no separate "migrate" command to run first.

## Code style & formatting

- **Backend**: [Spotless](https://github.com/diffplug/spotless) with Google Java Format, enforced in CI. Before committing:
  ```bash
  cd backend
  ./mvnw spotless:apply
  ```
  If you don't have a local JDK 25, run it through Docker instead:
  ```bash
  docker run --rm -v "$(pwd)/backend:/app" -w /app eclipse-temurin:25-jdk ./mvnw -q spotless:apply
  ```
- **Frontend**: [oxlint](https://oxc.rs/docs/guide/usage/linter.html) (`npm run lint` in `frontend/`). No auto-formatter configured yet.
- All code comments: professional English, explain non-obvious *why*, not what the code already says. See CLAUDE.md.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every PR:
- `lint-frontend`: `npm ci`, `npm run lint`, `npm run build` (build also type-checks via `tsc -b`)
- `lint-backend`: `./mvnw spotless:check`, `./mvnw compile`

This is the Sprint 0 scope only. Test stages (JUnit/Testcontainers, Vitest, Playwright), the security scan, and the deploy step get added as later sprints land real code to test - see the spec's CI/CD section and `docs/backlog.md`.

## Secrets & environment variables

- Local/VPS runtime config lives in a `.env` file next to `docker-compose.yml`, copied from `infra/.env.example` and never committed (see `.gitignore`).
- CI-only secrets (deploy SSH key etc.) go in GitHub Actions repository secrets, not in `.env`.
- Never commit real Brevo/Cloudinary keys or DB passwords, including in this doc's examples.
- Local dev without HTTPS: add `COOKIE_SECURE=false` to your `.env` (see the comment in `infra/.env.example`) - the session cookie is `Secure` by default (right for the VPS, wrong for plain `http://localhost`).
- No `BREVO_API_KEY` set → password-reset emails aren't actually sent, `BrevoMailService` just logs a warning with the recipient/subject instead. Fine for local dev; check the backend logs to see the reset link it would have sent.

## Authentication (Sprint 1)

- Session-cookie auth, not JWT - see the spec and the Sprint 1 "Technische Entscheidungen" in `docs/backlog.md` for why (Argon2id hashing, two separate Spring Security filter chains for `/api/admin/**` vs. everything else, CSRF via `.csrf(csrf -> csrf.spa())`).
- Every state-changing request needs the CSRF cookie echoed back as a header. The frontend's `apiFetch` helper (`frontend/src/api/client.ts`) does this automatically - always go through it (or the typed wrappers in `frontend/src/api/auth.ts`) rather than calling `fetch` directly.
- `frontend/src/auth/` holds the client-side auth state: `AuthContext.ts` (the React context + its type, no JSX), `AuthProvider.tsx` (the component that owns `user`/`loading` state and calls the API), `useAuth.ts` (the hook), `RequireAuth.tsx`/`RequireAdmin.tsx` (route guards). Split into four files instead of one - oxlint's fast-refresh rule wants a file to export either only components or only non-component values, not a mix.
- Admin accounts aren't created through any UI yet (no self-service admin signup, by design) - promote a user manually for local testing: `UPDATE users SET role='ADMIN' WHERE email='...';` against the `db` container.

## Product catalog (Sprint 2)

- `GET /api/products` and `GET /api/categories` are public (no auth needed), both take a `lang` query param (`de`/`en`/`fr`, defaults to `de`) - the backend returns already-localized strings, the frontend never assembles translations itself.
- `/api/products` filters: `category` (key), `minPrice`/`maxPrice`, `metalColor`, `availability` (`in_stock`/`low_stock`/`out_of_stock`), `search` (Postgres full-text, see `V3__product_search.sql`), `sort` (`price-asc`/`price-desc`/`name`/`rating`).
- No products are seeded for real use - only a handful of dev-only test products (`V4__seed_dev_products.sql`, clearly commented as such). Real products come from the admin UI in Sprint 5; don't add more placeholder products by hand, add real ones through that UI once it exists.
- **Tailwind CSS v4 gotcha**: any custom CSS you add to `frontend/src/index.css` outside a component's own file MUST go inside `@layer base` (or `@layer components`/`@layer utilities`, as appropriate) - unlayered CSS always wins over Tailwind's utilities regardless of specificity, because CSS cascade layers are resolved before specificity. A bare `a { color: red }` at the top level would silently override every `text-*` utility in the app. See the comment in `index.css` for the concrete bug this caused during Sprint 2.
- Brand colors/fonts live in `frontend/src/index.css`'s `@theme` block (`--color-brand-*`, `--font-brand`) - reference them as Tailwind classes like `bg-brand-bg`, `text-brand-accent`, not as raw hex values in components.

## Cart, wishlist, reviews (Sprint 3)

- Cart works for guests: `CartController` resolves a `CartOwner` per request - a logged-in user's id, or (for guests) the current `HttpSession` id, created on first touch if none exists yet. Every cart-item lookup in `CartService` checks the item actually belongs to that owner before returning/mutating it (wrong owner -> 404, same as "doesn't exist" - never leaks which ids exist).
- On login/register, `AuthController` merges the guest cart into the user's account (`CartService.mergeGuestCartIntoUser`) - matching product rows get their quantities summed, others get reassigned. The frontend must call `useCart().refresh()` right after a successful login/register (see `LoginPage`/`RegisterPage`) or the header/cart page keeps showing the stale pre-login state.
- **Session fixation fix**: `AuthService.persistSession()` now calls `request.changeSessionId()` before saving the security context - the hand-rolled REST login never went through Spring Security's usual filter chain, so nothing used to rotate the session id on login. If you add another custom login path, remember this doesn't happen automatically the way it does for filter-based (e.g. form) logins.
- Wishlist has no guest mode by design - `wishlist_items` has no `session_id` column (see `V1__init.sql`). `WishlistProvider` only fetches once `useAuth()` reports a logged-in user.
- Reviews are read-only for now (`GET /api/products/{id}/reviews`) - writing is gated on having bought the product. Orders exist as of Sprint 4, but the write endpoint/form is still a separate, not-yet-scheduled piece of work - don't assume it ships automatically just because orders now exist.
- `frontend/src/cart/` and `frontend/src/wishlist/` each follow the same three-file split as `frontend/src/auth/` (Context/Provider/hook) for the same fast-refresh reason.

## Checkout & orders (Sprint 4)

- Checkout (`POST /api/checkout`) always builds the order from the caller's server-side cart (`CartItemRepository`), never from the request body - the request only carries name/address/city/contact preference. This is deliberate: trusting client-supplied prices/products would let anyone check out at whatever price they typed.
- Stock decrement (`ProductStockRepository.decrementStock`) is a single conditional `UPDATE ... WHERE stock_quantity >= :quantity`, checked by affected-row-count, not a SELECT-then-UPDATE - avoids a race between two concurrent checkouts for the last unit of something. If any item in an order fails this check, the whole checkout throws and the `@Transactional` on `OrderService.checkout` rolls back every decrement already applied in that same loop, so an order is never left half-decremented.
- `Order`/`OrderItem` are real JPA entities (unlike the catalog, see Sprint 2) - `items` is a **lazy** `@OneToMany`. `OrderRepository`'s queries use `JOIN FETCH` on purpose; dropping that reintroduces `LazyInitializationException` the moment anything (e.g. `Order.total()`) touches `items` outside the original transaction - this bit us in practice during Sprint 4, not just in theory.
- Order PDFs (`OrderPdfService`, OpenPDF) are rendered fresh on every `GET /api/orders/{id}/pdf` call from the `Order` entity - nothing is cached or stored to disk. `OrderItem.productName`/`priceAtOrder` are snapshots taken at checkout time specifically so this stays correct even if a product is later renamed/deleted (Sprint 5 admin CRUD makes both possible).
- Frontend guard gotcha: any page that redirects based on `useAuth()`/`useCart()` state (like `CheckoutPage`) must check their `loading` flags first, the same way `RequireAuth` does - otherwise a hard navigation straight to that URL redirects away before the async `/api/auth/me`/`/api/cart` calls have resolved, bouncing a logged-in user with real cart contents. See the two bugs noted under Sprint 4 in `docs/backlog.md` for what this looks like when it's missed (including a subtler variant: a post-success `refresh()` call can itself trigger a stale-guard redirect that races the intended `navigate()`).

## Admin area (Sprint 5)

- Admin routes (`/admin/**`) have their own filter chain and login (`/api/admin/auth/login`), separate from the customer one - see Sprint 1's decision. The frontend mirrors that: `AdminLoginPage` sits outside `<Layout>`, everything else under `/admin/*` is wrapped in `RequireAdmin` + `AdminLayout` (`frontend/src/AppRouter.tsx`).
- Unlike the read-only catalog (`JdbcClient`, Sprint 2), the admin write side uses real JPA entities - `Product`/`Category`/`ProductTranslation`/`CategoryTranslation` (`backend/src/main/java/de/almo/backend/catalog/`). Two persistence styles coexist in the same package on purpose: dynamic filtering/full-text search doesn't map cleanly onto JPA, transactional CRUD does.
- **JOIN FETCH is mandatory here too**: `translations` on both entities is a lazy `@OneToMany`. `CategoryJpaRepository`/`ProductJpaRepository` expose `findAllWithTranslations()`/`findByIdWithTranslations()` with `LEFT JOIN FETCH` - use them from the admin services, not the plain `findAll()`/`findById()` Spring Data gives you for free, or you'll hit the same `LazyInitializationException` class of bug as `Order.items` in Sprint 4.
- **Updating a translation collection**: never `.clear()` the collection and re-add - with `orphanRemoval=true`, Hibernate can flush the new INSERTs before the old DELETEs in the same flush, which trips the `(product_id, lang)`/`(category_id, lang)` unique constraint. `AdminProductService`/`AdminCategoryService.applyTranslations()` instead update matching-language entries in place and only add/remove what actually changed language-wise.
- `status` on `Product` is a DB-computed column (`@Generated(event = {INSERT, UPDATE})`, `insertable/updatable = false`) - never set it from Java, Postgres derives it from `stock_quantity` and Hibernate just re-reads it after write.
- Postgres `text[]` columns (`image_refs`, translation `details`) map via `@JdbcTypeCode(SqlTypes.ARRAY)` + `columnDefinition = "text[]"`, no converter needed.
- Deleting a `Product`/`Category` that's still referenced (by `order_items`/`products.category_id`) fails with a 409 (`ProductHasOrdersException`/`CategoryInUseException`) instead of cascading - same FK-as-business-rule pattern as account self-deletion in Sprint 4. The frontend just surfaces the backend's message as-is.
- **Image uploads go straight to Cloudinary**, nothing is written to the VPS disk - `ImageUploadService` builds a `Cloudinary` client from `CLOUDINARY_URL` at startup; if that env var is blank the client stays `null` and every upload attempt 503s with a clear message (`ImageUploadNotConfiguredException`) rather than silently falling back to local storage. Set `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>` in `.env` to enable it locally.
- Frontend: `frontend/src/api/admin.ts` holds all the typed admin API calls. `uploadProductImage`/`removeProductImage` don't go through the shared `apiFetch` (multipart body, not JSON) - they read the CSRF cookie and build the request by hand instead.
- Product edit form (`AdminProductFormPage`) keeps per-language fields in one `Record<string, ProductTranslation>` state object with a tab UI switching which language is visible - all three languages are always in memory and submitted together, the tabs are purely a display concern.
- The admin area intentionally doesn't use `react-i18next` - it's an internal tool for the team, not customer-facing storefront content, so its strings are plain English, matching the existing `AdminLoginPage` convention from Sprint 1.

## Newsletter & backups (Sprint 6)

- `POST /api/newsletter` (`backend/src/main/java/de/almo/backend/newsletter/`) is a single `JdbcClient` insert with `ON CONFLICT DO NOTHING` - no double opt-in, no confirmation email, see the Sprint 6 decision in `docs/backlog.md`. Resubscribing an already-registered address is a silent no-op, not an error, on purpose.
- Daily Postgres backups: `infra/backup/pg-backup.sh`, installed on the VPS by hand (crontab), not run by anything in CI/CD. See the script's own header comment for the crontab line and retention setting.

## Testing & CI/CD (Sprint 6)

- **Backend integration tests** (`backend/src/test/java/.../support/AbstractIntegrationTest.java`) run against real Postgres/Redis via Testcontainers, not mocks - `@Container` fields are `static`, so one Postgres/one Redis container is shared across the whole test JVM run instead of one per test class. Because of that sharing, tests must use unique fixture data (random emails/category keys, see `uniqueEmail()`-style helpers in the test classes) rather than assuming an empty schema - the dev seed data from `V4__seed_dev_products.sql` is also present, since Flyway runs its full migration set against the container.
  - `OrderServiceIntegrationTest`: checkout's stock-decrement and shipping-cost logic.
  - `AdminDeleteBlockIntegrationTest`: the FK-as-business-rule delete-block pattern from Sprint 5 (`ProductHasOrdersException`/`CategoryInUseException`).
  - `AuthCsrfIntegrationTest`: CSRF cookie/header handling via `MockMvc` - the exact mistake ("forgot the X-XSRF-TOKEN header") that came up repeatedly during manual curl testing in earlier sprints, now pinned down as a regression test.
  - Locally, Testcontainers needs a real Docker daemon reachable from wherever `./mvnw test` runs. Since this project builds/runs the backend via Docker on the primary dev machine (see "Known gaps" below), that means Docker-outside-of-Docker: mount the host's Docker socket into the build container and set `TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal` (Docker Desktop resolves that hostname back to the host, which is where the sibling Postgres/Redis containers actually publish their ports) - see the exact `docker run` invocation used to develop these tests in this session's history if you need to reproduce it. On a machine with a native Docker daemon (including GitHub Actions' `ubuntu-latest` runners) none of this is necessary, `./mvnw test` just works.
- **Frontend unit tests**: Vitest + React Testing Library, `npm run test` (frontend). `frontend/src/test/setup.ts` registers `@testing-library/react`'s `cleanup()` in an `afterEach` by hand - `vite.config.ts`'s `test.globals` is deliberately `false` (tests import `describe`/`it`/`expect` from `'vitest'` explicitly, matching the rest of the codebase's no-implicit-globals style), and RTL's own auto-cleanup only registers itself when it detects global test hooks. Skipping this produces flaky "found multiple elements" failures that have nothing to do with the component under test - state from a previous test staying mounted into the next one.
  - Covers `AuthProvider`/`CartProvider` (mocking the corresponding `api/*.ts` module) and `CheckoutPage` (full flow through real providers wrapped in a `MemoryRouter`).
- **E2E tests**: Playwright, in its own top-level `e2e/` package (not nested under `frontend/`) since it exercises the whole stack, not just the frontend build. Run `docker compose up -d` from the repo root first, then `npm test` from `e2e/`. Five specs cover the flows named in the spec's CI/CD section: registration, login, add-to-cart, checkout, admin product creation.
  - `e2e/tests/fixtures.ts` exports `test`/`expect` wrappers that every spec imports instead of `'@playwright/test'` directly - a `page.addInitScript` sets `localStorage.i18nextLng = 'de'` before the app's first script runs, pinning the language every text assertion depends on. `playwright.config.ts`'s own `locale: 'de-DE'` context option isn't enough by itself: `frontend/index.html` ships a static `lang="en"`, and i18next-browser-languagedetector's `htmlTag` check can win over the navigator-based one depending on detector order, so the app can render in English even with the browser context emulating German.
  - `addFirstProductToCart()` (also in `fixtures.ts`) waits for the `POST /api/cart/items` response before returning, not just for the button click - `CartProvider.addItem()` is async and a plain `.click()` only waits for the click event itself, so navigating away right after it races the request that actually creates the cart item.
  - Projects: `chromium`/`firefox`/`webkit` (desktop) + `mobile-chrome`/`mobile-safari` (Pixel 5/iPhone 13) - see the Sprint 6 decision in `docs/backlog.md` on why mobile viewports are part of the E2E matrix instead of a separate manual-only check. Running WebKit-based projects (`webkit`, `mobile-safari`) on this Windows dev machine needs `libglesv2.dll`/`libwebp.dll`/`nss3.dll` that aren't installed - Chromium-based projects work fine locally; WebKit/Firefox get their first real run in CI (`ubuntu-latest`, `playwright install --with-deps`).
  - Admin login needs a promoted account; `e2e/global-setup.ts` registers a fixed `e2e-admin@example.com` user via the real API (ignoring a 409 on repeat runs) and promotes it with `docker compose exec db psql` - the same manual step every admin-area sprint has used, just scripted.
  - Found and fixed two real mobile-layout bugs this way, not just missing translations: `CartPage`'s item row (`frontend/src/pages/CartPage.tsx`) didn't wrap on narrow viewports, and neither did `AdminLayout`'s header nav/`AdminProductFormPage`'s two-column field grid - both now use `flex-wrap`/a responsive grid instead of a fixed layout that only worked above a certain width.
- **CI** (`.github/workflows/ci.yml`): `lint-frontend`/`lint-backend` → `test-frontend`/`test-backend` → `e2e` → `security-scan` → `deploy` (inactive, see below). `test-backend` needs no special Docker setup on the runner (see above) - `ubuntu-latest` already has a Docker daemon `./mvnw test` can reach directly.
- **Security scan**: `npm audit --audit-level=high` (frontend), OWASP `dependency-check-maven` invoked ad hoc (`./mvnw org.owasp:dependency-check-maven:13.0.0:check`, not wired into the normal build lifecycle - it's slow and only useful in CI), and `aquasecurity/trivy-action` against the built `almo-backend`/`almo-frontend` images. The OWASP scan needs an `NVD_API_KEY` repo secret (free, register at https://nvd.nist.gov/developers/request-an-api-key) to avoid NVD's unauthenticated rate limit - without it the step is allowed to fail (`continue-on-error`) rather than blocking every PR on a slow/flaky first-run CVE feed download.
- **Deploy job**: written but `if: false` - activating it (SSH to the shared VPS on every green `main`) needs three repo secrets (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`) added by hand, then flipping that condition. Deliberately left for a human step rather than something built end-to-end in one sitting, since it's the one CI stage that reaches outside the CI runner into the shared VPS - see the Sprint 6 decision in `docs/backlog.md`.

## Deployment (VPS)

Out of scope for a normal dev workflow - covered in the spec's "Deployment / Infra" section and `infra/nginx/almo-group.vn-nspace.de.conf`. Requires root/SSH access to the shared VPS; not something to run from a local machine. Ask before touching anything server-side, per CLAUDE.md's team-coordination rules. The CI deploy job (see above) will eventually automate the routine "pull + rebuild + restart" part of this once its secrets are set up.

## Known gaps (tracked, not urgent)

- No local JDK 25 currently installed on the primary dev machine - backend is built/run via Docker there; install one (e.g. Eclipse Temurin) if you want `./mvnw` to work directly on the host. This also means backend Testcontainers tests need the Docker-outside-of-Docker workaround described above instead of just working out of the box.
- Frontend lint uses oxlint instead of the ESLint originally mentioned in the spec - faster, zero-config, but flag it if the team wants ESLint specifically.
- `LoginPage`/`RegisterPage`/`ForgotPasswordPage`/`ResetPasswordPage` are still the plain, unstyled Sprint 1 placeholders (no Tailwind classes) - Sprint 6 translated their text (closing the last real language gap, see `docs/backlog.md`) but didn't restyle them; that's separate, still-open work.
