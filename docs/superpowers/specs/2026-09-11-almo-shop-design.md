# Almo Shop - Design Spec

Ziel: aus dem statischen Design in `almofrontenddesign/` eine echte, funktionierende Web-App bauen. Gleiche Optik, aber mit echtem Backend statt localStorage.

## Stack

- Frontend: React + TypeScript, Vite, react-i18next für DE/EN/FR
- Backend: Spring Boot 3 (Java), Spring Security mit Session-Auth (Cookie, `SameSite=Lax`, `Secure`)
- DB: PostgreSQL, Migrationen mit Flyway
- Alles containerisiert (Docker), läuft auf dem bestehenden VPS
- Monorepo: `/frontend`, `/backend`, `/infra`

## Umgebung

Läuft auf dem bestehenden VPS (gleiche Maschine, auf der schon andere Projekte laufen wie `nspace`, `obs`, `spacegen` usw.). Kein eigener neuer Server, wir hängen uns nur als weiteres Projekt dran.

- Subdomain: **almo-group.vn-nspace.de**
- nginx + certbot laufen schon auf dem Host, verwalten TLS für alle Subdomains zentral
- Alle Server-Blöcke liegen in einer Datei: `/etc/nginx/sites-available/default` (kein eigenes File pro Projekt, `sites-enabled` hat nur den einen Symlink `default`)
- Jedes Projekt läuft in Containern, die nur auf `127.0.0.1:PORT` gebunden sind (kein direkter Zugriff von außen, nur über nginx)
- Postgres läuft im internen Docker-Netzwerk, ohne Host-Port-Mapping (wie bei `nspace-postgres`)

Wichtig: dieses Projekt teilt sich die Maschine mit anderen. Vor jeder Server-Aktion (Container starten, Ports belegen, nginx anfassen) prüfen, was schon läuft (`docker ps`, `docker network ls`), damit nichts kollidiert.

## Deployment / Infra

Ports (Vorschlag, beim Setup nochmal gegen `docker ps` prüfen ob noch frei):
- Frontend-Container: `127.0.0.1:8093`
- Backend-Container: `127.0.0.1:8094`

Geplanter nginx-Block für `almo-group.vn-nspace.de` (kommt in `/etc/nginx/sites-available/default`, nach dem letzten bestehenden Server-Block):

```nginx
server {
    listen 80;
    server_name almo-group.vn-nspace.de;

    location / {
        proxy_pass http://127.0.0.1:8093;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8094;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Nach `certbot --nginx -d almo-group.vn-nspace.de` baut certbot automatisch einen zweiten Block mit `listen 443 ssl; # managed by Certbot` dazu und macht aus dem `listen 80`-Block einen Redirect auf https - genau wie bei den anderen Subdomains in der Datei.

Automatisierbar (Teil vom Setup): Docker Compose Setup, Dockerfiles, CI-Pipeline, nginx-Block als fertiger Textvorschlag.

Manuell (braucht root/DNS-Zugriff):
- Subdomain `almo-group.vn-nspace.de` im DNS anlegen
- nginx-Block oben in `/etc/nginx/sites-available/default` eintragen, `nginx -t` und `systemctl reload nginx`
- `certbot --nginx -d almo-group.vn-nspace.de` für TLS
- Brevo API-Key als Secret bereitstellen
- GitHub Actions Deploy-SSH-Secret einrichten

## Datenmodell

- `users`: id, email, password_hash, name, role (CUSTOMER/ADMIN), created_at
- `categories` + `category_translations`: id, key, translations je Sprache
- `products`: id, category_id, price, compare_at_price, stock_quantity, metal_color, badge, status (aus stock_quantity abgeleitet: 0 = out_of_stock, <5 = low_stock, sonst in_stock), image_refs, created_at
- `product_translations`: product_id, lang, name, description, details
- `reviews`: id, product_id, user_id, rating (1-5), comment, status (PUBLISHED/HIDDEN), created_at
- `orders`: id, user_id, status (OPEN/CONTACTED/DONE), created_at
- `order_items`: order_id, product_id, quantity, price_at_order
- `wishlist_items`: user_id, product_id
- `cart_items`: session_id (oder user_id nach Login), product_id, quantity - Warenkorb hängt an der Session, beim Login wird der Gast-Warenkorb auf den User übertragen
- `newsletter_subscribers`: email, subscribed_at

Produkttexte kommen in eine eigene Tabelle statt in Übersetzungsdateien, damit der Admin sie im Dashboard pflegen kann.

## Bestellablauf (kein echtes Payment)

Checkout abschicken →
1. Backend legt `order` + `order_items` an, zieht `stock_quantity` ab
2. Mail über Brevo an die Admin-Adresse mit Bestelldetails
3. Kunde bekommt direkt ein PDF zum Download (Produkte, Preise, WhatsApp + E-Mail vom Admin), falls sich der Admin nicht meldet, kann der Kunde selbst nachfassen

Echtes Payment (Stripe o.ä.) ist ein späteres Feature, kommt hier noch nicht rein.

## Bewertungen

Nur Nutzer, die das Produkt schon bestellt haben, dürfen es bewerten. Admin kann Reviews im Dashboard bearbeiten oder verstecken. Durchschnittsrating wird aus den Reviews berechnet, nicht als eigenes Feld gespeichert.

## Admin-Bereich

Eigener geschützter Bereich (Rolle ADMIN) in der App:
- Produkte anlegen/bearbeiten (inkl. Lagermenge, Preis, Kategorie, Metall/Farbe, Bilder, Übersetzungen)
- Kategorien pflegen
- Bestellungen einsehen, Status ändern
- Reviews moderieren

## Frontend Seiten & Features

**Header (überall, sticky beim Scrollen):** Logo, Nav mit Kategorien, mobiles Drawer-Menü, Sprachumschalter DE/EN/FR, Suche, Account-Icon, Wishlist-Icon mit Counter, Warenkorb-Icon mit Counter + Mini-Warenkorb-Flyout (Kurzübersicht ohne Seitenwechsel).

**Footer:** Newsletter-Anmeldung, Shop-/Account-Links, Kontakt.

**Startseite:** Hero, Kategorie-Teaser, Bestseller/Neuheiten.

**Shop-Seite:** Produktliste mit Filtern - Kategorie, Preis (Range), Farbe/Metall, Verfügbarkeit, Neuheiten. Jede Produktkarte hat direkt ein Warenkorb-Icon zum Ein-Klick-Hinzufügen, ohne auf die Produktseite zu müssen.

**Produktseite:** Bildergalerie, Beschreibung, Details, Bewertungen (Liste + Formular für Käufer), "zuletzt angesehen". Zwei Buttons: "In den Warenkorb" und "Jetzt kaufen" (geht direkt zum Checkout). Der "In den Warenkorb"-Button bleibt als Sticky-Bar sichtbar, auch wenn man ganz runter zu den Bewertungen scrollt.

**Warenkorb:** Menge ändern, entfernen, Zwischensumme, weiter zur Kasse.

**Checkout:** Kontakt-/Adressdaten, Bestellübersicht, Bestellung abschicken (siehe Bestellablauf oben).

**Konto:** Profil, Bestellhistorie mit Status, PDF alter Bestellungen erneut runterladen.

**Login/Register:** Formulare gegen Backend-Session-Auth.

**Wishlist:** Liste, entfernen, in Warenkorb legen.

## CI/CD (GitHub Actions)

Reihenfolge:
1. Lint: ESLint (Frontend), Spotless/Checkstyle (Backend)
2. Backend-Tests: JUnit + Testcontainers (echte Postgres-Instanz)
3. Frontend-Tests: Vitest + React Testing Library
4. Docker Images bauen
5. E2E-Tests: Playwright gegen `docker compose up` im Runner
6. Security-Scan: OWASP Dependency-Check (Java), `npm audit`, Trivy fürs Image
7. Bei grünem main: Deploy per SSH auf den VPS, Images bauen/pullen, `docker compose up -d`

## Sprachen

DE/EN/FR, Basis sind die Übersetzungen aus `almofrontenddesign/js/i18n.js`, im Frontend mit react-i18next.
