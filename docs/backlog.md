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
- [ ] nginx-Block für `almo-group.vn-nspace.de` auf dem VPS eintragen (Referenzdatei liegt fertig unter `infra/nginx/almo-group.vn-nspace.de.conf`), `certbot` für TLS
- [ ] Ports auf dem VPS gegen `docker ps` geprüft, `.env`-Datei auf dem VPS angelegt (Vorlage: `infra/.env.example`)
- [ ] Einmal `docker compose up -d` auf dem VPS durchspielen, Platzhalter-Seite unter der Subdomain erreichbar

Die drei offenen Punkte brauchen root/SSH-Zugriff auf den VPS und werden separat gemacht, sobald der Server-Zugriff ansteht.

Abweichung von der ursprünglichen Sprint-0-Planung: Frontend-Lint läuft über `oxlint` statt `ESLint` (moderner Vite-Default, spart Konfigaufwand) - CI-Workflow spiegelt das wider. Falls explizit ESLint gewünscht ist, kurz Bescheid geben.

## Sprint 1 - Auth & Datenmodell

Ziel: Login/Register/Logout funktioniert gegen echtes Backend, komplettes DB-Schema steht.

- [ ] Flyway-Migrationen für alle Tabellen aus dem Datenmodell (inkl. `password_reset_tokens`, `contact_preference`/`shipping_cost` auf `orders`)
- [ ] Spring Security Session-Auth: Register, Login, Logout (Cookie `SameSite=Lax`, `Secure`)
- [ ] Redis als Spring-Session-Store angebunden
- [ ] Passwort-Hashing (BCrypt o.ä.)
- [ ] Admin-Rolle + **eigener Admin-Login-Pfad** (getrennt vom Kunden-Login)
- [ ] Passwort-Reset-Flow: Token anlegen, Reset-Mail über Brevo, Token einlösen
- [ ] Frontend: Login/Register-Formulare gegen echte API, Session-Handling ersetzt `localStorage`-Auth aus dem Altdesign

## Sprint 2 - Produktkatalog live

Ziel: Startseite und Shop-Seite laufen auf echten Backend-Daten statt dem statischen `PRODUCTS`-Array.

- [ ] Products/Categories/Translations-API (CRUD, erstmal ohne Admin-UI, direkt über Migration/Seed befüllt)
- [ ] Produktdaten aus dem Altdesign (`almofrontenddesign/js/products.js`) migrieren, inkl. `metal_color`-Werten pro Produkt
- [ ] Frontend: Header/Footer/Startseite/Shop-Seite auf API umgestellt
- [ ] Shop-Seite: Kategorie-Filter (bestand schon), neu dazu: Preis-Range-Filter, Verfügbarkeits-Filter, Metall/Farbe-Filter
- [ ] Suche (Produktname/Kategorie/Beschreibung) gegen Backend statt Client-seitigem Array-Filter

## Sprint 3 - Cart, Wishlist, Produktseite

Ziel: Kompletter Produktentdeckungs-Flow bis zum vollen Warenkorb.

- [ ] Cart-API: session-/user-gebunden, Merge des Gast-Warenkorbs beim Login
- [ ] Wishlist-API (an eingeloggten User gebunden)
- [ ] Frontend: Warenkorb-Seite (Menge ändern, entfernen, Zwischensumme), Mini-Warenkorb-Flyout im Header
- [ ] Frontend: Wishlist-Seite
- [ ] Produktseite: Bildergalerie, Beschreibung, Details, "zuletzt angesehen", Sticky-"In den Warenkorb"-Bar
- [ ] Reviews-API: nur Käufer dürfen bewerten, Durchschnittsrating berechnet (kein eigenes Feld)
- [ ] Produktseite: Bewertungsliste + Formular für Käufer

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
