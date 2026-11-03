# Störungsprüfung vom 03.11.2026 – noch keine Veröffentlichung

## Ausgangsstand und Grenzen

Der Arbeitsordner und GitHub-Zweig `test-geschuetzte-zustellnachweise` stehen auf `25347bcba489841d96021144d3dcedf55650a6e1`, dokumentierte Veröffentlichung vom 21.10. Die tatsächliche Live-Version ist dagegen `4872e4c6-766d-4647-8aed-44c325d1df67`, hochgeladen am 30.10.2026. Betreiber bestätigt zwischenzeitliche Bearbeitung auf einem anderen Rechner. Dessen bearbeitbare Quellen, Tests und Änderungsdokumentation fehlen hier. 15 öffentliche Dateien unterscheiden sich vom zuletzt dokumentierten Paket. Der alte Repo-Stand darf deshalb nicht über die aktuelle App veröffentlicht werden.

Cloudflare-Lesezugriff funktionierte nach anfänglicher Ablehnung wieder. Aktuelle öffentliche Dateien und das aktuelle Worker-Bundle wurden lokal zur Analyse heruntergeladen. Keine produktiven Touren, Kundeneinträge oder Nachweise verändert, keine Migration, kein Deployment. main/v3 unverändert. Kundenbezogene Suchergebnisse bleiben außerhalb von Git.

## Lesend bestätigte Befunde

- Die gemeldete Mosel-Tour vom 02.11. ist mit 25 Stopps vorhanden und inzwischen beendet. Dieselbe Fahrerin besitzt außerdem eine leere, offene Eifel-Tour. Die konkrete Bildschirmfolge auf dem Handy wurde nicht aufgezeichnet; daraus folgt keine abschließende Erklärung jedes Verschwindens.
- Für den zusätzlich ausdrücklich benannten Kunden wurde ein Zustellnachweis einschließlich gespeicherter Unterschrift gefunden. Er gehört zu einer Eifel-Tour mit Datum 26.10., wurde aber am 02.11. gespeichert. Die Tour lief laut gespeichertem Start seit 26.10. und wurde erst am 02.11. um 20:31 Uhr (Europe/Berlin) beendet. 18 neue Stopps wurden am 02.11. zu dieser alten Tour hinzugefügt. Die ursprüngliche Zuordnung und Nachweise wurden nicht nachträglich umgeschrieben.
- Die Live-Oberfläche wählt nach einem Neustart bislang die erste zugeordnete Tour. Eine persönliche Tourauswahl wird nicht über den Neustart hinweg wiederhergestellt. Der Tourwähler liegt zudem innerhalb des bei abgeschlossenen Touren ausgeblendeten Erfassungsbereichs.
- Der neuere Live-Code verschiebt sämtliche Neudarstellungen, solange ein Feld im Päckchenformular fokussiert ist. Damit werden auch Änderungen an Tourstatus und Berechtigung erst verspätet dargestellt. Der Server prüft beendete Touren bereits; bisher fehlt jedoch eine Datumssperre gegen neue Fahrer-Stopps in einer alten, noch laufenden Tour.
- Der aktuelle Karten-Code fordert genau einen Treffer an. Passt dieser nicht exakt, wird die Adresse abgewiesen. Die gemeldete Moselstraße wurde nicht mit dem privaten Geoapify-Schlüssel erneut abgefragt. Eine fehlende Kartenübereinstimmung beweist keine falsche Anschrift.

## Lokal vorbereiteter Entwurf

Ein separat gekennzeichneter Entwurf liegt unter `artifacts/marapo24-incident-20261103-preparation/`. Er baut für die betroffenen Dateien auf dem heruntergeladenen aktuellen Live-Stand auf, nicht auf den älteren App-Quellen. Manifest und Diff dokumentieren Ausgangsversion und Prüfsummen. Dies ist **kein freigabefertiges Veröffentlichungspaket**. Das Server-Bundle wurde nur für eng begrenzte lokale Versuche geändert; es ersetzt keine Integration in die Originalquellen.

- Persönliche Tourauswahl innerhalb desselben Tages und Kontos wiederherstellen. Sonst aktuelle laufende bzw. vorbereitete Tour vor älteren Fahrten bevorzugen. Auswahl nur aus tatsächlich zugeordneten Touren.
- Tourwähler unabhängig vom Erfassungsformular anzeigen, Datum/Status und Warnungen bei beendeten oder älteren Touren sichtbar machen.
- Pauschales Zurückhalten aller Neudarstellungen während der Eingabe entfernen; Fokus und Cursor bei normaler Aktualisierung erhalten. Tourstatus sofort berücksichtigen.
- Vor Speichern die bestätigte Tourzuordnung erneut laden. Abgewiesene Eingaben nicht leeren und nicht automatisch einer anderen Tour zuweisen.
- Neue Fahrer-Einträge auf heutige offene/laufende Touren begrenzen, einschließlich atomarer serverseitiger Datumsprüfung. Bestehende ältere Touren, Offline-Abschlüsse und zulässige Korrekturen behalten ihre bisherigen Regeln. Büro-Vorbereitung für andere Tage bleibt möglich.
- Bis zu fünf Kartentreffer in einer Anfrage prüfen und ausschließlich einen Treffer mit passendem Ort, PLZ, Straße und Hausnummer verwenden. Keine Schätzung aus einer falschen Hausnummer oder einem Ortsmittelpunkt. Bisherige EU-Anbindung, Budgetprüfung, Adresscache und Depot-/Sortierlogik des neueren Live-Codes erhalten.

## Bisherige Prüfung

Vier lokale Unit-Prüfungen zur Tourauswahl und Eingabesicherheit erfolgreich. Ein mobiler Browserablauf mit der aus dem Live-Stand abgeleiteten Oberfläche und fiktivem Backend erfolgreich: aktuelle Auswahl, Wiederherstellung nach Reload, alte Fahrt gesperrt, Fokus/Cursor erhalten, externer Tourabschluss während fokussierter Eingabe sofort sichtbar, kein Speichern über die überholte Maske und Entwurf weiterhin vorhanden. Zwei Prüfungen am abgeleiteten aktuellen Worker gegen fiktive Daten erfolgreich: Datumssperre inklusive weiterhin möglicher Büro-Vorbereitung sowie zweiter passender Kartentreffer bei weiter gesperrtem falschem Ort/PLZ/Hausnummer.

Dies sind gezielte Entwurfsprüfungen, keine vollständige Regression des unbekannten Quellstands vom 30.10. Fiktive Datenbanken und simulierte Anbieterantworten; keine produktiven Testdaten. Die ursprünglichen Repo-Programmdateien bleiben bis zur Quellintegration unverändert.

## Noch erforderlich

Aktuellen Projektordner bzw. Git-Stand vom am 30.10. verwendeten Rechner beschaffen, Änderungen dort integrieren, aktuelle Gesamtprüfung durchführen und bisherige Funktionen einschließlich neuerer Zustell-/Zahlungs-/Fotoabläufe überprüfen. Erst ein konkretes vollständig geprüftes Paket zur Betreiberfreigabe vorlegen. Vor einer späteren Veröffentlichung wie vereinbart frische verschlüsselte Sicherung mit isoliertem Restore und anschließender Live-/Archivkontrolle. Bestehende Offline-Warteschlangen und Browserdaten nicht löschen. Historische Tourdaten oder Nachweise nicht zur nachträglichen Tageszuordnung verändern.
