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
