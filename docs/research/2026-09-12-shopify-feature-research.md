# Shopify-Recherche: Design & Funktionen (Storefront + Business-Seite)

Live-Recherche vom 2026-09-12, direkt im Browser: echter Shopify-Shop [brooklinen.com](https://brooklinen.com)
(Kollektionsseite → Produktseite → Warenkorb → Checkout durchgeklickt), die öffentlichen
Shopify.com-Merchant-Seiten (Startseite, Sidekick, Pricing) - und, nach Login durch dich, der echte
Shopify-Admin-Testaccount (Produkt-erstellen-Formular, Rabatte, Rollen/Rechte, Checkout-Einstellungen,
Kundenkonten-Einstellungen, Sprachen, Benachrichtigungen). Abschnitt F unten ist der Teil, der erst
mit deinem Login möglich wurde. Grundlage für die Sprint-Vorschläge unten.

Ziel dieses Dokuments: sammeln, nicht schon entscheiden. Was wir davon übernehmen, entscheiden wir
zusammen - das steht am Ende als Vorschlagsliste, noch nicht im Backlog.

## A. Storefront-Design (Kunden-Seite)

- **Kopfzeile**: Logo links, Hauptnavigation, Suche, dann rechts drei Icons: Konto (Person-Icon,
  kein Name als Text), Warenkorb (Icon mit Mengen-Badge), bei manchen Shops zusätzlich Wunschliste.
  Kein sichtbarer "Login"-Textlink wie bei uns aktuell - das Konto-Icon öffnet bei einem
  eingeloggten Kunden ein Dropdown/eine Kontoseite, bei einem Gast den Login/Register-Flow.
- **Produktlisten (Kollektionsseite)**: Badges auf den Produktkarten ("SOFTEST", "COOLING", "BUNDLE
  SAVINGS", "NEW"), durchgestrichener alter Preis + neuer Preis + Rabatt-%, Bewertungsanzahl in
  Klammern direkt auf der Karte, Filter-Sidebar, redaktionelle Blöcke zwischen den Produktkacheln
  (Social-Proof-Zitate, Editorial-Content) statt einer reinen Produktwand.
- **Produktdetailseite (PDP)**:
  - Farb-/Variantenauswahl als Swatches mit "NEW"-Badge auf einzelnen Varianten
  - Größentabelle als eigenes Popup/Modal mit Umschalter Zoll/cm
  - Live-Chat-CTA direkt neben der Größentabelle ("Fragen? Chat mit einem Experten.")
  - Zertifizierungs-Badges (z. B. OEKO-TEX) mit Erklärtext direkt auf der Seite
  - Vergleichstabelle mehrerer Produktvarianten nebeneinander (Material, Eigenschaften, "fühlt sich
    an wie...", "sieht aus wie...")
  - Strukturierter Beschreibungstext in Blöcken ("Warum du es lieben wirst", "Wie es sich anfühlt",
    "Wie es aussieht", "Am besten für", "Details", "Pflege", "Rückgabe") statt einem Fließtext
  - Cross-Sell/Upgrade-Hinweis direkt unter dem Preis ("Upgrade & Save: bekomme X dazu mit Bundle Y")
  - Live-Social-Proof ("31 Personen haben das gerade im Warenkorb")
  - "Zur Wunschliste"-Button direkt neben "In den Warenkorb"
- **Warenkorb**: Fortschrittsbalken zu einem Gratis-Geschenk ("Noch 22,35 € bis zum Gratis-Beutel"),
  Dringlichkeits-Hinweis ("Diese Artikel gehen schnell"), Ersparnis-Anzeige, optionale Geschenknotiz,
  Hinweis auf Treueprogramm direkt im Warenkorb, Promo-Code-Hinweis ("Rabattcode auf der nächsten
  Seite eingeben").
- **Checkout** (das eigentliche Shopify-Aushängeschild, siehe unten bei Funktionen):
  ein einzelner, sehr kurzer Screen statt Multi-Step-Wizard, Express-Zahlungs-Buttons ganz oben.

## B. Storefront-Funktionalität

- **Express-Checkout-Buttons** oben im Checkout (Shop Pay, Apple Pay/Google Pay, PayPal) - ein
  Klick, kein Formular. Laut Shopifys eigener Werbung: Checkout mit Shop Pay konvertiert bis zu
  50 % besser als Gast-Checkout.
- **"Weiter einkaufen"/Sign-in-Option genau am Checkout-Anfang**, aber Checkout auch komplett als
  Gast möglich - kein Zwang zum Konto.
- **Adressformular mit Land-Erkennung/-Auswahl**, dynamisch erscheinende Versandmethoden erst nach
  Adresseingabe, "Telefonnummer optional" mit separatem SMS-Opt-in.
- **Payment-Methoden-Mix**: Kreditkarte inline, Shop Pay (inkl. Ratenzahlung/BNPL), PayPal,
  Afterpay (Buy-now-pay-later) - mehrere BNPL-Anbieter parallel, nicht nur einer.
- **"Shop"-Konto-Erstellung nebenbei**: Wer im Checkout seine Handynummer angibt, bekommt implizit
  ein Shop-App-Konto für künftige schnellere Käufe (Rechtstext dazu direkt im Formular).
- **Post-Purchase-Upsell direkt im Checkout**: "Das könnte dir auch gefallen" mit einem einzelnen
  Zusatzprodukt inkl. eigener Variantenauswahl, ohne den Checkout zu verlassen.
- **Rabattcode-Feld direkt in der Bestellübersicht**, nicht versteckt.
- **Treue-/Rewards-Programm** ("Punkte sammeln"), das schon im Warenkorb beworben wird.
- **Live-Chat/Support-Widget** durchgängig verfügbar, nicht nur auf einer Kontaktseite.
- **Mehrsprachigkeit + Multi-Currency**: Länderauswahl direkt im Checkout, mit lokalisierten
  Zahlungsmethoden je Land.

## C. Business-/Merchant-Seite (Admin, "sein Business starten")

Direkt von shopify.com (Marketing-/Pricing-Seiten, öffentlich einsehbar):

- **Gestaffelte Pläne** (Basic/Grow/Advanced/Plus) mit klar aufgeschlüsselten Unterschieden:
  Transaktionsgebühren sinken mit höherem Plan, mehr Mitarbeiterkonten/Rollen, mehr
  Analyse-Reports, Live-Chat-Support erst ab höherem Plan.
  - Zusätzlich ein **"Agentic"-Gratisplan**: 0 €/Monat, nur Gebühren bei tatsächlichem Verkauf über
    KI-Kanäle - senkt die Einstiegshürde für "erstmal nur über KI-Chats/Kanäle verkaufen".
- **Mitarbeiterkonten mit Rollen/Berechtigungen** (bis "unbegrenzt" im Plus-Plan) - im Gegensatz zu
  unserem aktuellen Modell (ein Admin-Konto insgesamt).
- **POS Pro als Zusatzmodul** fürs stationäre Geschäft (Inventar pro Standort, Abholung im Geschäft).
- **B2B-Kataloge**: eigene Preislisten/Kataloge für Geschäftskunden getrennt von Endkunden-Preisen.
- **Über 200 Echtzeit-Reports + eigene Analysen** - deutlich mehr als eine simple Bestellliste.
- **App-Ökosystem** (21.000+ Apps) für alles, was die Kernplattform nicht selbst kann.
- **Onboarding-Flow** ("Erstes Produkt hinzufügen" → "Shop anpassen" → "Zahlungen einrichten") als
  klar geführte 3-Schritte-Checkliste direkt nach der Registrierung.

## D. KI-/brandneue Funktionen (das, was der Nutzer explizit sehen wollte)

- **Sidekick** - ein in den Admin-Bereich integrierter KI-Chat-Assistent fürs gesamte
  Tagesgeschäft, nicht nur ein Chatbot für Kundenfragen. Beispiel-Prompts, die Shopify selbst
  bewirbt:
  - SEO-Produktbeschreibungen schreiben lassen
  - Preisstrategie analysieren und Umsatzsteigerung vorschlagen lassen
  - Social-Media-Content für Produkte generieren
  - Wöchentliche Leistungsübersicht automatisch erstellen lassen
  - Rabattcodes/Angebote einrichten lassen
  - E-Mail-Marketing-Kampagne erstellen lassen
  - Warnung bei niedrigem Lagerbestand + Nachbestell-Hilfe
  - Produkte automatisch in "intelligente Kollektionen" einsortieren
  - Marketing-Budget je Kanal optimieren lassen
  - Versandkonfiguration automatisch prüfen ("Versand-Audit")
- **Foto-Bearbeitung per KI**: aus Handyfotos werden "professionelle" Produktfotos.
- **Shop-Design per KI-Prompt** statt manuellem Theme-Editor ("aus deiner Idee wird ein Shop-Design").
- **"Agentic Storefronts" / KI-Kanäle**: Kunden kaufen direkt im Chat eines KI-Assistenten
  (außerhalb der eigenen Website), Shopify liefert dafür ein offenes "Universal Commerce Protocol"
  für Entwickler - Checkout passiert dann im Chat-Interface, nicht auf der eigenen Seite.
- **Shop-App-Netzwerk**: automatische Listung im Shop-App-Marktplatz mit Zugriff auf 250+ Mio.
  vorab verifizierte Käufer:innen.

## F. Echter Merchant-Admin (nach Login, live durchgeklickt)

### Produkt anlegen

- **Automatische Kategorie-Erkennung**: Titel "Goldener Ring mit Zirkonia" eingegeben → Shopify hat
  von selbst die Kategorie "Ringe in Schmuck" vorgeschlagen (keine manuelle Auswahl nötig).
- **Kategorie-spezifische Metafelder, automatisch passend zur erkannten Kategorie**: bei "Ringe"
  wurden uns direkt vorgeschlagen: Farbe, Altersgruppe, Schmucktyp, **Ringgröße**, Zielgeschlecht,
  **Steinform**, **Schmuckmaterial**, Ringdesign, **Edelsteinart**, **Art des Edelsteinschliffs**.
  Das ist 1:1 relevant für uns - unser Produktmodell hat aktuell nur `metalColor` und `badge` als
  freie Zusatzfelder, keine strukturierten Schmuck-Attribute wie Ringgröße/Steinform/Edelsteinart.
- **Generisches Varianten-System** ("Optionen wie Größe oder Farbe hinzufügen") statt eines fest
  einprogrammierten Feldes wie unser `metalColor` - beliebig viele Optionen mit beliebigen Werten,
  woraus automatisch alle Kombinationen (SKUs) entstehen.
- **Erweiterte Felder, aber standardmäßig eingeklappt** ("Mehr Details"): SKU, Barcode (ISBN/UPC/
  GTIN), "Verkauf fortsetzen, auch wenn Artikel nicht vorrätig ist" (Backorder), Kosten pro Artikel
  (für Margen-Berechnung, getrennt vom Verkaufspreis) - reduziert die primäre Formularlänge.
- **Versand-Block**: Paketmaße/-gewicht, Herkunftsland + HS-Code (Zoll-Tarifnummer) für
  internationalen Versand.
- **Produktorganisation**: Typ (freier Produkttyp), Anbieter/Marke, **mehrere Kollektionen pro
  Produkt** (Many-to-Many, nicht eine feste Kategorie-FK wie bei uns), freie Tags, Sales-Channel-Wahl
  pro Produkt (in welchen Kanälen das Produkt überhaupt erscheint), Theme-Vorlage pro Produkt.
- **SEO-Vorschau direkt im Formular**: zeigt live, wie der Google-Eintrag aussehen würde, inkl.
  editierbarem Seitentitel/Meta-Description separat vom Anzeigenamen.
- Ein "KI schreibt die Beschreibung"-Button war in diesem Testaccount **nicht** sichtbar (evtl.
  regions-/planabhängig oder nur über den Sidekick-Chat statt eines Inline-Buttons) - nicht
  bestätigt, nur die Kategorie-/Metafeld-Automatik war eindeutig KI-gestützt sichtbar.

### Rabatte

- Zwei Grundtypen: **Rabattcode** (Kunde gibt Code ein) vs. **Automatischer Rabatt** (gilt ohne Code).
- Wertarten: **Prozentsatz** oder **fester Betrag**.
- Geltungsbereich einschränkbar auf bestimmte Kollektionen, bestimmte Kundengruppen.
- Regeln: Mindestbestellwert, Nutzungslimits (gesamt und pro Kunde), Kombinierbarkeit mit anderen
  Rabatten (explizit an/aus), Start-/Enddatum mit Uhrzeit.

### Checkout-Einstellungen (sehr granular)

- Kontaktfeld-Konfiguration: vollständiger Name Pflicht/optional, Firmenname ein/aus, **USt-IdNr.
  mit automatischem EU-Reverse-Charge** bei grenzüberschreitenden B2B-Bestellungen, Adresszeile 2,
  Telefonnummer der Lieferadresse - jedes Feld einzeln ein-/ausschaltbar.
- **Drei getrennte Marketing-Opt-in-Kanäle**: E-Mail, SMS, WhatsApp - jeweils eigene Checkbox, mit
  automatisch region-abhängiger Vorauswahl (z. B. in den USA vorangehakt, in der EU nicht - wegen
  unterschiedlicher Opt-in-Gesetze).
- **Trinkgeld-Option im Checkout** (3 Voreinstellungen + freier Betrag).
- Eigene Checkout-Sprache getrennt einstellbar, eigener Content-Editor für Checkout-Texte.
- **Inventar-Schutz**: Limit fürs "In den Warenkorb legen", damit die exakte Lagermenge nicht über
  Trial-and-Error von außen erkennbar ist.
- Checkout-Regeln (Altersverifikation, Mengenlimits) - über Apps zubuchbar, nicht Kernfunktion.

### Kundenkonten

- **Self-Service-Rückgaben/-Stornierungen**: Kund:innen können direkt im eigenen Konto eine
  Rückgabe/Stornierung anfragen, mit vom Händler konfigurierten Bedingungen/Gebühren - kein
  manueller Kontakt nötig.
- **Shop-Guthaben** ("Store Credit"): Kund:innen sehen ein Guthabenkonto und können es beim nächsten
  Kauf einlösen (z. B. für Rückerstattungen statt Geld-zurück).
- Login-Links im Storefront-Header und Checkout ein-/ausschaltbar, getrennt konfigurierbare
  Authentifizierungsmethoden.

### Mitarbeiterrollen (direkt relevant für unseren Sprint-Vorschlag)

Vordefinierte Rollen-Vorlagen statt komplett freier Rechtevergabe: **Kundensupport**, **Marketer**,
**Vertriebsexperte**, **Onlineshop-Editor**, **Administrator**, **App-Entwickler**, plus mehrere
POS-spezifische Rollen. Jede Rolle hat eine feste Kategorie (Shop/Organisation/Point of Sale).

### Sprachen

Eigene Sprachverwaltung mit Status (veröffentlicht/Entwurf) pro Sprache und Domain-Zuordnung -
**"Shopify Translate & Adapt"** wird direkt beim Sprache-Hinzufügen als KI-App zum automatischen
Übersetzen des ganzen Shops beworben. Bei uns läuft Übersetzen aktuell komplett manuell über die
JSON-Dateien (ich übersetze, du bestätigst) - eine Admin-UI zum Bearbeiten von Übersetzungen ohne
Code-Zugriff wäre ein größerer, eigener Schritt.

### Benachrichtigungen

Getrennte Bereiche für Kunden-Benachrichtigungen (Bestell-/Kontoereignisse, editierbare
E-Mail-Vorlagen), **Mitarbeiter-Benachrichtigungen bei neuen Bestellungen** (wir haben nur eine feste
E-Mail an eine Adresse, keine Im-Admin-Benachrichtigung), Fulfillment-Provider-Webhooks, generische
Webhooks für eigene Integrationen.

### Vollständige Einstellungs-Übersicht (zum Vergleich, was es bei Shopify alles gibt)

Allgemein, Plan, Abrechnung, Organisation/Konto (inkl. Rollen, Sicherheit), Zahlungen, Checkout,
Kundenkonten, Versand, Steuern, Standorte (Multi-Location-Inventar), Märkte (International), Apps,
Verkaufskanäle, Domains, Kundenereignisse (Tracking-Pixel), Benachrichtigungen, Benutzerdefinierte
Daten (Metafelder/Metaobjekte), Sprachen, Datenschutz, Rechtliches.

## G. Was das für unseren aktuellen Stand bedeutet (Almo Shop)

Direkt anwendbar, klein-und-konkret (kurzfristig sinnvoll, kein großes KI-Projekt):
- Profil-Icon mit Initialen + Dropdown statt Klartext-Name/Login-Link (Kunden-Header **und**
  Admin-Header) - siehe deine Nachricht, das ist schon als eigene Aufgabe notiert.
- Sprachumschalter auch im Admin-Bereich (aktuell nur im Kunden-Header) - ebenfalls schon notiert.
- Badges auf Produktkarten (z. B. "Neu", "Bestseller" - haben wir teilweise schon über `badge`-Feld,
  aber kein "X % Rabatt"-Badge und keine Bewertungsanzahl direkt auf der Kachel).
- Fortschrittsbalken zu kostenlosem Versand im Warenkorb (wir haben schon die 30-€-Schwelle als
  Text, aber keinen visuellen Fortschrittsbalken).
- Gastwarenkorb → Checkout ohne Zwangs-Login wäre ein größerer Kurswechsel (aktuell zwingt unser
  Checkout zum Login, siehe Sprint-1-Entscheidung) - separat zu diskutieren, ob das noch gewollt ist.
- **Strukturierte Schmuck-Attribute** (Ringgröße, Steinform, Edelsteinart, Schmuckmaterial) statt nur
  `metalColor`/`badge` - direkt aus Abschnitt F, sehr konkret für einen Schmuck-Shop.
- **SKU/Barcode/Kosten-pro-Artikel** im Admin-Produktformular (für Margen-Überblick) - fehlt uns
  komplett, wäre eine kleine Ergänzung zum bestehenden Formular.

Größere, eigene Sprints wert (siehe Vorschläge unten):
- Produktbewertungen **schreiben** (aktuell nur lesen, siehe offener Punkt seit Sprint 3/4)
- Rabattcode-System
- Mitarbeiterkonten/Rollen im Admin (aktuell: ein Admin-Account-Typ ohne Abstufung)
- Self-Service-Rückgaben/-Stornierungen im Kundenkonto (aktuell: nur Kontaktaufnahme, kein
  strukturierter Rückgabe-Flow)
- Produkte in mehreren Kollektionen statt einer festen Kategorie (Datenmodell-Änderung)
- KI-gestützte Funktionen im Admin (Produktbeschreibungen generieren, o.ä.) - eigenes Thema, braucht
  eigene Kosten-/API-Entscheidung (welcher KI-Anbieter, welche Kosten pro Aufruf)

## Vorschlag: mögliche neue Sprints - übernommen in backlog.md (2026-09-12)

Ursprünglich 7 Vorschläge; "Bewertungen schreiben" stellte sich als bereits umgesetzt heraus (siehe
`docs/backlog.md`, Eintrag "UI/UX-Feinschliff + Bewertungen, 2026-09-12") und wurde rausgenommen -
die restlichen sechs sind jetzt als Sprint 7-12 in `docs/backlog.md` festgehalten, in dieser
Reihenfolge:

1. **Sprint 7 - Header-Redesign**: Profil-Icon+Dropdown (Kunden + Admin), Admin-Sprachumschalter,
   ggf. Produktkarten-Badges (Rabatt-%, Bewertungsanzahl), Warenkorb-Fortschrittsbalken.
2. **Sprint 8 - Rabattcodes**: Datenmodell für Rabatte (Code/automatisch, %/fest, Mindestbestellwert,
   Gültigkeit), Admin-UI, Einlösung in Warenkorb/Checkout.
3. **Sprint 9 - Erweitertes Produktmodell**: strukturierte Schmuck-Attribute (Ringgröße, Steinform,
   Edelsteinart, Schmuckmaterial), SKU/Barcode/Kosten-pro-Artikel, ggf. Produkte in mehreren
   Kollektionen statt einer festen Kategorie.
4. **Sprint 10 - Mitarbeiterrollen im Admin**: mehrere Admin-Konten mit unterschiedlichen Rechten
   statt einem einzigen Admin-Level, ggf. mit vordefinierten Rollen-Vorlagen (Support/Marketing/
   Vertrieb/Editor/Admin) statt freier Rechtevergabe von Grund auf.
5. **Sprint 11 - Self-Service-Rückgaben & Shop-Guthaben**: Kund:innen können Rückgabe/Stornierung
   selbst anfragen, Admin entscheidet/erstattet - optional als Guthaben statt Geld-zurück.
6. **Sprint 12 - KI-Funktionen im Admin** (offenes Thema, braucht eigene Recherche zu Kosten/Anbieter
   vor dem Start): z. B. Produktbeschreibungen/SEO-Texte per KI vorschlagen lassen.

Details/Technische Entscheidungen zu jedem Sprint folgen jeweils erst, wenn der Sprint startet
(gleiches Muster wie Sprint 0-6) - siehe die entsprechenden Abschnitte in `docs/backlog.md`.
