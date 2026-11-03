# Kundenunterschrift direkt ansehen – veröffentlicht am 03.11.2026

Nach ausdrücklicher Betreiberfreigabe veröffentlicht. Ausgangspunkt war die freigegebene Worker-Version 009cb64e-2dde-4634-9d28-3d0c4f5ffac9.

In der Büroansicht steht bei unterschriebenen privaten Zustellungen neben „Zustellnachweis / PDF“ zusätzlich „Unterschrift ansehen“. Das Fenster zeigt ausschließlich die gespeicherte Originalunterschrift mit Empfängername, ursprünglicher Zustellzeit und gegebenenfalls Nachbarname. Ärzte, andere Empfängerarten ohne Unterschrift, Ablage-/Briefkastenzustellungen und Entfernungen erhalten keinen solchen Knopf. Fehlt in einem älteren Nachweis dennoch die Signatur, erscheint eine verständliche Meldung. Der vollständige Nachweis einschließlich Korrekturen bleibt als PDF verfügbar.

Die Ansicht verwendet den vorhandenen geschützten Büro-Endpunkt downloadProtectedProof mit correctionsVersion:1. Keine neue API oder Freigabe für Fahrer. Nach Konto-/Sitzungswechsel werden verspätete Antworten verworfen; beim Schließen oder Löschen sensibler Sitzungsdaten wird das Bild aus dem Dokument entfernt. Namen erscheinen als Text, nur PNG-Daten-URLs sind als Bild zugelassen. Keine Signatur wird geändert oder erneut gespeichert; Schema, Verschlüsselung, Offline-Warteschlangen und Archive bleiben unberührt.

Der bestehende Browserablauf prüft mit fiktiven Daten die gespeicherte Signatur bytegleich im Bild, beide Empfängernamen, Nachbarhinweis, Schließen/Wiederöffnen, Entfernen beim Sitzungswechsel und unveränderte Archivzeilen. Zustellungen ohne Unterschrift erhalten keinen Vorschauknopf. Alle fünf Browserabläufe einschließlich Fahrer-, Büro-, Korrektur-, Offline- und Android-Wiederaufnahmeabläufen lokal erfolgreich.

Veröffentlichung nach erfolgreicher Gesamtprüfung, ausdrücklicher Freigabe und frischer verschlüsselter Betriebssicherung mit isoliertem Restore-Test erfolgt. main/v3 unverändert.

## Kundenunterschrift direkt ansehen – 03.11.2026, aktueller Betriebsstand

Nach ausdrücklicher Betreiberfreigabe „ja“ veröffentlicht: Code `0e14865bfb231055cc635b9e9015fe96cb6c361d`; [GitHub-Prüfung 41655694895](https://github.com/Marienapotheke/marapo24-test/actions/runs/41655694895) erfolgreich mit 186 Prüfungen (36 Grundprüfungen, 17 Emulatorprüfungen, ein v3-Browserablauf, 108 Cloudflare-Backendprüfungen, 19 Sicherungs-/Restoreprüfungen und fünf Cloudflare-Browserabläufe). Worker-Version `f1708c87-551e-4f9c-b83b-30c62dc8f7f1`.

Bei unterschriebenen privaten Zustellungen zeigt die Büroansicht neben dem PDF zusätzlich „Unterschrift ansehen“. Die geschützte Vorschau enthält die gespeicherte Originalunterschrift mit Empfängernamen, Zustellzeit und gegebenenfalls Nachbarname. Schließen und Sitzungswechsel entfernen das Bild. Der vollständige PDF-Nachweis bleibt verfügbar. Nur die App-Datei wurde gegenüber dem vorherigen Paket geändert; Server und PDF-Modul sind bytegleich. Details: [Kundenunterschrift](kundenunterschrift-2026-11-03.md).

Verschlüsselte Betriebssicherungen auf S1 vor Veröffentlichung um 15:46 Uhr und danach um 15:47 Uhr (Europe/Berlin), beide isoliert erfolgreich wiederhergestellt und geprüft. Alle 991 ursprünglichen Zustellnachweise, 52 Abrechnungen, 9 Korrekturen und 2 Fahrerzuordnungsnachweise bytegenau unverändert. Alle 22 öffentlichen Dateien entsprechen den Paketprüfsummen; 19 unangemeldete API-Zugriffe gesperrt. Datenbankschema, Live-Einstellungen, Schlüsselbindungen, D1-EU und Aufbewahrungszeitplan unverändert. Keine produktive Migration oder Testdatensätze; main/v3 unverändert.

Nach Speichern laufender Eingaben ausstehende Vorgänge übertragen, alle MARAPO24-Fenster schließen und im WLAN neu öffnen. Browserdaten nicht löschen.
