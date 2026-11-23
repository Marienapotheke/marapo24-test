# Einzelprüfung und Teilsortierung bei nicht gefundenen Adressen

Vorbereitet am 23.11.2026 im bestehenden Zweig `test-geschuetzte-zustellnachweise`. Noch nicht veröffentlicht, keine produktive Änderung und keine Datenbankmigration.

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

Lokal erfolgreich: **187 Prüfungen** (36 Grundprüfungen, 123 Cloudflare-Backend-/PDFprüfungen, 22 Sicherungs-/Restore-/Retentionsprüfungen und sechs Browserabläufe). Die vollständige Backendprüfung wurde mit zwei parallelen Testdateien erfolgreich abgeschlossen. Eine vorübergehende lokale Dateisperre wurde durch erneuten erfolgreichen Lauf aufgelöst; ein früher hängender lokaler Prüfprozess wurde gezielt beendet. Das neue Einzelprüfungs-/Teilsortierungs-Browserbeispiel wurde zusätzlich visuell kontrolliert. Die GitHub-Gesamtprüfung folgt für den festgeschriebenen Stand.

Neue Backendprüfungen mit fiktiven Adressen decken Teilsortierung, mehrere ausgelassene Stopps, relative Reihenfolge, persistenten Marker, gezieltes manuelles Verschieben, unveränderte Beträge/Päckchen/Adressdaten, Rollen, ungültige Auslassungen, Revisionen, Anbieterfehler, atomaren Rollback, parallele Änderung auch eines ausgelassenen Stopps und Erhalt unveränderlicher Nachweise ab. Ein mobiler Browserablauf prüft Einzelentscheidungen, blockierte Bestätigung, ausdrücklich gespeicherten Vorschlag, erneute Prüfung, endgültige Teilsortierung, Neuladen und manuelles Platzieren. Zusätzliche unveränderte Grund-/Büro-/Offline-/Sicherungsabläufe werden mitgeprüft. Ausschließlich fiktive Testdaten.

Die 24 öffentlichen Dateien der Live-App wurden lesend bytegenau gegen die zuletzt veröffentlichte Version `96098d7f-b9fe-48e8-8e0f-615f173e179d` geprüft. Keine produktiven Kundendaten für diese Vorbereitung abgefragt oder verändert. Veröffentlichung erst nach konkreter Betreiberfreigabe, frischer verschlüsselter Sicherung und isoliertem Wiederherstellungstest. Danach Live-Dateien, Berechtigungssperren, unverändertes Schema, Schlüsselbindungen, D1-EU, Retention und Erhalt der Originalarchive prüfen. `main` und v3 bleiben unverändert; kein Merge.
