# Entfernung des Botendienstbeleg-Scans

Am 19.10.2026 ausdrücklich vom Betreiber beauftragt, weil die Erkennung im tatsächlichen Einsatz weiterhin nicht zuverlässig funktioniert. Die vollständige manuelle Erfassung bleibt erhalten.

Entfernt: Kamera-Schaltfläche, Dateiauswahl, Scanvorschau, OCR-/Parsermodule, Sprachmodelle und zugehörige Bibliotheksabhängigkeiten. Auch beim Wiederverwenden des lokalen Buildordners werden ausschließlich die bekannten erzeugten Scanmodule und der erzeugte OCR-Ordner entfernt, damit alte Dateien nicht versehentlich erneut veröffentlicht werden. Der neue Offline-App-Cache enthält keine Scanmodule mehr. Bereits gespeicherte Offline-Vorgänge und ihre Datenbank bleiben unverändert. Alte geöffnete App-Fenster benötigen nach Veröffentlichung einen Neustart; Browserdaten dürfen nicht gelöscht werden.

Die bisherige Scan-Implementierung bleibt ausschließlich in der Git-Historie nachvollziehbar. Die dazugehörigen Tests wurden mit der Funktion entfernt; die bestehende Bürosuche bleibt weiterhin getestet. Der mobile Büroablauf prüft jetzt fehlende Kamera-/Scanbedienelemente und vollständig manuelle Eingabe, anschließend Offline-Tourstart, Zustellabschluss, Tourende sowie spätere Büroabrechnung mit Unterschrift.

Lokal erfolgreich: 79 Backend-/Workflowprüfungen und vier Browserabläufe mit ausschließlich fiktiven Daten. Vollständige GitHub-Prüfung vor Veröffentlichung. Keine Änderungen an Backendlogik, Datenbankschema, Schlüsseln, Retention, Signaturen, Archivnachweisen, main/v3 oder Kundenprofilen. Keine Migration nötig. Veröffentlichung zur Ausführung des konkreten Entfernungsauftrags erst nach frischer verschlüsselter Betriebssicherung mit isoliertem Restore und Prüfung des Veröffentlichungspakets.

## Abgeschlossene Veröffentlichung

Gemäß ausdrücklichem Entfernungsauftrag veröffentlicht: Code `fa924f741537829828b1548bac845d917fb96019`, GitHub-Prüfung `39221368334` mit 152 Tests erfolgreich. Worker-Version `b3245316-3e1b-409b-b504-f2c661c24c51`.

Verschlüsselte Betriebssicherungen auf S1 um 10:18 Uhr und 10:19 Uhr (Europe/Berlin), beide isoliert erfolgreich wiederhergestellt. Vorherige 145 Zustellnachweise und 8 Abrechnungen exakt unverändert. 20 öffentliche Dateien bytegenau geprüft; alte OCR-Pfade liefern keine ausführbaren Modelle/Module mehr. Bindings, D1-EU, Archivschutz und Aufbewahrung erhalten. Keine Migration. Verbindlicher Stand: `docs/echtdatenfreigabe.md`.
