# Almo Shop - Backlog & Sprintplan

Grundlage: [2026-09-11-almo-shop-design.md](superpowers/specs/2026-09-11-almo-shop-design.md). Team: 2-4 Leute, Sprintlänge 2 Wochen. 7 Sprints, aufeinander aufbauend - jeder Sprint endet mit einem lauffähigen Zwischenstand.

## Sprint 0 - Fundament

Ziel: Monorepo steht, alles startet lokal und einmal auf dem VPS durch.

Lokal erledigt (siehe Commit-Historie):
- [x] Monorepo-Struktur angelegt: `/frontend`, `/backend`, `/infra`
- [x] Backend-Skeleton: Spring Boot 4.1 Projekt (Boot 3 wird von start.spring.io nicht mehr angeboten, siehe Spec), Grundkonfiguration inkl. Redis/Postgres-Anbindung über Env-Variablen
- [x] Frontend-Skeleton: Vite + React + TypeScript, react-i18next Grundgerüst (DE/EN/FR-Platzhalter)
- [x] `docker-compose.yml` (lokal): Postgres, Redis, Backend, Frontend - einmal komplett hochgefahren und verifiziert (Flyway-Migration lief gegen echtes Postgres, `/actuator/health` und Frontend beide erreichbar)
- [x] Flyway eingebunden, Baseline-Migration mit komplettem Schema aus der Spec (nicht nur leer, da Datenmodell schon feststand)
- [x] CI-Pipeline-Grundgerüst: Lint-Stufe (`.github/workflows/ci.yml`) - Frontend: oxlint + Build, Backend: Spotless-Check + Compile
- [x] nginx-Block für `almo-group.vn-nspace.de` auf dem VPS eingetragen, `certbot` für TLS durchgelaufen (echtes Let's-Encrypt-Zertifikat, gültig bis 10.12.2026)
- [x] Ports auf dem VPS gegen `docker ps` geprüft (8093/8094 frei), `.env` auf dem VPS angelegt (Werte aus `infra/.env.example`, DB-Passwort frisch generiert, Brevo/Cloudinary-Keys ergänzt)
- [x] `docker compose up -d` auf dem VPS durchgespielt, DNS-A-Record für `almo-group.vn-nspace.de` gesetzt, Seite unter https://almo-group.vn-nspace.de erreichbar (React-Startseite lädt)

Sprint 0 ist damit komplett fertig.

Abweichung von der ursprünglichen Sprint-0-Planung: Frontend-Lint läuft über `oxlint` statt `ESLint` (moderner Vite-Default, spart Konfigaufwand) - CI-Workflow spiegelt das wider. Falls explizit ESLint gewünscht ist, kurz Bescheid geben.

Zusätzlich erledigt: Java auf dem Backend von 21 auf 25 (LTS) gewechselt (siehe Chat-Recherche zu Support-Zeiträumen). Dabei aufgefallen: `spotless-maven-plugin` 2.44.3 crasht auf JDK 25 (bekannter Bug, `NoSuchMethodError` in Googles Java-Format wegen geänderter javac-internals) - auf 3.10.2 gehoben, das wählt automatisch eine JDK-25-kompatible google-java-format-Version. Developer-Guide (`docs/developer-guide.md`) angelegt und alle Sprint-0-Dateien rückwirkend kommentiert (Backend: Javadoc + Inline-Kommentare, Frontend: TS/CSS, Docker/Compose/CI/nginx).

## Sprint 1 - Auth & Datenmodell

Ziel: Login/Register/Logout funktioniert gegen echtes Backend, komplettes DB-Schema steht.

Bereits aus Sprint 0 erledigt: Flyway-Migrationen für alle Tabellen (`V1__init.sql`, inkl. `password_reset_tokens`, `contact_preference`/`shipping_cost` auf `orders`), Redis als Spring-Session-Store angebunden (noch ungetestet mit echter Login-Logik).

### Technische Entscheidungen (festgelegt vor der Implementierung)

- **Passwort-Hashing: Argon2id**, explizit als `Argon2PasswordEncoder`-Bean konfiguriert (nicht der Bcrypt-Default von `PasswordEncoderFactories.createDelegatingPasswordEncoder()`) - aktuelle OWASP-Empfehlung (Stand 2024+), bcrypt ist zwar weiterhin akzeptabel, aber nicht mehr Erstempfehlung.
- **Admin-Auth-Trennung**: gleiche `users`-Tabelle mit `role`-Spalte bleibt, es geht nur um den Auth-Mechanismus. Eigener Endpoint `POST /api/admin/auth/login` prüft nach erfolgreicher Authentifizierung zusätzlich `role = ADMIN` (falsche Rolle → 403, obwohl Credentials stimmen). Eigene `@Order`-Security-Filter-Chain sichert `/api/admin/**` ab, separat von der Kunden-Filter-Chain für den Rest von `/api/**`. Gleicher Session-Cookie-Mechanismus wie bei Kunden, kein zweiter Cookie-Name.
- **CSRF-Schutz**: `CookieCsrfTokenRepository` (httpOnly=false) zusätzlich zum `SameSite=Lax`-Session-Cookie aus der Spec - Frontend liest den CSRF-Token aus dem Cookie und schickt ihn bei state-changing Requests als Header mit.
- **Passwort-Reset-Token**: 1 Stunde Gültigkeit ab Erstellung.
- **API-Pfade**: `/api/auth/*` für Kunden-Login/Register/Logout/Reset, `/api/admin/auth/*` für Admin-Login - konsistent mit der Filter-Chain-Trennung.

### Aufgaben

- [x] `User`-Entity/Repository, `PasswordResetToken`-Entity/Repository
- [x] `Argon2PasswordEncoder`-Bean, Security-Config mit zwei Filter-Chains (`/api/admin/**` vs. Rest), CSRF-Cookie-Konfiguration (`.csrf(csrf -> csrf.spa())`, Spring Security 7 Kurzform)
- [x] Endpunkte: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/password-reset/request`, `POST /api/auth/password-reset/confirm`
- [x] Endpunkt: `POST /api/admin/auth/login` (gleicher Mechanismus + Rollenprüfung, Rolle wird vor Session-Erstellung geprüft)
- [x] Passwort-Reset-Mail über Brevo (Token-Link, 1h Ablauf, kein API-Key lokal → `BrevoMailService` loggt statt zu senden)
- [x] Frontend: Login-/Register-/Admin-Login-/Forgot-Password-/Reset-Password-Formulare gegen echte API, `AuthProvider`+`useAuth` ersetzt `localStorage`-Auth aus dem Altdesign, Routing über `react-router` v8, `RequireAuth`/`RequireAdmin`-Guards

Manuell + per Playwright-artigem Browser-Test durchgespielt (Register → Logout → falsches Passwort → richtiges Passwort → Admin-Login mit Kunden-Account abgelehnt → Passwort-Reset-Request/Confirm → Login mit neuem Passwort) - lief sauber durch.

**Deploy-Lücke gefunden und behoben:** Der erste Live-Check gegen `https://almo-group.vn-nspace.de` schlug fehl (401 mit Spring-Boot-Default-Security, generiertes In-Memory-Passwort) - die VPS-Container liefen noch auf dem Sprint-0-Build, `SecurityConfig`/`AuthController` fehlten im laufenden Jar, weil `docker compose up -d --build` seit dem Sprint-1-Commit nicht mehr gelaufen war. Nach Rebuild auf dem VPS lief der komplette Auth-Flow live sauber durch, damit ist Sprint 1 jetzt wirklich (nicht nur im Code) fertig. Die Startseite `/` zeigt weiterhin bewusst das Vite-Scaffold (`App.tsx`) - echte Formulare liegen unter `/login`, `/register`, `/admin/login` usw., die Homepage kommt erst in Sprint 2.

**Zwei echte Stolpersteine, die nur beim tatsächlichen Ausführen auffielen (nicht beim Kompilieren):**
- `Argon2PasswordEncoder` wirft zur Laufzeit `NoClassDefFoundError`, wenn `org.bouncycastle:bcprov-jdk18on` nicht explizit als Dependency drinsteht - Spring Security bündelt die Argon2-Implementierung nicht selbst. Ergänzt in `pom.xml` (Version 1.80, per Maven-Central-API geprüft).
- `react-router` v8.3.0 exportiert `BrowserRouter`/`Routes`/`Route`/`Link`/`Navigate`/Hooks alle aus dem Hauptpaket `react-router` - **nicht** aufgeteilt auf `react-router/dom` für Komponenten wie ein offizieller Changelog-Eintrag nahelegte. Gegen die tatsächlichen `.d.ts`-Dateien im installierten Paket geprüft und entsprechend korrigiert.
- `erasableSyntaxOnly` im Frontend-`tsconfig` verbietet Parameter-Property-Shorthand (`constructor(public readonly x: T)`) - betrifft jede neue TS-Klasse mit Constructor-Feldern, nicht nur diesen Sprint.

## Sprint 2 - Produktkatalog live

Ziel: Startseite und Shop-Seite laufen auf echten Backend-Daten statt dem statischen `PRODUCTS`-Array.

### Technische Entscheidungen (festgelegt vor der Implementierung)

- **Keine Platzhalter-Produkte migriert**: die alten `almofrontenddesign/js/products.js`-Eintraege waren nur Mockups, werden nicht uebernommen. Echte Produkte kommen erst durch die Admin-UI in Sprint 5. Kategorien (Ringe/Halsketten/Ohrringe/Armbaender) sind dagegen Taxonomie, nicht Platzhalter-Content, und werden per Migration geseedet.
- **Dev-only Test-Seed**: eine kleine, klar als "nur zum Testen" markierte Migration (`V4__seed_dev_products.sql`) mit 6 Produkten deckt alle Filter/Status-Faelle ab (Kategorien, Metallfarben, in/low/out-of-stock), bis Sprint 5 echte Daten liefert.
- **Produktsuche: Postgres-Volltextsuche** (`tsvector`, GIN-Index) statt einfachem `ILIKE` - Entscheidung explizit gegen die urspruengliche Empfehlung getroffen. `'simple'`-Textsuche-Konfiguration (kein Stemming), da `product_translations` DE/EN/FR gemischt in derselben Spalte haelt und ein sprachspezifischer Stemmer die falsche Sprache verstuemmeln wuerde.
- **CSS: Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first `@theme`-Konfiguration, kein `tailwind.config.js`) statt CSS-Module oder 1:1-Uebernahme des Altdesigns - bewusste Grundsatzentscheidung fuer alle kommenden Seiten. Marke/Palette aus `almofrontenddesign/css/base.css` als `--color-brand-*`-Tokens uebernommen.
- **Read-Modell ohne JPA**: `/api/products`/`/api/categories` laufen ueber `JdbcClient` (dynamisches SQL, Volltextsuche, korrelierte Rating-Subquery), nicht ueber Spring-Data-JPA-Entities - vermeidet fruehes Hibernate-Mapping von Postgres-Arrays/generated columns fuer einen reinen Read-Endpoint. Sprint 5 fuehrt fuers Admin-CRUD eigene Write-Entities ein.

### Aufgaben

- [x] Products/Categories/Translations-API (read-only, `ProductSearchRepository`/`CategoryRepository` via `JdbcClient`)
- [x] Kategorien geseedet (`V2__seed_categories.sql`), Volltextsuche-Spalte + GIN-Index (`V3__product_search.sql`), Dev-Testprodukte (`V4__seed_dev_products.sql`)
- [x] Frontend: Header/Footer/Startseite/Shop-Seite auf API umgestellt (Tailwind-Rebuild, altes Vite-Scaffold `App.tsx` entfernt)
- [x] Shop-Seite: Kategorie-, Preis-Range-, Verfuegbarkeits-, Metall/Farbe-Filter, alle URL-getrieben (bookmarkbar, wie im Altdesign)
- [x] Suche (Header-Suchfeld) gegen Backend-Volltextsuche, sprachabhaengig (DE/EN/FR liefern jeweils eigene Treffer)

Durchgetestet: alle Filter/Suche/Sortier-Kombinationen per curl gegen die API, danach der komplette Shop-Flow im echten Browser (Kategorie-Filter, Sprachwechsel DE→EN mit Live-Neuladen der lokalisierten Daten, Suche ueber die Kopfzeile) - lief sauber durch.

**Ein echter Bug gefunden und gefixt, nur im Browser sichtbar:** Tailwind v4 wrapped seine Utilities in CSS Cascade Layers (`@layer ...`). Eine eigene, nicht in ein `@layer` verpackte Regel (`a { color: inherit; }`) hat dadurch *jede* Tailwind-Textfarben-Utility ausgehebelt (z.B. `text-white`), unabhaengig von Spezifitaet - Cascade Layers werden vor Spezifitaet aufgeloest, unlayered CSS gewinnt immer. Sichtbar erst am gerenderten Button (Text unsichtbar, Farbe = Hintergrundfarbe), nicht am Build oder im Code. Fix: eigene Basis-Regeln in `@layer base` verschieben.

## Sprint 3 - Cart, Wishlist, Produktseite

Ziel: Kompletter Produktentdeckungs-Flow bis zum vollen Warenkorb.

### Technische Entscheidungen (festgelegt vor der Implementierung)

- **Reviews: nur Lese-Seite jetzt, Schreiben erst Sprint 4.** "Nur Käufer dürfen bewerten" braucht die `orders`-Tabelle, die erst Sprint 4 (Checkout) füllt - vorher gäbe es niemanden, der die Kauf-Pruefung bestehen könnte. `/api/products/{id}/reviews` (GET) und die Durchschnittsrating-Berechnung sind fertig, das Bewertungsformular kommt mit Sprint 4.
- **Cart-Identität für Gäste: bestehende Spring-Session** (Cookie existiert schon wegen CSRF) statt eigenem Cart-Cookie/Token. `cart_items.session_id` = `HttpSession`-ID.

### Aufgaben

- [x] Cart-API: session-/user-gebunden (`CartOwner`, `CartService`), Merge des Gast-Warenkorbs beim Login/Register
- [x] Wishlist-API (an eingeloggten User gebunden, kein Gast-Wishlist - `wishlist_items` hat keine `session_id`-Spalte)
- [x] Frontend: Warenkorb-Seite (Menge ändern, entfernen, Zwischensumme), Mini-Warenkorb-Flyout im Header
- [x] Frontend: Wishlist-Seite
- [x] Produktseite: Bildergalerie, Beschreibung, Details, "zuletzt angesehen" (localStorage, client-only), Sticky-"In den Warenkorb"-Bar (mobil)
- [x] Reviews-API (nur Lesen): Liste + Durchschnittsrating, Schreiben bewusst zurückgestellt (s.o.)
- [x] `GET /api/products?ids=1,2,3` ergänzt (Bypass der Filter) - für "zuletzt angesehen" im Frontend gebraucht, um Produktkarten für eine feste ID-Liste zu laden

Durchgetestet: kompletter curl-Flow (Gast fügt 2 Produkte hinzu → registriert sich → Warenkorb bleibt erhalten und ist auf den User umgehängt, Merge-Logik bei bereits vorhandenem Produkt, Ownership-Check verhindert Zugriff auf fremde Cart-Items → 404 statt Leak), danach der komplette Flow im echten Browser (Add-to-Cart → Mini-Flyout → Produktseite → Wishlist-Redirect für Gäste → Registrierung → Cart-Merge sichtbar im Header-Badge → Menge ändern → Entfernen).

**Ein echtes Sicherheitsproblem gefunden und gefixt, nicht Teil der urspruenglichen Aufgabe:** Der Login/Register-Flow aus Sprint 1 rotierte die Session-ID beim Login nie (Session Fixation) - weil der Login manuell `AuthenticationManager.authenticate()` aufruft statt durch Spring Securitys Standard-Filterkette zu laufen, die das automatisch übernimmt. Ein Angreifer, der einem Opfer vorher eine Session-ID unterschiebt, hätte nach dessen Login weiterhin eine gültige Session gehabt. Gefixt in `AuthService.persistSession()` via `request.changeSessionId()`, direkt vor dem Speichern des Security-Context - und musste ohnehin gelöst werden, um die Guest-Session-ID vor der Rotation für den Cart-Merge einzufangen.

## Sprint 4 - Checkout & Bestellablauf

Ziel: Eine Bestellung lässt sich komplett end-to-end durchklicken.

- [ ] Checkout-Frontend: Kontakt-/Adressdaten, **Kontaktweg-Wahl (WhatsApp/E-Mail) statt Zahlungsart**, Bestellübersicht inkl. Versandkosten
- [ ] Backend: Order-Anlage, `stock_quantity`-Abzug, Versandkosten-Berechnung (3,90 € / kostenlos ab 30 €) serverseitig
- [ ] Brevo-Anbindung: Bestellmail an Admin-Adresse
- [ ] PDF-Generierung für den Kunden (Produkte, Preise, WhatsApp + E-Mail vom Admin)
- [ ] Konto-Seite: Bestellhistorie mit Status, alte PDFs erneut herunterladen
- [ ] Account-Selbstlöschung im Konto-Bereich

## Sprint 5 - Admin-Bereich

Ziel: Admin kann den Shop komplett ohne direkten DB-Zugriff pflegen.

- [ ] Admin-UI: Produkte anlegen/bearbeiten (Lagermenge, Preis, Kategorie, Metall/Farbe, Übersetzungen)
- [ ] Cloudinary-Anbindung: Backend-Upload-Endpoint (`almo/products/<product-id>/`), Admin-UI zum Hochladen/Zuordnen von Bildern
- [ ] Admin-UI: Kategorien pflegen
- [ ] Admin-UI: Bestellungen einsehen, Status ändern (OPEN/CONTACTED/DONE)
- [ ] Admin-UI: Reviews moderieren (bearbeiten/verstecken)

## Sprint 6 - Feinschliff & Betriebsreife

Ziel: Shop ist stabil genug für echten Dauerbetrieb (im Rahmen des Lernprojekt-Scopes).

- [ ] Newsletter-Anmeldung im Footer (Backend-Anbindung `newsletter_subscribers`)
- [ ] Täglicher `pg_dump`-Cronjob auf dem VPS
- [ ] E2E-Tests (Playwright) für die Kernflows: Registrierung, Login, Produkt in Warenkorb, Checkout, Admin-Produktanlage
- [ ] CI/CD komplett: Security-Scan-Stufe (OWASP Dependency-Check, `npm audit`, Trivy), Auto-Deploy bei grünem `main`
- [ ] Responsive-/Cross-Browser-Check aller Seiten
- [ ] Restliche Sprachlücken DE/EN/FR schließen

## Bewusst zurückgestellt (nicht in obigen Sprints)

Siehe Spec-Abschnitt "Bewusst außerhalb des MVP-Scopes": Rechtsseiten (Impressum/Datenschutz/AGB/Widerruf), Cookie-Consent, DSGVO-Datenexport, MwSt.-Hinweis, Object-Storage-Alternativen zu Cloudinary, echtes Payment (Stripe o.ä.). Kommen als eigene Sprints, sobald ein Gewerbe existiert bzw. der Shop live geht.
