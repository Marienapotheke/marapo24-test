# Entfernung des Botendienstbeleg-Scans

Am 19.10.2026 ausdrücklich vom Betreiber beauftragt, weil die Erkennung im tatsächlichen Einsatz weiterhin nicht zuverlässig funktioniert. Die vollständige manuelle Erfassung bleibt erhalten.

Entfernt: Kamera-Schaltfläche, Dateiauswahl, Scanvorschau, OCR-/Parsermodule, Sprachmodelle und zugehörige Bibliotheksabhängigkeiten. Auch beim Wiederverwenden des lokalen Buildordners werden ausschließlich die bekannten erzeugten Scanmodule und der erzeugte OCR-Ordner entfernt, damit alte Dateien nicht versehentlich erneut veröffentlicht werden. Der neue Offline-App-Cache enthält keine Scanmodule mehr. Bereits gespeicherte Offline-Vorgänge und ihre Datenbank bleiben unverändert. Alte geöffnete App-Fenster benötigen nach Veröffentlichung einen Neustart; Browserdaten dürfen nicht gelöscht werden.

Die bisherige Scan-Implementierung bleibt ausschließlich in der Git-Historie nachvollziehbar. Die dazugehörigen Tests wurden mit der Funktion entfernt; die bestehende Bürosuche bleibt weiterhin getestet. Der mobile Büroablauf prüft jetzt fehlende Kamera-/Scanbedienelemente und vollständig manuelle Eingabe, anschließend Offline-Tourstart, Zustellabschluss, Tourende sowie spätere Büroabrechnung mit Unterschrift.

Lokal erfolgreich: 79 Backend-/Workflowprüfungen und vier Browserabläufe mit ausschließlich fiktiven Daten. Vollständige GitHub-Prüfung vor Veröffentlichung. Keine Änderungen an Backendlogik, Datenbankschema, Schlüsseln, Retention, Signaturen, Archivnachweisen, main/v3 oder Kundenprofilen. Keine Migration nötig. Veröffentlichung zur Ausführung des konkreten Entfernungsauftrags erst nach frischer verschlüsselter Betriebssicherung mit isoliertem Restore und Prüfung des Veröffentlichungspakets.
