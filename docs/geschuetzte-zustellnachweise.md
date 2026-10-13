# MARAPO24 – geschützte Nachweise und Betriebsvorbereitung
Stand: vorbereitet im Branch `test-geschuetzte-zustellnachweise`, nicht bereitgestellt. Bis zur gesonderten Betriebsfreigabe ausschließlich fiktive Daten.

## Umgesetzt
- Serververwaltete, aktive Mitarbeiterrollen für 11 Fahrer und bis zu 20 Büromitarbeiter; keine feste Beschränkung auf die ursprünglichen zwei Test-UIDs. E-Mail-Bestätigung erforderlich. Benutzerprofile sind aus dem Browser unveränderlich.
- Büro verwaltet Touren, Lieferungen und aktive Fahrzeuge. Nach Tourstart können keine weiteren Stopps angehängt werden. Fahrer sehen nur eigene Touren und können weder Rollen noch Tourzuweisung verändern.
- Tourstart dokumentiert Fahrzeug, am Gerät erfasste Startzeit und vertrauenswürdige Serverbestätigung. Tourende dokumentiert beide Zeitarten ebenfalls; erst nach Abschluss aller Stopps. Fahrzeug und Zeitfelder können nicht direkt aus dem Browser überschrieben werden.
- Abschlüsse werden atomar im Backend gespeichert. Eine Lieferung erhält einen unveränderlichen Nachweis. Ein zweiter neuer Abschluss wird abgewiesen; die identische Übertragung erhält eine Bestätigung ohne erneute Archivierung.
- Stopp-Dokumente enthalten keine Signaturbytes. `protectedDeliveryProofs` ist ausschließlich für aktive Büro-Konten lesbar. Der PDF-Abruf prüft die Büroberechtigung erneut im Backend.
- Privatkunden-Unterschriften werden vor dem Gerätespeichern mit AES-GCM und RSA-OAEP für das Backend verschlüsselt. Der private Schlüssel bleibt im Backend/Secret Manager. Manipulation oder Übertragung für eine andere Person/Lieferung/Abschluss-ID wird abgewiesen.
- Nachweise, Gerätezeiten und Serverzeiten werden getrennt dokumentiert. Gerätezeiten sind ausdrücklich ungeprüft; Offline-Zeitangaben sind kein vertrauenswürdiger Zeitstempel und keine qualifizierte elektronische Signatur.

## Funklochbetrieb
Vor der Abfahrt online anmelden, Touren/Fahrzeuge laden und die Offline-App vorbereiten. Ohne vorherige Anmeldung oder geladenen Tourcache ist kein kalter Offline-Start möglich.
- Die Fahreransicht bestätigt die Vorbereitung ausdrücklich. Ein Offline-Tourstart ohne geladenen Tourcache und Backend-Verschlüsselungsschlüssel wird verhindert.
- Zugewiesene Tourdaten werden verschlüsselt im Gerätespeicher abgelegt. Nach 12 Stunden wird ein alter Cache beim Neustart nicht mehr geöffnet; dann ist eine Online-Verbindung erforderlich.
- Ausstehende Nachweise enthalten keine lesbaren Signaturbytes. Sie bleiben auch nach Abmeldung verschlüsselt gespeichert und sind nur demselben Mitarbeiterkonto zur Übertragung zugeordnet.
- Reihenfolge: Tourstart → Zustellabschlüsse → Tourende. Die Warteschlange sortiert nach einer atomar vergebenen Reihenfolge, unabhängig von Uhrzeit oder UUID.
- Ausstehende Übertragung ist sichtbar. Wiederholungen nach Verbindungsabbruch führen nicht zu einer zweiten Archivierung.
- Höchstens 200 Vorgänge pro Gerät warten gleichzeitig. Eine fehlgeschlagene Gerätespeicherung schließt die Unterschrifterfassung nicht erfolgreich ab.
- Übertragung innerhalb von 48 Stunden; abweichende Gerätezeit oder gesperrte Konten erzeugen einen sichtbaren Fehler. Ein problematischer Nachweis wird nicht stillschweigend gelöscht.
- Bis zur Bestätigung Gerät behalten und keine Browserdaten löschen. Ein verlorenes Gerät kann einen noch nicht übertragenen Nachweis verlieren. PIN/Gerätesperre und Zuständigkeit bei Störungen sind vor Echtbetrieb festzulegen.
- Schlüsselrotation muss alte Schlüssel ausreichend lange erhalten; die aktuelle Implementierung unterstützt einen aktiven Schlüssel. Kein ungeprüfter Schlüsselwechsel bei ausstehenden Offline-Nachweisen.

## Sichere Trennung von v3
`firebase.json` und `firebase.deploy.json` zielen ausschließlich auf die neue Datenbank `protected-deliveries` und das separate Hosting-Ziel `protected-app`. Das Backend nutzt außerhalb des Emulators niemals die Standarddatenbank. `firebase.emulators.json` ist ausschließlich die lokale Demo-Konfiguration.
Die Standarddatenbank, bestehende v3-Regeln, der Hauptbranch und das laufende Hosting wurden nicht verändert. Die neuen Regeln dürfen niemals auf die Standarddatenbank kopiert werden.
Deployment-Hooks verweigern Funktionen/Hosting ohne gesonderte Freigabevariable. Die Hosting-Dateiliste enthält ausschließlich App-Dateien; keine Backend-Dateien, Mitarbeiterlisten oder Schlüssel.
App Check ist für bereitgestellte Callable-Funktionen verpflichtend. Firestore-App-Check darf im gemeinsamen Testprojekt nicht ungeprüft global aktiviert werden, da dies die bisherige v3 beeinflussen könnte.

## Nachgewiesener Firebase-Stand
Am 12.10.2026 erfolgreich angemeldet und den offiziellen Firebase-MCP-Server lokal mit einem MCP-Client geprüft: Projektinformationen, aktive Regeln und Regelvalidierung sind abrufbar. Die automatische Werkzeugeinbindung in die laufende Codex-Sitzung ist weiterhin nicht vorhanden; der direkte offizielle Server funktioniert.
Projekt: `marap024-botendienst-test`, aktiv. Standarddatenbank: Firestore STANDARD / FIRESTORE_NATIVE, Standort eur3. Abrechnung nicht aktiviert. Cloud Functions API deaktiviert.
Die aktiven Regeln wurden ausschließlich gelesen; sie speichern im bisherigen v3-Modell Signaturen noch in Fahrer-lesbaren Stopps. Deshalb erfolgt keine Übernahme realer Daten in das alte Modell.
Die ursprüngliche vorgeschlagene Regeldatei wurde durch Firebase mit „OK: No errors detected“ validiert; die danach erweiterten Regeln werden zusätzlich im Emulator getestet. Keine Regel wurde bereitgestellt.

## Prüfungen
Installation: `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm --dir functions install --frozen-lockfile --ignore-scripts`. Java 21 und Node 22.
- `pnpm test`: Berechtigungen, Rollen, Fahrzeug-/Tourstatus, verschlüsselte Warteschlange, Mehrfacherfassung, Reihenfolge, Kontoplan und sichere Ziele.
- `pnpm test:emulator`: echte Auth-/Firestore-/Functions-Aufrufe, Signaturtrennung, parallele Abschlüsse, Büro-PDF, 31 Mitarbeiterrollen, Tourzeiten und Fahrzeugregeln.
- `pnpm test:browser`: tatsächliche Oberfläche mit Büroanlage, Offline-Tourstart, Signatur, Tourende, Offline-Neustart, Wiederverbindung und PDF.
- `pnpm build`: begrenztes App-Paket in `dist`.
Der automatische Workflow verwendet nur `demo-marapo24`, synthetische Schlüssel und fiktive Daten. Keine Zugangsdaten und keine Deployment-Schritte.
Am 13.10.2026 bestanden 35 lokale Prüfungen, 17 Emulatorprüfungen und der vollständige Browserlauf inklusive Offline-Neustart, einmaliger Übertragung und Büro-PDF. Der aktuelle endgültige Teststand steht im Draft-PR. Die automatischen Prüfungen ersetzen den internen Probelauf auf den tatsächlich verwendeten Geräten nicht.

## Konten und tatsächliche Aktivierung
`functions/staff-admin.cjs` validiert Mitarbeiterlisten standardmäßig ohne Änderungen. Änderungen benötigen ausdrücklich `--apply --approved-account-changes`, ein festes Projektziel und berechtigte Admin-SDK-Anmeldung. Profile werden nur in `protected-deliveries` geschrieben. Bestehende gesperrte Auth-Konten werden nicht automatisch entsperrt; es werden keine Einladungen versendet oder Passwörter gespeichert.
Echte Mitarbeiteradressen, Rollen, Fahrzeugliste und Betriebsfreigabe fehlen noch. Kostenpflichtige Aktivierung, neue Ressourcen, App-Check-Schlüssel, IAM, Sicherung/Wiederherstellung und überprüfte Aufbewahrungs-/Löschregeln müssen vor echten Kundendaten ausdrücklich freigegeben bzw. eingerichtet werden.
Details und Reihenfolge: [Betriebsfreigabe](betriebsfreigabe.md).

Offizielle Grundlagen: [Callable-Funktionen](https://firebase.google.com/docs/functions/callable), [Regeltests](https://firebase.google.com/docs/rules/unit-tests), [Blaze für Funktionen](https://firebase.google.com/docs/functions/get-started), [Datenschutz und Verarbeitung](https://firebase.google.com/support/privacy).

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for server-managed roles, assigned-driver reads, an office-only proof archive, and server-only completion writes. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
