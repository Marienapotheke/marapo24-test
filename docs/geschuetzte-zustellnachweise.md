# MARAPO24 – geschützte Zustellnachweise (Entwurf, nur Test)

Status: Architekturentwurf. **Nicht produktiv, nicht aktiviert.** Hauptzweig `main` und Firebase-Regeln unverändert. Nur fiktive Daten.

## Ziel
- Fahrer erfasst eine Unterschrift einmalig beim Abschluss.
- Nur das Büro kann die gespeicherte Unterschrift / den PDF-Nachweis später lesen.
- Fahrer kann fertige Nachweise weder lesen noch ändern.

## Sicherheitsproblem im aktuellen Stand
Derzeit enthält `/tours/{tourId}/stops/{stopId}` das Feld `signature`. Fahrer haben Lesezugriff auf ihre Stopps. Ein ausgeblendeter Button verhindert den Datenabruf **nicht**.

## Erforderliche Architektur
1. Stop-Dokumente bleiben für zugewiesene Fahrer lesbar, enthalten künftig **keine Signaturbytes** und keine geschützten Nachweisdaten.
2. Separates, ausschließlich vom Büro lesbares Archiv, z. B. `/deliveryProofs/{proofId}`, mit `tourId`, `stopId`, `completedAt`, Signatur, Erstellzeitpunkt und Integritätsmetadaten. Schreibzugriff vom Browser für Fahrer **verboten**.
3. Vertrauenswürdige serverseitige Abschlussfunktion (Firebase Cloud Function / Cloud Run) mit Auth-Prüfung: Fahrer-ID, Tourzuweisung, offener Stopp, erlaubter Status, Signaturformat/-größe und atomare Speicherung von Abschlussstatus plus Nachweis. Verhindert, dass ein Fahrer das Büro-Archiv direkt schreiben oder alte Nachweise ändern kann.
4. Büro lädt Nachweise ausschließlich mit Authentifizierung und serverseitig erzwungener Büro-Berechtigung; PDF-Erstellung erst nach autorisiertem Abruf.
5. Migration vorhandener Testsignaturen aus den Stop-Dokumenten ins Archiv; erst nach Prüfung und Backup alte `signature`-Felder entfernen. Migration über Admin SDK mit kontrollierten Berechtigungen, nicht über öffentlichen Browser.
6. Aufbewahrungs- und Löschkonzept einschließlich Backups, Protokollierung, Datenschutzprüfung und Integritätsschutz **vor** Echtdatenbetrieb festlegen.

## Beispielregeln (NICHT deployen; nur Schemaidee)
```firestore
match /deliveryProofs/{proofId} {
  allow get, list: if office();
  allow create, update, delete: if false;
}
```
**Achtung:** Diese Regeln allein genügen nicht. Die derzeitige Fahrer-Schreibregel und die Pflichtfelder für `signature` müssen mit der serverseitigen Abschlussfunktion koordiniert umgestellt werden. Bestehende Regeln nicht isoliert ersetzen.

## Nächster technischer Schritt
Cloud-Functions-Umgebung und Deployment-Zugriff prüfen, dann Backend-Funktion, Firestore-Regeln, Frontend und Migration in einer Testumgebung gemeinsam implementieren und mit beiden Testkonten verifizieren. Ohne Backend-Deployment keine sichere Trennung.
