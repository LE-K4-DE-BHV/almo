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
- Reviews are read-only for now (`GET /api/products/{id}/reviews`) - writing is gated on having bought the product, which needs Sprint 4's `orders` table to check against. Don't add a review-write endpoint before that exists; there'd be nothing real to enforce the purchase check with.
- `frontend/src/cart/` and `frontend/src/wishlist/` each follow the same three-file split as `frontend/src/auth/` (Context/Provider/hook) for the same fast-refresh reason.

## Deployment (VPS)

Out of scope for a normal dev workflow - covered in the spec's "Deployment / Infra" section and `infra/nginx/almo-group.vn-nspace.de.conf`. Requires root/SSH access to the shared VPS; not something to run from a local machine. Ask before touching anything server-side, per CLAUDE.md's team-coordination rules.

## Known gaps (tracked, not urgent)

- No local JDK 25 currently installed on the primary dev machine - backend is built/run via Docker there; install one (e.g. Eclipse Temurin) if you want `./mvnw` to work directly on the host.
- Frontend lint uses oxlint instead of the ESLint originally mentioned in the spec - faster, zero-config, but flag it if the team wants ESLint specifically.
