# Schreibstil für dieses Projekt

- Schreib alles (Docs, Specs, Commit-Messages, PR-Texte, Kommentare) so, als hätte ich es selbst geschrieben.
- Keine KI-Floskeln. Kein "Es ist wichtig zu beachten", kein "Zusammenfassend lässt sich sagen", kein "Ich hoffe das hilft", keine leeren Übergangssätze.
- Einfach schreiben. Kurze Sätze. So wie ich es erkläre: direkt, ohne unnötige Fachsprache, ohne alles künstlich kompliziert zu machen.
- Keine übertriebene Höflichkeit oder Werbesprache ("elegant", "nahtlos", "leistungsstark" usw.).
- Lieber eine klare Aussage als drei vorsichtige.
- Niemals "das mache ich (Claude)" oder ähnliche Hinweise, dass eine KI das geschrieben oder gemacht hat. In Docs, Specs, Commits, PRs, überall: so schreiben, als hätte der User, der gerade dran arbeitet, es selbst gemacht und geschrieben. Kein Claude, keine KI, nirgends erwähnt.

# Git

- Niemals automatisch committen oder pushen. Nur wenn ich es explizit sage.
- Dateien, die in die .gitignore gehören (Build-Output, .env, Secrets, IDE-Files usw.), trägst du selbstständig in die .gitignore ein, auch ohne dass ich danach frage. Das ist kein Commit/Push, das darfst du also einfach machen.

# Team-Arbeit / Koordination

- Wir arbeiten im Team, alle clonen sich das Repo. Jeder Schritt muss dokumentiert werden (Specs, Entscheidungen, Infra-Änderungen), damit sich alle darauf abstimmen können. Nichts nur im Chat lassen, was für andere relevant ist - das gehört ins Repo (docs/, Spec-Dateien, README, Kommentare in Configs).
- Bevor du irgendwas tust: prüf, ob du gerade lokal auf einem Rechner läufst oder auf dem VPS (Server). Verhalte dich entsprechend (z.B. keine Server-Deploy-Schritte lokal ausführen, keine lokalen Dev-Sachen auf dem Server anfassen die nicht hingehören).
- Prüf wenn möglich, wer gerade woran arbeitet (z.B. laufende Prozesse, offene Branches, letzte Commits), bevor du parallel Änderungen machst. Wenn du das nicht rausfinden kannst, frag mich erst, bevor du weitermachst.

# Arbeitsweise / Freigabe

- Immer erklären, was zu tun ist (Schritte, Befehle, Datei-Änderungen), und mich das selbst machen lassen. Nur wenn ich es explizit sage oder freigebe, tatsächlich ausführen (Code schreiben, Befehle laufen lassen, Container starten usw.).
- Ein gemeinsam erarbeiteter Plan oder eine geschriebene Spec ist keine Freigabe, das umzusetzen. Erst umsetzen, wenn ich explizit "mach das", "leg los" o.ä. sage.
- Bevor du eine Architektur-Entscheidung vorschlägst oder eine Tool-/Framework-Version wählst: erst die offizielle Doku dazu im Web lesen und bei Unklarheiten recherchieren (Support-Zeiträume, aktuelle empfohlene Version usw.). Nicht einfach das nehmen, was ein Scaffolding-Tool (Spring Initializr, `npm create vite` usw.) per Default liefert, und das als geprüfte Entscheidung ausgeben.
- Gilt auch für jedes neue Package/Tool, nicht nur die großen Grundsatzentscheidungen (z.B. ein neuer Spring-Boot-Starter, ein npm-Paket, ein Maven-Plugin): Version erst von der offiziellen Seite/Quelle ziehen bzw. recherchieren (aktuelle stabile Version, bekannte Kompatibilitätsprobleme mit dem Rest des Stacks), bevor irgendeine Version heruntergeladen/gepinnt wird - nicht einfach nehmen, was der Paketmanager standardmäßig auflöst.

# Entwickler-Dokumentation & Code-Kommentare

- Es muss eine gepflegte Entwickler-Doku geben (z.B. `docs/developer-guide.md`), die bei jeder relevanten Änderung (Setup, Architektur, Workflows) mit aktualisiert wird, damit jeder im Team damit produktiv wird.
- Aller Code (in jeder Sprache) wird professionell und ausführlich kommentiert, auf Englisch - unabhängig vom deutschen Schreibstil für Docs/Commits oben. Kommentare erklären das nicht offensichtliche WARUM, nicht nur was der Code tut.
- Keine KI-Floskeln oder generische Boilerplate-Kommentare. Kommentare so schreiben, wie ich (der arbeitende Entwickler) sie selbst schreiben würde: direkt, technisch, ohne Füllwörter.

# Merken / Diese Datei

- Wenn ich dir etwas zum Merken gebe oder etwas sage, das immer gelten soll (Arbeitsweise, Stil, Standing Rules), schreibst du das zusätzlich zum Memory-System auch hier in CLAUDE.md rein, damit es im Repo sichtbar und für alle im Team gültig ist.
