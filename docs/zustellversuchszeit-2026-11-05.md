# Zeitpunkt erfolgloser Zustellversuche – veröffentlicht am 05.11.2026

Nach ausdrücklicher Betreiberfreigabe veröffentlicht. Ausgangspunkt war die freigegebene Worker-Version 848d1bcf-716f-4a0c-8102-62dfc46d54f9.

Bei „nicht zugestellt“ erscheint direkt in Fahrer- und Büroansicht „Zustellversuch um HH:MM Uhr“ mit Datum. Vorrang hat der ursprüngliche Erfassungszeitpunkt am Fahrergerät, auch wenn der Abschluss später aus einer Offline-Warteschlange übertragen wurde. Noch ausstehende Übertragungen sind ausdrücklich als lokal gekennzeichnet. Bei alten Nachweisen ohne Gerätezeit erscheint der bekannte Serverzeitpunkt mit „Zustellversuch gespeichert um“. Offene, entfernte und aufgehobene Zustellungen erhalten keine irreführende Versuchszeit. Erfolgreiche Zustellungen behalten ihre bisherige Beschriftung.

Es werden nur vorhandene Zeitangaben angezeigt. Originalnachweise, Signaturen, Kundenprofile, Offline-Warteschlangen und Datenbankschema bleiben unverändert. Kein neuer Serverendpunkt und keine produktive Migration. Zeitformat Europe/Berlin.

Prüfungen mit fiktiven Daten: ursprüngliche Gerätezeit, Offline-Zeit, Server-Ersatzzeit, Ausschluss offener/entfernter/aufgehobener Datensätze sowie direkte Fahrer- und Büroanzeige nach fehlgeschlagener Zustellung. Zwei Zeit-/Backendprüfungen und alle fünf Browserabläufe lokal erfolgreich. Live-Veröffentlichung nach Betreiberfreigabe und frischer verschlüsselter Sicherung mit isoliertem Restore-Test erfolgreich abgeschlossen. main/v3 unverändert.

## Zeitpunkt erfolgloser Zustellversuche – 05.11.2026, aktueller Betriebsstand

Nach ausdrücklicher Betreiberfreigabe „ja freigabe“ veröffentlicht: Code `578e78255bfd003edf2f9f7b67c60075d58dd706`; [GitHub-Prüfung 42034468512](https://github.com/Marienapotheke/marapo24-test/actions/runs/42034468512) erfolgreich mit 186 Prüfungen (36 Grundprüfungen, 17 Emulatorprüfungen, ein v3-Browserablauf, 108 Cloudflare-Backendprüfungen, 19 Sicherungs-/Restoreprüfungen und fünf Cloudflare-Browserabläufe). Worker-Version `6f3041ae-5bf1-4164-aa5a-e1fc9f3988c5`.

Bei „nicht zugestellt“ erscheint in Fahrer- und Büroansicht direkt „Zustellversuch um HH:MM Uhr“ mit Datum. Vorrang hat die ursprüngliche Gerätezeit; noch ausstehende Offline-Übertragungen sind als lokal gekennzeichnet. Historische Server-Ersatzzeiten heißen „Zustellversuch gespeichert um“. Keine Versuchszeit bei offenen, entfernten oder aufgehobenen Datensätzen. Bestehende Originalnachweise werden nur gelesen. Details: [Zustellversuchszeit](zustellversuchszeit-2026-11-05.md).

Zusätzlich wurden auf ausdrücklichen Betreiberauftrag zwei allgemeine Bürozugänge für beide Apotheken als aktiv geprüft und acht bisherige persönliche Bürozugänge über die vorhandene Administration deaktiviert. Historische Identitäten, Rollen und Nachweise bleiben erhalten. Die vorläufigen Zugangsdaten wurden persönlich im App-Dialog übergeben; Änderung beim ersten Zugriff bleibt vorgeschrieben. Kontonamen und Kennwörter werden nicht im öffentlichen Repository dokumentiert. Kontenänderungen gesondert durch verschlüsselte Vor-/Nachsicherung, isolierten Restore und bytegenauen Vergleich der vorhandenen Archive geprüft.

Frische verschlüsselte Betriebssicherung auf S1 vor Veröffentlichung um 14:22 Uhr und danach um 14:24 Uhr (Europe/Berlin), beide isoliert erfolgreich wiederhergestellt. Alle 1169 ursprünglichen Zustellnachweise, 60 Abrechnungen, 9 Korrekturen und 2 Fahrerzuordnungsnachweise bytegenau unverändert. 22 öffentliche Dateien entsprechen den Paketprüfsummen; 19 unangemeldete API-Zugriffe gesperrt. Server und PDF-Modul bytegleich zum vorherigen Paket. Gesamtes Datenbankschema, Live-Einstellungen, Schlüsselbindungen, D1-EU und Aufbewahrungszeitplan unverändert. Keine produktive Migration oder Testdatensätze; main/v3 unverändert.

Nach Speichern laufender Eingaben ausstehende Vorgänge übertragen, alle MARAPO24-Fenster schließen und im WLAN neu öffnen. Browserdaten nicht löschen.
