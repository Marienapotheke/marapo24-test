# Einzelprüfung und Teilsortierung bei nicht gefundenen Adressen

Veröffentlicht am 23.11.2026 nach ausdrücklicher Betreiberfreigabe. Entwicklungszweig `test-geschuetzte-zustellnachweise`; keine Datenbankmigration. main/v3 unverändert.

## Vereinbarte Bedienung

Die App prüft beim automatischen Vorsortieren die offenen Lieferadressen. Ist eine Adresse auf der Karte nicht eindeutig bestätigt, wird sie einzeln mit Kundenname und unveränderter Anschrift angezeigt. Für jeden betroffenen Stopp kann der Fahrer:

- „Adresse prüfen / ändern“ im bisherigen Päckchenformular öffnen;
- einen App-Vorschlag zunächst im Formular prüfen und ausdrücklich speichern;
- „Diesen Stopp für die Sortierung auslassen“ wählen und diese Entscheidung bei Bedarf zurücknehmen.

Kein automatisches Auslassen aller problematischen Adressen. Solange für einen nicht gefundenen Stopp noch keine Entscheidung getroffen wurde, bleibt „Rest sortieren · gewählte Stopps auslassen“ gesperrt. Nach gespeicherten Änderungen ist eine erneute Adressprüfung erforderlich. Frühere Entscheidungen zum Auslassen bleiben dabei nur für unveränderte Anschriften bestehen. Kartenfunde ersetzen niemals automatisch die gespeicherten Kundenangaben.

Nach ausdrücklicher Bestätigung wird ausschließlich die bestätigte Teilmenge über Geoapify vorsortiert. Ausgelassene Stopps werden in ihrer bisherigen relativen Reihenfolge ans Ende der offenen Stopps angehängt, vollständig erhalten und als „Manuell einsortieren · von Automatik ausgelassen“ angezeigt. Diese Kennzeichnung bleibt auch nach Neuladen oder auf einem anderen Gerät erhalten. Verschiebt der Fahrer einen solchen Stopp mit ↑ oder ↓, entfällt dessen Markierung. Das Verschieben anderer Stopps und „Route umkehren“ löschen die Markierung nicht. Eine tatsächliche Adressänderung verwirft die alte Kennzeichnung; Änderungen an anderen Päckchenfeldern bei unveränderter Anschrift erhalten sie.

Bei null oder einer bestätigten Adresse wird keine Straßenroute berechnet. Die App sagt das ausdrücklich und erhält alle Stopps für die manuelle Anordnung. Berechnungsfehler, fehlende Internetverbindung, Kartenkontingent und eine nicht bestätigte Startadresse sind kein Anlass, Lieferadressen stillschweigend auszulassen.

## Daten und Berechtigungen

Keine Migration und keine neuen Tabellen. Reihenfolge bleibt in `tour_orders`. Eine interne Kennzeichnung in den bestehenden JSON-Daten ausschließlich offener Stopps kennzeichnet die manuelle Restarbeit. Reihenfolge und Kennzeichnungen werden atomar zusammen gespeichert; bei Fehler oder konkurrierenden Änderungen bleibt der Vorgang vollständig ohne Wirkung. Das gilt auch für ausgelassene Stopps: Ihr unveränderter Datenstand gehört zum atomar geprüften Berechnungsschnappschuss. Stoppmenge, Beträge, Päckchenzahlen, Empfänger, Lieferhinweise und Adressen werden durch das Auslassen nicht geändert oder gelöscht.

Der Server prüft eigene zugewiesene Tour, aktive Berechtigung, offene Stopps, vollständige eindeutige Stoppmenge, Revision, Koordinaten der bestätigten Teilmenge und unveränderte Päckchendaten. Fremde, abgeschlossene, doppelte oder inzwischen bestätigte ausgelassene Stopps sowie veraltete Reihenfolgen werden abgewiesen. Anbieterantworten müssen weiterhin sämtliche zur Berechnung übermittelten Jobs eindeutig zuordnen. Kundenname, Telefon, Lieferhinweise, Geldbeträge und interne Tour-/Stoppkennungen werden nicht an den Routenplaner gesendet. Geoapify-EU, Depot und Kartenbudget bleiben unverändert.

Die Kennzeichnung ist keine Änderung eines Zustellnachweises, gelangt nicht in neue Zustell-/Entfernungsnachweise oder Kundenprofile und verändert keine vorhandenen Archive. Sie verleiht keine zusätzlichen Büro-/Fahrerrechte. Die bisherige manuelle Sortierung und ältere Clients bleiben kompatibel. Verschlüsselte Offline-Datenbank, Warteschlangen, Signaturen, Sicherungen und Aufbewahrungsregeln bleiben erhalten. Neue vollständige Offline-App-Version: `partial-route-20261123`.

## Prüfung und Veröffentlichung

Lokal erfolgreich: **187 Prüfungen** (36 Grundprüfungen, 123 Cloudflare-Backend-/PDFprüfungen, 22 Sicherungs-/Restore-/Retentionsprüfungen und sechs Browserabläufe). Die vollständige Backendprüfung wurde mit zwei parallelen Testdateien erfolgreich abgeschlossen. Eine vorübergehende lokale Dateisperre wurde durch erneuten erfolgreichen Lauf aufgelöst; ein früher hängender lokaler Prüfprozess wurde gezielt beendet. Das neue Einzelprüfungs-/Teilsortierungs-Browserbeispiel wurde zusätzlich visuell kontrolliert. Die GitHub-Gesamtprüfung desselben festgeschriebenen Stands war anschließend mit 205 Prüfungen erfolgreich.

Neue Backendprüfungen mit fiktiven Adressen decken Teilsortierung, mehrere ausgelassene Stopps, relative Reihenfolge, persistenten Marker, gezieltes manuelles Verschieben, unveränderte Beträge/Päckchen/Adressdaten, Rollen, ungültige Auslassungen, Revisionen, Anbieterfehler, atomaren Rollback, parallele Änderung auch eines ausgelassenen Stopps und Erhalt unveränderlicher Nachweise ab. Ein mobiler Browserablauf prüft Einzelentscheidungen, blockierte Bestätigung, ausdrücklich gespeicherten Vorschlag, erneute Prüfung, endgültige Teilsortierung, Neuladen und manuelles Platzieren. Zusätzliche unveränderte Grund-/Büro-/Offline-/Sicherungsabläufe werden mitgeprüft. Ausschließlich fiktive Testdaten.

Die 24 öffentlichen Dateien der Live-App wurden lesend bytegenau gegen die zuletzt veröffentlichte Version `96098d7f-b9fe-48e8-8e0f-615f173e179d` geprüft. Keine produktiven Kundendaten für diese Vorbereitung abgefragt oder verändert. Die konkrete Betreiberfreigabe, frische verschlüsselte Sicherungen und isolierte Wiederherstellungstests sind für diese Veröffentlichung erfolgreich abgeschlossen.

## Einzelprüfung und Teilsortierung nicht gefundener Adressen – 23.11.2026, aktueller Betriebsstand

Nach ausdrücklicher Betreiberfreigabe „ja“ veröffentlicht: Code `4ac9f02ce3a699da9fa7f8c0f0c000982f35c76a`; [GitHub-Gesamtprüfung 45229952394](https://github.com/Marienapotheke/marapo24-test/actions/runs/45229952394) erfolgreich mit 205 Prüfungen (36 Grundprüfungen, 17 Emulatorprüfungen, ein v3-Browserablauf, 123 Backend-/PDFprüfungen, 22 Sicherungs-/Restore-/Retentionsprüfungen und sechs Cloudflare-Browserabläufe). Zusätzlich lokal 187 Prüfungen erfolgreich. Worker-Version `ede54002-8aed-4a73-8db2-3fc91cdcb8c8`.

Nicht gefundene Lieferadressen werden einzeln angezeigt. Jeder betroffene Stopp wird ausdrücklich geprüft: selbst bearbeiten, einen App-Vorschlag zunächst im Formular prüfen und speichern oder genau diesen Stopp für die Sortierung auslassen. Erst nach Entscheidung für alle betroffenen Stopps lässt sich der Rest vorsortieren; gespeicherte Adressänderungen müssen erneut geprüft werden. Vorschläge ersetzen keine Anschriften automatisch. Ausgelassene Stopps bleiben mit sämtlichen Angaben, Betrag und Päckchenzahl erhalten, kommen in bisheriger relativer Reihenfolge ans Ende und bleiben nach Neuladen als „Manuell einsortieren“ markiert. Gezielt mit ↑/↓ verschobene Stopps verlieren ihre Markierung; andere Verschiebungen und „Route umkehren“ erhalten sie. Bei null oder einer bestätigten Adresse wird keine Straßenroute berechnet. Details: [Einzelprüfung und Teilsortierung](teil-sortierung-2026-11-23.md).

Reihenfolge und interne Kennzeichnungen ausschließlich offener Stopps werden atomar gespeichert. Der vollständige Datenstand auch ausgelassener Stopps wird auf konkurrierende Änderungen geprüft; Fehler lassen den Vorgang vollständig ohne Wirkung. Keine Datenbankmigration: gesamtes bestehendes Schema einschließlich aller Archiv-/Kilometerschutzregeln unverändert. Routingmarker gelangen nicht in neue Zustell-/Entfernungsnachweise oder Kundenprofile. Vorhandene Archive und Berechtigungen bleiben erhalten. Geoapify-EU, Depot und Kartenbudget unverändert; keine Kundennamen, Telefonnummern, Beträge oder internen Tour-/Stoppkennungen an den Routenplaner übermittelt.

Verschlüsselte Betriebssicherung auf S1 vor Veröffentlichung um 18:59 Uhr und danach um 19:00 Uhr (Europe/Berlin), beide erfolgreich isoliert wiederhergestellt. Alle 2079 ursprünglichen Zustellnachweise, 105 Abrechnungen, 12 Zustellkorrekturen und 3 Fahrerzuordnungsnachweise bytegenau unverändert; bestehende Kilometerkorrekturen ebenfalls abgeglichen (0 Altzeilen). 24 öffentliche Dateien entsprechen dem geprüften Paket; 20 unangemeldete API-Zugriffe gesperrt. Schlüsselbindungen, Live-Einstellungen, EU-D1 und Aufbewahrungszeitplan unverändert. Keine künstlichen Produktivdatensätze angelegt; main/v3 unverändert, kein Merge.

Neue vollständige Offline-App-Version `partial-route-20261123`; bestehende verschlüsselte Datenbank und Warteschlangen bleiben erhalten. Laufende Eingaben speichern und ausstehende Vorgänge vollständig übertragen, alle MARAPO24-Fenster schließen und im WLAN neu öffnen. Vor Abfahrt „Für Funklöcher vorbereitet“ prüfen. Browserdaten nicht löschen.
