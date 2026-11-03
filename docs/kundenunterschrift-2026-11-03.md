# Kundenunterschrift direkt ansehen – vorbereitet am 03.11.2026

Noch nicht veröffentlicht. Ausgangspunkt ist die freigegebene Worker-Version 009cb64e-2dde-4634-9d28-3d0c4f5ffac9.

In der Büroansicht steht bei unterschriebenen privaten Zustellungen neben „Zustellnachweis / PDF“ zusätzlich „Unterschrift ansehen“. Das Fenster zeigt ausschließlich die gespeicherte Originalunterschrift mit Empfängername, ursprünglicher Zustellzeit und gegebenenfalls Nachbarname. Ärzte, andere Empfängerarten ohne Unterschrift, Ablage-/Briefkastenzustellungen und Entfernungen erhalten keinen solchen Knopf. Fehlt in einem älteren Nachweis dennoch die Signatur, erscheint eine verständliche Meldung. Der vollständige Nachweis einschließlich Korrekturen bleibt als PDF verfügbar.

Die Ansicht verwendet den vorhandenen geschützten Büro-Endpunkt downloadProtectedProof mit correctionsVersion:1. Keine neue API oder Freigabe für Fahrer. Nach Konto-/Sitzungswechsel werden verspätete Antworten verworfen; beim Schließen oder Löschen sensibler Sitzungsdaten wird das Bild aus dem Dokument entfernt. Namen erscheinen als Text, nur PNG-Daten-URLs sind als Bild zugelassen. Keine Signatur wird geändert oder erneut gespeichert; Schema, Verschlüsselung, Offline-Warteschlangen und Archive bleiben unberührt.

Der bestehende Browserablauf prüft mit fiktiven Daten die gespeicherte Signatur bytegleich im Bild, beide Empfängernamen, Nachbarhinweis, Schließen/Wiederöffnen, Entfernen beim Sitzungswechsel und unveränderte Archivzeilen. Zustellungen ohne Unterschrift erhalten keinen Vorschauknopf. Alle fünf Browserabläufe einschließlich Fahrer-, Büro-, Korrektur-, Offline- und Android-Wiederaufnahmeabläufen lokal erfolgreich.

Live-Veröffentlichung erst nach ausdrücklicher Freigabe dieser Ergänzung und frischer verschlüsselter Betriebssicherung mit isoliertem Restore-Test. main/v3 bleiben unverändert.
