# MARAPO24 Android-Handy-Test – installierbare PWA

**Nur für fiktive Daten. Keine echten Kunden, Patientendaten oder Unterschriften verwenden.**

## Auf Android installieren

Die Dateien müssen zunächst über eine **HTTPS-Webadresse** bereitgestellt werden. Eine ZIP-Datei oder `file://` allein lässt sich nicht als PWA installieren.

**Kostenloser Testweg:** Ein GitHub-Repository mit diesen statischen Dateien erstellen, GitHub Pages in den Repository-Einstellungen aktivieren (Branch `main`, Ordner `/root`) und die HTTPS-Adresse in Chrome auf dem Android-Handy öffnen. Achtung: Bei GitHub Pages sind die ausgelieferten Programmdateien öffentlich; niemals echte Kundendaten, Zugangsdaten oder Geheimnisse in diese Dateien schreiben. Die Demo speichert Eingaben lokal im Browser und sendet sie nicht an GitHub; dennoch ist sie nicht für reale Patientendaten freigegeben. Alternativ kann ein anderer statischer HTTPS-Host genutzt werden.

In Chrome: Seite öffnen → Menü (drei Punkte) → **App installieren** bzw. **Zum Startbildschirm hinzufügen**. Wenn die Browserinstallation angeboten wird, erscheint auch eine Schaltfläche **App installieren** in der Demo.

## Testen

1. App starten, im Büro eine Tour und eine **fiktive** Lieferung anlegen.
2. Fahreransicht öffnen, passenden Testfahrer auswählen, Zustellung simulieren.
3. Flugmodus aktivieren und App erneut starten. Daten und Oberfläche sollten lokal verfügbar sein.
4. Flugmodus deaktivieren. **Es gibt keine Synchronisierung zwischen Handys und Büro-PCs.**

## Technische Grenzen

- Lokale Browser-Speicherung (`localStorage`) ohne Verschlüsselung, Backup oder Geräteabgleich.
- Keine echten Mitarbeiterkonten, PIN-Authentifizierung, Rollenrechte oder Server-Datenbank.
- Browser kann gespeicherte Daten löschen; Unterschriften sind nur Testdaten.
- Installation benötigt Chrome/Android mit PWA-Unterstützung und HTTPS (oder `localhost` für Entwicklung).
- Für produktiven Apothekenbetrieb ist zusätzliche Entwicklung, Security-/Datenschutzprüfung und Freigabe erforderlich.
