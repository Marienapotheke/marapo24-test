# Geschützte Zustellnachweise – Testbranch
Stand: Implementierter Prototyp, nicht bereitgestellt. Nur fiktive Daten.

## Verhalten
- Die neue Oberfläche nutzt `protectedTours/{tourId}/stops/{stopId}`. Die laufende v3 und ihre alten Touren werden nicht umgestellt.
- Ein Fahrer kann nur seine zugewiesenen Touren lesen. Die Stopp-Dokumente enthalten keine Signaturbytes.
- `completeProtectedDelivery` prüft Anmeldung, freigegebenes Testkonto, serververwaltete Rolle, Tourzuweisung, Schema, offenen Status und vorhandenen Nachweis innerhalb einer Firestore-Transaktion.
- Abschlussstatus und unveränderlicher Archivnachweis werden atomar gespeichert. Wiederholung und paralleler zweiter Abschluss werden abgewiesen. Der Fahrer erhält nur `{completed:true}`.
- Privatkunden benötigen beim erfolgreichen Abschluss eine größenbegrenzte, vollständig decodierbare PNG-Unterschrift mit sichtbaren Strichen. Nicht zugestellte und nicht private Lieferungen werden ohne Unterschrift abgeschlossen.
- `protectedDeliveryProofs` ist ausschließlich für das Büro lesbar. Alle Browser-Schreibzugriffe sind verboten, auch für das Büro.
- `downloadProtectedProof` prüft die Büroberechtigung erneut im Backend und erzeugt eine PDF. Es gibt weder öffentliche Speicherlinks noch Signatur-URLs.
- Zeitstempel stammen vom Server, Empfängerangaben aus dem Stopp. Ein SHA-256-Wert dokumentiert die gespeicherten Signaturbytes; dies ist keine qualifizierte elektronische Signatur.
- Benutzerrollen sind serververwaltet und aus dem Browser unveränderlich. Zusätzlich sind ausschließlich die zwei bereits in der v3 freigegebenen Testkonto-UIDs erlaubt.

## Prüfungen
`pnpm test`: lokale Berechtigungs-/Validierungstests.
`pnpm test:emulator`: Firestore-Regeln und echte Callable-Funktionen in `demo-marapo24`, inklusive konkurrierender Abschlüsse, unveränderlicher Nachweise, Signaturtrennung und autorisiertem PDF-Abruf.
Installation: `pnpm install --frozen-lockfile --ignore-scripts` und `pnpm --dir functions install --frozen-lockfile --ignore-scripts`.
Die Emulatoren benötigen Java 21 und Node 22. Der GitHub-Workflow installiert diese ausschließlich für Tests. Keine Firebase-Zugangsdaten, keine Deployments und keine Echtdaten im Workflow.
Der Test verweigert den Start ohne lokale Emulatorvariablen und Demo-Projekt-ID.

## Nachgewiesener Teststand
Am 12.10.2026 bestanden 34 Tests ohne übersprungene Fälle: 22 Backend-Berechtigungstests und 12 vollständige Emulator-Tests für Firestore, Auth und Functions. [Erfolgreicher Lauf](https://github.com/Marienapotheke/marapo24-test/actions/runs/38272703828), Code-Commit `c3b33d1369354b431f23f97b33aad5b80f095a19`. Der Standard-Firestore-Emulator hat die Regeln geladen; konkurrierende Abschlüsse, Archivschutz und echter Büro-PDF-Abruf wurden geprüft. Damit ist keine Live-Kompatibilität bestätigt.

## Firebase-Verbindung
Das Firebase-Plugin ist installiert und aktiviert. In der aktuellen Sitzung sind seine MCP-Werkzeuge nicht verfügbar. Der lokale Firebase-Client meldet fehlende Anmeldung. Daher sind Projektzugriff, bestehende Regeln, Datenbankedition, IAM, App Check und Abrechnung noch nicht verifiziert.
Die Regeln sind ein Prototyp für den Standard-Firestore-Emulator. Ihre Kompatibilität mit der tatsächlichen Datenbank muss nach Anmeldung geprüft werden.

## Grenze zur laufenden v3
**Nicht mergen, keine Regeln bereitstellen und kein Backend deployen ohne gesonderte Validierung und ausdrückliche Zustimmung.**
Die beigefügte vollständige Regeldatei verweigert Zugriff auf alte `tours` und unbekannte Sammlungen. Das verhindert den alten Signatur-Leseweg, würde aber die laufende v3 unterbrechen, wenn diese Regeln ungeprüft auf ihre Datenbank angewendet würden.
Das neue Frontend wird bei fehlendem Backend bzw. fehlenden neuen Zugriffsrechten mit einem Fehler abbrechen und verwendet keinen unsicheren Rückfall zur alten Speicherung.
Eine spätere Freigabe braucht einen separaten Emulator-/Testdurchlauf, Bestandsaufnahme und Sicherung der aktuellen Regeln sowie eine abgestimmte Umstellung oder separate Datenbank. Neue Testtouren können leer beginnen; alte Signaturen werden durch diesen Branch nicht automatisch kopiert oder gelöscht.

## Vor einer späteren Aktivierung
1. Firebase-Anmeldung durch den Kontoinhaber und ausschließlich lesende Prüfung von Projekt-ID, Datenbankedition, Regeln und Backend-Berechtigungen.
2. Erfolgreiche automatische Emulator-Prüfung; keine unerklärten übersprungenen oder fehlgeschlagenen Tests.
3. Separaten Zielort bzw. sichere gemeinsame Umstellung ausdrücklich freigeben, damit v3 weiterläuft.
4. Bestehende fiktive Signaturen nur mit geprüftem Admin-Verfahren und Backup migrieren; anschließend alte Lesewege und Browser-Caches prüfen. Kein automatischer Migrationslauf enthalten.
5. App Check, IAM für das Backend, Fehler-/Kostenbegrenzung, Aufbewahrung und Löschung für einen späteren Echtdatenbetrieb gesondert festlegen.

Offizielle Grundlagen: [Callable-Funktionen](https://firebase.google.com/docs/functions/callable), [Regeltests mit Emulatoren](https://firebase.google.com/docs/rules/unit-tests), [Server-SDK und Regeln](https://firebase.google.com/docs/firestore/security/test-rules-emulator).

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for server-managed roles, assigned-driver reads, an office-only proof archive, and server-only completion writes. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
