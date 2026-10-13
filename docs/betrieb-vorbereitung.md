# MARAPO24 – dauerhafter Betrieb: Vorbereitung

Stand 13.10.2026. Separate kostenlose Test-App; Testzweig, main/v3 und aktive Firestore-Regeln unverändert. Bis zur ausdrücklichen Echtdatenfreigabe ausschließlich fiktive Lieferungen.

## Zugänge

Fahrer: Name und persönliche sechsstellige PIN, maximal drei freigegebene Geräte. Versuche serverseitig begrenzt, achtstündige widerrufbare HttpOnly-Sitzungen. Eine PIN gewährt auch Personen mit zwei Rollen ausschließlich Fahrerrechte.

Büro: Benutzername und persönliches Passwort. `vorname.nachname@marapo24.de` dient als Kennung ohne benötigtes Postfach. Keine fingierte E-Mail-Bestätigung. Gesalzene Passwortableitung plus separates Backend-Pepper; frische Rollenprüfung bei jedem Zugriff. Ein vorläufiges Passwort erlaubt nur die eigene Passwortänderung vor Datenzugriff.

Die Passwortableitung erfolgt im Browser mit sechs unabhängig gesalzenen PBKDF2-SHA256-Blöcken zu jeweils 100.000 Iterationen; Benutzername und zufälliger Kontosalt sind gebunden. Nur der zusammengefasste 256-Bit-Passwortnachweis wird an den Server übertragen und dort zusätzlich mit dem geheimen Pepper, Konto und Salt per HMAC geschützt. Dieser Nachweis ist wie ein Passwort zu behandeln und wird niemals gespeichert oder protokolliert. Zufällige vorläufige Passwörter haben 144 Bit Entropie und verwenden bis zum erzwungenen persönlichen Passwortwechsel einen SHA256-Nachweis. Keine langsame Passwortableitung im Worker. Die erste veröffentlichte serverseitige Ableitung benötigte 146 ms CPU und wird daher durch eine neue, getrennte Credential-Tabelle ersetzt; alte Archivdaten bleiben erhalten.

Persönliche Administration: ausdrücklich benannte echte, bestätigte E-Mail-Adresse über Firebase. Die tatsächliche Adresse und die private Mitarbeiterzuordnung bleiben außerhalb des öffentlichen Repositorys. Nur dieser verifizierte Administratorzugang darf Büropasswörter und Fahrer-PINs neu vergeben. Eine vergessene Passwort-Anfrage erscheint in dessen privater Anfragenliste. Die öffentliche Antwort verrät nicht, ob der Benutzer existiert. Vorläufiges Passwort einmalig anzeigen und persönlich weitergeben; bisherige Sitzungen widerrufen. Wiederherstellung des persönlichen Administratorzugangs über dessen echte E-Mail.

Offene Signaturen werden vor Warteschlangenspeicherung verschlüsselt. Abmeldung entfernt den jeweiligen Tourcache; unbestätigte Abschlüsse bleiben verschlüsselt und kontogebunden. Büro benötigt Internet.

## Kunden und Reihenfolge

Erfolgreiche Zustellungen aktualisieren Kundenvorschläge anhand Name und Adresse. Suche ab drei Zeichen, maximal zehn Vorschläge, nur aktive berechtigte Mitarbeiter. Vorschläge enthalten Adresse, Telefon und Lieferhinweis, keine Signatur, Barzahlung oder Archivkennungen. Zahlungsbetrag je Lieferung neu prüfen.

Offene Stopps der eigenen Tour mit Pfeiltasten sortieren. Jede Änderung enthält alle offenen Stopps exakt einmal; atomare Versionsprüfung verhindert Überschreiben gleichzeitiger Änderungen. Straßenberechnung über Geoapify Free, maximal 80 Stopps, ab dem ersten erfassten Stopp. Nur Adressen und Koordinaten verlassen die App, keine Namen, Telefonnummern, Hinweise, Signaturen oder internen Auftragskennungen. Unvollständige Anbieterantworten, Fehlzuordnungen und zwischenzeitliche Änderungen erhalten die bisherige Reihenfolge. Manuelle Änderungen bleiben möglich. Google Maps erhält die jeweilige Zieladresse.

Der geheime Geoapify-Schlüssel ist noch separat zu verbinden. Atomare Tagesgrenze 2.500 Credits, kein automatischer Tarifwechsel. Geocoding ein Credit; Route Planner für N Start-/Zielpositionen N×min(N,10) Credits. [Offizielle Berechnung](https://www.geoapify.com/pricing-details/).

## Sicherung

`scripts/backup-job.mjs` prüft die Identität der getrennten Testdatenbank, exportiert sie und verschlüsselt mit AES-256-GCM. Jede Sicherung wird vor Abschluss lokal isoliert zurückgelesen: Integrität, Fremdschlüssel und alle vier Archivschutz-Trigger. Kein Überschreiben vorhandener Dateien. Temporäre lesbare SQL-Dateien werden entfernt. Wiederherstellungsschlüssel getrennt vom Netzwerkserver; private Pfade/Jobkonfiguration in ignorierter `.backups/`.

Erste Server-Sicherung am 13.10.2026 erfolgreich geprüft: vier fiktive Konten, eine Tour, zwei Stopps, zwei Nachweise. Täglicher Windows-Auftrag eingerichtet, nur bei eingeschaltetem Arbeitsplatz und angemeldeter Person; verpasste Ausführung nachholen. Ergebnis in privater `.backups/last-backup-status.json`. Kein vom Arbeitsplatz unabhängiger Sicherungsdienst; Erfolg regelmäßig prüfen. Wiederherstellungsschlüssel separat geschützt an Verantwortliche übergeben, bevor bei Computerverlust echte Daten gefährdet wären.

Zusätzliche verschlüsselte Backend-Schlüsselsicherung ist vorbereitet, bis zur ausdrücklichen Speicherortfreigabe nicht auf den Netzwerkserver übertragen. Keine automatische Sicherungslöschung.

## Vor echten Lieferungen offen

- Finalen Commit einschließlich aller Firebase-Emulator- und Browserprüfungen validieren; nur additive Testmigrationen.
- Gehostete CPU-Zeit/Quoten nach Optimierung mit fiktiver realistischer Last prüfen. Gratis-Dauerbetrieb noch nicht zugesichert; kein kostenpflichtiges Upgrade aktiviert.
- Administratoradresse bestätigen, Mitarbeiterberechtigungen prüfen und drei echte Android-Tablets einschließlich Funkloch, Neustart, Abmeldung, Widerruf und ausstehenden Abschlüssen erproben.
- Geoapify-Konto verbinden, notwendige Vertrags-/Anmeldeschritte vom Kontoinhaber bestätigen lassen.
- Datenschutz, Aufbewahrung/Löschung, Zuständigkeiten, Wiederherstellung und Störungsweg festlegen. Keine rechtliche Frist geraten.
- Ausdrückliche Freigabe für echte Kundendaten. Testkennzeichnung bleibt bis dahin sichtbar.
