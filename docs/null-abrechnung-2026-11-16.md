# Abrechnung auch ohne kassiertes Geld – veröffentlicht am 16.11.2026

Nach ausdrücklicher Betreiberfreigabe veröffentlicht. Ausgangspunkt war die weiterhin veröffentlichte Worker-Version 6f3041ae-5bf1-4164-aa5a-e1fc9f3988c5 (Live-Veröffentlichungsliste lesend geprüft). Diese Änderung ersetzt auf erneuten Betreiberwunsch die am 03.11. eingeführte Beschränkung auf positive Kasseneinnahmen.

Nach bestätigtem Tourende kann der Abrechnungsnachweis in Fahrer- und Büroansicht auch bei 0 € tatsächlich kassiertem Geld unterschrieben werden. Das gilt für Touren ohne Forderungen ebenso wie für Touren mit offenen Kundenbeträgen. Vor der Abrechnung müssen alle ausstehenden Abschlüsse und das Tourende übertragen sein. Der bestehende Abrechnungsbetrag, manuell eingegebene tatsächliche Name und Unterschrift werden wie bisher gespeichert. Offene Kundenforderungen werden durch eine Null-Abrechnung nicht als bezahlt markiert. Der vorhandene Marien-Abrechnungsnachweis und die getrennte Cusanus-Kassensumme behalten ihre Bedeutung.

Die zusätzliche Server-Sperre und positive-Einnahmen-Bedingung beim Einfügen entfallen. Berechtigung, bestätigtes Tourende, Verschlüsselung, Signaturprüfung, aktuelle Marien-Kassensumme, atomarer Datenbank-Abgleich, Unveränderlichkeit und Wiederholschutz bleiben erhalten. Bestehende Null-Abrechnungen und ihre identischen Wiederholungen bleiben unverändert. Wie bisher sperrt eine gespeicherte Abrechnung weitere Fahrerkorrekturen der Beträge. Keine Änderung der SQL-Schutzregeln oder produktive Migration; main/v3 unverändert.

Fiktive Prüfungen decken neue Null-Abrechnungen durch Büro und zugewiesenen Fahrer mit und ohne offene Forderung, PDF, Originalerhalt, exakte Wiederholung, bestehende Null-Nachweise und konkurrierende Marien-Betragskorrektur ab. Der Browserablauf prüft das Öffnen bei 0 € im Fahrerbereich sowie Speichern und Anzeige der Null-Abrechnung im Büro. Lokal alle 108 Backendprüfungen und fünf Browserabläufe erfolgreich (113 Prüfungen). Betreiberfreigabe, frische verschlüsselte Sicherung mit isoliertem Restore-Test sowie Live- und Archivabgleich erfolgreich abgeschlossen.

## GitHub-Prüfumgebung

Der erste GitHub-Lauf 43867919677 bestand Grund- und Emulatorprüfungen, brach danach beim Einrichten des Testbrowsers ab: ubuntu-latest lieferte Ubuntu 26.04, das Playwright 1.56 nicht unterstützt. Der Workflow ist deshalb auf Ubuntu 24.04 festgelegt. Anwendungscode und Abhängigkeiten werden dafür nicht geändert. Die vollständige GitHub-Prüfung wurde anschließend erfolgreich abgeschlossen.

## Ältere geöffnete App-Versionen

Das Zahlungsmodul behält seinen bisherigen Export cashSettlementNeeded für ältere, noch geöffnete App-Versionen. Die aktuelle Oberfläche verwendet diese alte Beschränkung nicht mehr. Das Modul bleibt bytegleich zum vorherigen Betriebsstand; die neue Null-Abrechnung benötigt nur die geänderte Oberfläche und den geänderten Server.

## Abrechnung auch ohne kassiertes Geld – 16.11.2026, aktueller Betriebsstand

Nach ausdrücklicher Betreiberfreigabe „ja“ veröffentlicht: Code `bb475c42f3bd633c1a3ad376ffe320114fa27335`; [GitHub-Gesamtprüfung 43869359600](https://github.com/Marienapotheke/marapo24-test/actions/runs/43869359600) erfolgreich mit 186 Prüfungen (36 Grundprüfungen, 17 Emulatorprüfungen, ein v3-Browserablauf, 108 Cloudflare-Backendprüfungen, 19 Sicherungs-/Restoreprüfungen und fünf Cloudflare-Browserabläufe). Worker-Version `6f1eac92-8509-42cf-ab97-1550d1fd72d6`. Der erste CI-Lauf scheiterte bei der Browserinstallation auf Ubuntu 26.04. Die Prüfumgebung ist nun auf unterstütztes Ubuntu 24.04 festgelegt; Anwendung und Abhängigkeiten wurden dafür nicht geändert.

Nach bestätigt übertragenem Tourende kann der Abrechnungsnachweis in Fahrer- und Büroansicht auch bei 0 € tatsächlich kassiertem Geld unterschrieben werden. Dies ersetzt die Einschränkung vom 03.11. Offene Kundenforderungen bleiben offen. Tatsächlicher manuell eingegebener Abrechnungsname, Unterschrift, aktuelle Marien-Kassensumme, Berechtigungen und exakter Wiederholschutz bleiben erforderlich. Der atomare Datenbank-Abgleich verhindert widersprüchliche parallele Marien-Betragskorrekturen. Bestehende Nachweise und Null-Abrechnungen bleiben unverändert. Wie bisher sperrt die gespeicherte Abrechnung weitere Fahrerkorrekturen der Beträge. Details: [Null-Abrechnung](null-abrechnung-2026-11-16.md).

Verschlüsselte Betriebssicherung auf S1 vor Veröffentlichung um 13:37 Uhr und danach um 13:49 Uhr (Europe/Berlin), beide isoliert erfolgreich wiederhergestellt und geprüft. Alle 1696 ursprünglichen Zustellnachweise, 85 Abrechnungen, 12 Korrekturen und 3 Fahrerzuordnungsnachweise bytegenau unverändert. 22 öffentliche Dateien entsprechen den Paketprüfsummen; 19 unangemeldete API-Zugriffe gesperrt. Gesamtes Datenbankschema, SQL-Archivschutz, Live-Einstellungen, Schlüsselbindungen, D1-EU, Offline-Datenbank und Aufbewahrungszeitplan unverändert. Keine produktive Migration oder Testdatensätze; main/v3 unverändert.

Nach Speichern laufender Eingaben ausstehende Vorgänge übertragen, alle MARAPO24-Fenster schließen und im WLAN neu öffnen. Browserdaten nicht löschen.
