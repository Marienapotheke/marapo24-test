# Offene Päckchen während der Fahrt entfernen – veröffentlicht

Betreiberentscheidungen: Nur offene Päckchen während einer laufenden Tour entfernen, Pflichtgrund, auch offline. Im Büro als „Entfernt“ mit Grund, Fahrer und Zeitpunkt erhalten. Päckchenzahl und Betrag entfallen vollständig aus den Tourensummen; der ursprüngliche Betrag bleibt nachvollziehbar. Bereits abgeschlossene Zustellungen werden weiterhin über die bestehenden Korrekturen behandelt.

## Umsetzung

- Fahrer: „Päckchen entfernen“ öffnet eine Bestätigung mit Pflichtgrund (3–240 Zeichen). Die Entfernung wird auf dem Gerät gespeichert und automatisch übertragen. Vor bestätigter Übertragung bleibt eine entsprechend gekennzeichnete Zeile sichtbar. Nach Bestätigung verschwindet sie aus der Fahrer-Stoppübersicht. Büro und Nachweissuche behalten sie.
- Funkloch: Grund in der bestehenden identitätsgebundenen RSA/AES-Hülle verschlüsselt; keine Klartextbegründung in der Warteschlange. Unveränderte Datenbankkennung und Reihenfolge für Start, Zustellung, Entfernung und Ende. Zustellung und Entfernung desselben Stopps schließen sich in einer IndexedDB-Transaktion gegenseitig aus. Erst ausdrückliche Serverbestätigung entfernt einen Auftrag aus der Warteschlange. Wiederholung verwendet dieselbe Kennung und denselben verschlüsselten Inhalt.
- Server: eigene laufende Tour und offener Stopp erforderlich. Rennen zwischen Zustellung, Entfernung, Fahrerwechsel und Tourende werden zusätzlich durch den bestehenden atomaren Archivschutz abgefangen. Bereits abgeschlossene Nachweise werden nicht verändert. Eine bestätigte Entfernung lässt sich weder über Betragskorrektur noch über Wiederöffnen nachträglich umdeuten.
- Unveränderlicher Entfernungsnachweis im bestehenden Archiv, mit Kennzeichnung `kind=package-removal`, Grund, Fahrer-ID/-Name, Gerätezeit und serverseitigem Archivzeitpunkt. Technischer Stoppstatus bleibt `nicht zugestellt`, da das bestehende Schema diesen bereits unterstützt. Anzeige unterscheidet ausdrücklich „Entfernt“. Keine Datenmigration und keine neuen Tabellen.
- Archivbetrag bleibt als ursprünglicher Snapshot erhalten (auch zur bestehenden SQL-Betragsprüfung); in der aktuellen Tourprojektion beträgt der Sollbetrag 0 €. Tatsächlich kassiert ist 0 €. Die Kassenberechnung berücksichtigt ausschließlich zugestellte, nicht zurückgenommene Nachweise. Päckchensumme schließt entfernte Stopps aus. PDF heißt „Entfernungsnachweis“ und nennt ursprünglichen Betrag, 0 € Tourbetrag und keine Zustellbestätigung.
- Keine Übernahme in Kundenprofile. Bestehende Sicherungsverschlüsselung, Restore-Prüfung, Archivschutz und Aufbewahrung gelten auch für die neuen Einträge. Alte Offline-Abschlüsse bleiben kompatibel.

## Prüfung mit fiktiven Daten

Lokale Serverprüfungen: Pflichtgrund, falscher Fahrer, vor Tourstart, veränderte Erfassungszeit, abgeschlossene Stopps, konkurrierender Abschluss, unveränderliche Archivbytes und Wiederholung nach Tourende. Beispiel 22,70 € / drei Päckchen entfernt ergibt 0 € / null gezählte Päckchen. Bei zusätzlich zugestellten 10 € beträgt die Endsumme ausschließlich 10 €.

Android-Browser: echte Offline-Netzabschaltung, Pflichtgrund, verschlüsselte Warteschlange, Päckchensumme, anschließender Zustell- und Tourabschluss; Verbindungsrückkehr bei gestörter Zustandsabfrage und verloren gegangener Bestätigung. Automatische Wiederholung ohne Neuladen, unveränderte Kennungen, Büroanzeige und PDF-Erzeugung geprüft. Verschlüsselte Sicherung mit isoliertem Restore erhält Entfernungsgrund, ursprünglichen Betrag und Archivschutz.

Vor Veröffentlichung: vollständige GitHub-Prüfung des konkreten Commits abwarten, Betreiberfreigabe für dieses Paket, frische verschlüsselte Betriebssicherung mit erfolgreichem isoliertem Restore. Vorbereitungsphase ohne Deployment und ohne Änderungen produktiver Kundendaten; Veröffentlichung erst nach Erfüllung dieser Voraussetzungen. main/v3 bleiben unverändert. Nach Veröffentlichung ausstehende Vorgänge übertragen, alle App-Fenster schließen und im WLAN neu öffnen; Browserdaten nicht löschen.

## Abgeschlossene Veröffentlichung

Betreiberfreigabe erteilt. Code `dfccbd4a4e2d59a7afb73480a803633c791855c7`, GitHub-Prüfung `39246248687` mit 156 erfolgreichen Tests. Worker `355e21db-fa1a-4a45-b5bf-beeb7f2961f3`. Vorher-/Nachher-Sicherungen um 13:42 Uhr und 13:43 Uhr erfolgreich wiederhergestellt. Alle 158 bestehenden Zustellnachweise und 9 Abrechnungen exakt unverändert. Keine Migration. Verbindlicher Stand: `docs/echtdatenfreigabe.md`.
