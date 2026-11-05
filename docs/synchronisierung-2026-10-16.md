# Automatische Übertragung: freigegebene Fehlerkorrektur

Zunächst auf Grundlage des am 16.10.2026 freigegebenen Betriebsstands vorbereitet und ausschließlich mit fiktiven Daten getestet. Nach konkreter Betreiberfreigabe veröffentlicht; Abschlussnachweise am Ende dieses Dokuments. Keine Änderung an Kundendaten, Archivnachweisen, Schlüsseln oder main/v3, keine Datenmigration.

## Beobachtung und Grenzen der Diagnose

Zwei gemeldete Eifel-Touren vom 14./15.10. waren nach Aussage des Betreibers trotz zwischenzeitlichem Internetzugang auch nach Neuladen im Büro nicht abgeschlossen. Auch das Handy zeigte das Ende erst nach Neuladen. Die Datenbank wurde ausschließlich lesend auf Tourstatus und Zeitpunkte geprüft: Erfassung laut Gerätezeit jeweils am Tourtag, serverseitiges Speichern erst am Folgetag. Die Gerätezeit ist ungeprüft und kein eigenständiger Beweis einer korrekten Uhr. Es wurden keine Kundendaten oder Signaturen ausgelesen oder verändert. Die genauen damaligen Geräte-/Verbindungsfehler sind ohne damalige Geräteprotokolle nicht nachträglich bewiesen; insbesondere ist die gemeldete Anzeige „keine ausstehenden Abschlüsse“ nicht auf dem damaligen Gerät nachgestellt.

## Gefundene Schwachstellen und Korrektur

- Die Oberfläche konnte beim Öffnen bereits sichtbar sein, bevor die lokale Warteschlange eingelesen war. Bis zum nachgelagerten Ladevorgang konnte dadurch fälschlich „Keine ausstehenden Abschlüsse“ erscheinen; hing zuvor eine Netzabfrage, blieb die Anzeige entsprechend veraltet. Die Warteschlange wird jetzt vor dem ersten Anzeigen der App geladen, auch nach Offline-Neustart. Die Gesamtprüfung deckte dieses Anzeigefenster auf; der bestehende Browsertest prüft die Zahl wartender Vorgänge unmittelbar nach Sichtbarwerden der App.
- Bisher musste die periodische Aktualisierung der Übersicht zuerst erfolgreich sein, bevor die Warteschlange versucht wurde. Jetzt wird zuerst übertragen; ein fehlgeschlagenes Lesen verhindert den Schreibversuch nicht.
- Die Rückkehr zu einer noch geöffneten App löste bisher keine unmittelbare Wiederaufnahme aus. Jetzt versuchen Sichtbarwerden, Fensterfokus, Seitenwiederanzeige und Wiederverbindung die Übertragung sofort. Der regelmäßige Versuch alle 30 Sekunden bei sichtbarer App bleibt erhalten. Gleichzeitige Wiederaufnahmeereignisse werden zusammengefasst.
- Die eigentliche API-Anfrage war zeitbegrenzt, der vorherige Abruf der Authentifizierungs-/App-Check-Tokens nicht. Auch diese Phase hat jetzt eine Zeitgrenze. Ein Fehler bleibt sichtbar und blockiert spätere Versuche nicht dauerhaft. Anmeldeschutz und Sitzungsfristen werden nicht abgeschwächt; bei abgelaufener Anmeldung bleibt die Warteschlange bis zur persönlichen Neuanmeldung erhalten.
- Während eines laufenden Versands neu gespeicherte Vorgänge werden im selben Durchlauf erneut aus dem Speicher gelesen, in gespeicherter Reihenfolge. Ein fehlerhafter Vorgang blockiert abhängige Vorgänge derselben Tour. Andere Touren können bei fachlichen Fehlern weiter übertragen werden; bei Verbindungsfehlern wartet der Durchlauf auf einen neuen Versuch.
- Nur eine ausdrückliche positive Bestätigung der jeweiligen Serveraktion entfernt den Vorgang aus der Warteschlange. Verlorene oder unvollständige Antworten behalten dieselbe Kennung und verschlüsselte Nutzlast für einen wiederholbaren Versuch. Originalnachweise werden weder geändert noch doppelt angelegt. Bei Benutzerwechsel werden fremde Vorgänge nicht bestätigt/gelöscht.
- Die Fahreranzeige unterscheidet „Tourende nur auf diesem Gerät gespeichert – Übertragung ausstehend“ von „Tourende vom Server bestätigt“. Die Netzwerkanzeige kennzeichnet wartende Vorgänge auch bei vorhandenem Internetzugang.

Die geöffnete App muss tatsächlich laufen können. Ein gesperrtes Android-Handy beziehungsweise eine vom Betriebssystem angehaltene App bietet keine garantierte Hintergrundausführung. Öffnen/Entsperren und Rückkehr zu MARAPO24 benötigen künftig kein Seitenneuladen für den unmittelbaren neuen Versuch. Büroansichten werden ebenfalls bei Rückkehr sofort aktualisiert. Es wird kein dauernder Hintergrunddienst versprochen. Grundlagen: [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), [Firebase App Check getToken](https://firebase.google.com/docs/reference/js/app-check#gettoken).

## Prüfung

Sechs gezielte Tests: hängender Tokenabruf und nachfolgende Erholung; während laufender Übertragung hinzugekommene Zustellung/Ende; fehlende Bestätigung mit identischem erneutem Versuch; Fehlerabhängigkeiten und Benutzerwechsel; zusammengefasste Wiederaufnahme ohne neues Online-Ereignis trotz Lesefehler; regelmäßiger Wiederholungsversuch ohne Verbindungswechsel.

Zusätzlicher vollständiger Browserablauf mit fiktiven Konten und Daten in Android-Ansicht: vorhandenes Internet bei absichtlich fehlgeschlagenen Schreibversuchen, zwei sicher gespeicherte Vorgänge und deutliche ausstehende Anzeige; fehlerhafte Zustandsabfrage bei wieder möglichem Schreiben; verlorene erfolgreiche Tourendebestätigung; unmittelbare Wiederaufnahme ohne Neuladen; identischer Abschluss genau einmal; Büro aktualisiert bei Rückkehr. Der Test simuliert Browserereignisse und Verbindungsausfälle, nicht die konkrete damalige Android-Systemzustandsfolge.

Alle 83 lokalen Backendtests und alle vier Browserabläufe erfolgreich. Vollständige GitHub-Prüfung folgt im bestehenden Testzweig. Keine Schemaänderung notwendig. Veröffentlichung erst nach konkreter Betreiberfreigabe und frischer verschlüsselter Sicherung mit isoliertem Restore; bestehende Warteschlange und ihre Datenbankkennung unverändert.

## Veröffentlichung nach konkreter Freigabe

Nach Betreiberantwort „ja“ am 16.10.2026 veröffentlicht: Code `e20e79d689dfd5c32aec17d2ed4f1998646073ac`, GitHub-Gesamtprüfung `38904424865` mit 156 Tests erfolgreich. Worker-Version `e20a66fb-1d34-4e5f-939f-f8af71f1abfb`. Keine Migration; unverändertes Serverquellbundle und Offline-Speicherformat vor Veröffentlichung geprüft.

Verschlüsselte Betriebssicherungen auf S1 um 15:03 Uhr und 15:04 Uhr (Europe/Berlin), beide isoliert wiederhergestellt und auf Integrität/Fremdschlüssel/Archivschutz geprüft. Alle 142 vorherigen Zustellnachweise und acht Abrechnungen exakt unverändert. 35 öffentliche Dateien bytegenau abgeglichen, zehn unangemeldete API-Zugriffe gesperrt. Bindings, D1-EU und Aufbewahrungszeitplan erhalten. Frühere Aussagen zur Vorbereitung dokumentieren den damaligen Arbeitsstand; aktuell maßgeblich ist `docs/echtdatenfreigabe.md`.
