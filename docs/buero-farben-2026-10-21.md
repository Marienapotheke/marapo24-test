# Büroansicht und Unterschriften – veröffentlicht am 21.10.2026

Vorbereitung und Tests ausschließlich mit fiktiven Daten. Nach ausdrücklicher Betreiberfreigabe am 21.10.2026 veröffentlicht; keine Datenmigration. Sicherung und Verifikation siehe Veröffentlichungsnachweis unten.

## Vereinbarte Darstellung

- Marienapotheke blau, Cusanus-Apotheke violett: Kundenkarten, Geldbeträge und getrennte Kassensummen. Tatsächlich kassierte Beträge bekommen eine zusätzliche dunkle Akzentfarbe innerhalb der jeweiligen Apothekenfarbe. PDF-Ausgaben übernehmen die Unterscheidung bei Apotheke, kassierten Beträgen und offenen Zahlungen.
- Nicht zugestellt: orange Statusschrift, hellere Kundenkarte; kein orangefarbener Rahmen. Text bleibt zusätzlich zur Farbe sichtbar.
- Büro-Touren lassen sich über ihre Überschrift einklappen. Bezeichnung, Datum und Tourstatus bleiben sichtbar. Der Zustand bleibt bei Aktualisierungen derselben Sitzung erhalten. Die Namenssuche öffnet passende Touren vorübergehend; die vorherige Klappwahl bleibt erhalten. Nach Abmeldung wird die Klappwahl verworfen.
- Nach Tourende werden nur aktuelle Kunden mit einem Geldbetrag nach Marien/Cusanus und darin alphabetisch dargestellt. Nullbeträge und historische/entfernte Einträge bleiben darunter als „Weitere Päckchen und Verlauf“ erreichbar. Fahrerreihenfolge und gespeicherte Daten bleiben unverändert.
- „Überweist“ ist ein zusätzlicher Grund bei nicht vollständig kassierter Zustellung, auch bei einer zulässigen Betragskorrektur. Kein automatischer Zahlungseingang und keine Ausbuchung. Teilzahlungen bleiben getrennt vom offenen Rest. Grund und offener Rest erscheinen fett/rot. Nach Tourende kennzeichnet die Büroansicht aktuelle Einträge mit noch offenem Betrag zusätzlich rot. Entfernte/zurückgenommene Originale zählen nicht als offene Forderung der Tour.
- Zustell- und Abrechnungsdialog haben „Unterschrift im Vollbild“. Die große Fläche zeigt den betreffenden Kunden bzw. Tourbetrag. Querhalten ist möglich; Größenwechsel bewahren die gezeichneten Striche. „Übernehmen“ überträgt proportional und ohne große Leerflächen in das bestehende begrenzte PNG-Format. „Zurück“ verwirft ausschließlich die Vollbildänderung. Arzt-/Briefkasten-/Nichtzustellungsabläufe behalten ihre bisherigen Regeln. Abmeldung leert auch die Vollbildfläche.

## Schutz und Prüfung

Keine Schemaänderung. Keine Änderung der verschlüsselten Offline-Datenbank oder ihres Produktionsnamens. Alte Warteschlangeneinträge und bestehende Nachweise bleiben kompatibel. Die neuen Präsentationsmodule sind Teil des Offline-Pakets; Cacheversion und Bereitschaftskennung werden gemeinsam aktualisiert. Die serverseitige Zahlungsprüfung akzeptiert den neuen Grund, sperrt aber widersprüchliche Zahlungen weiterhin.

Lokale Prüfungen: 36 Grundprüfungen, 84 Cloudflare-Backendprüfungen einschließlich zwei neuer Prüfungen zu Gruppierung/Zahlungsgrund, 16 Sicherungs-/Aufbewahrungsprüfungen und vier Cloudflare-Browserabläufe. PDF-/Abrechnungsprüfungen zusätzlich nach der PDF-Anpassung wiederholt. Browser prüfen beide Vollbild-Unterschriften, Größenwechsel, geschützte Archivierung, Klappen/Suche, rote Forderungsanzeige, orange Nichtzustellung und bestehende Offline-Synchronisation mit fiktiven Daten.

Vor Veröffentlichung: konkrete Betreiberfreigabe für dieses Paket, erfolgreiche GitHub-Gesamtprüfung, frische verschlüsselte Betriebssicherung mit isoliertem Restore-Test und anschließender Abgleich des veröffentlichten Pakets. main/v3 bleiben unverändert. Diese Voraussetzungen wurden vor Veröffentlichung erfüllt.

## Veröffentlichungsnachweis

## Bürofarben, offene Beträge und Vollbild-Unterschriften – 21.10.2026, aktueller Betriebsstand

Nach ausdrücklicher Betreiberfreigabe „gut dann freigabe“ veröffentlicht: geprüfter Code `3d48690b9c8a63dafdbbd1d6a6b65534cef82bdc`; [GitHub-Prüfung 39560735673](https://github.com/Marienapotheke/marapo24-test/actions/runs/39560735673) erfolgreich mit 158 Tests (36 Grundprüfungen, 17 Emulatorprüfungen, ein v3-Browserablauf, 84 Cloudflare-Backendprüfungen, 16 Sicherungsprüfungen und vier Cloudflare-Browserabläufe). Worker-Version `baf7b7e0-cd24-4bbf-ab21-1e37ed0ff2ab`.

Marienapotheke blau, Cusanus-Apotheke violett: Kundenkarten, getrennte Kassensummen und farblich abgesetzte kassierte Beträge. Büro-Touren lassen sich einklappen; die Namenssuche öffnet passende Treffer vorübergehend. Nach Tourende werden aktuelle Kunden mit Geldbetrag nach Apotheke und alphabetisch angezeigt; Nullbeträge und historische Einträge bleiben gesondert sichtbar. Nicht zugestellt erscheint orange auf helleren Kundenkarten. Offene Forderungen nach Tourende sowie Zahlungsgründe werden fett/rot hervorgehoben. „Überweist“ ist ein zusätzlicher Grund für den weiterhin offenen Rest, kein Zahlungseingang. Zustell- und Abrechnungsunterschriften können auf einer eigenen Vollbildfläche erfasst werden und werden proportional ins bestehende geschützte PNG-Format übernommen. Die PDF-Darstellung unterscheidet Apotheke, kassierte Beträge und offene Zahlungen ebenfalls farblich.

Verschlüsselte Betriebssicherung auf S1 vor Veröffentlichung um 09:23 Uhr und danach um 09:24 Uhr (Europe/Berlin), beide isoliert erfolgreich wiederhergestellt und mit Integrität, Fremdschlüsseln und Archivschutz geprüft. Alle 316 vorherigen Zustellnachweise und 15 Abrechnungen bytegenau unverändert. 22 öffentliche Dateien bytegenau mit dem geprüften Paket abgeglichen, elf unangemeldete API-Zugriffe gesperrt. Schlüsselbindungen, D1-EU, Aufbewahrungszeitplan und verschlüsselte Offline-Datenbank erhalten. Keine Datenmigration und keine Testdatensätze im Echtbetrieb; main/v3 unverändert.

Nach Speichern laufender Eingaben ausstehende Vorgänge übertragen, alle MARAPO24-Fenster schließen und im WLAN neu öffnen. Browserdaten nicht löschen. Vor Abfahrt „Für Funklöcher vorbereitet“ kontrollieren. Details: [Büroansicht und Unterschriften](buero-farben-2026-10-21.md).
