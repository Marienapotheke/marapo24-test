# MARAPO24 – Ablauf bis zur Betriebsfreigabe

Aktueller Stand der kostenlosen veröffentlichten Variante: [Betriebsvorbereitung](betrieb-vorbereitung.md). Die folgenden Firebase-Aktivierungsschritte beschreiben die weiterhin getrennte alternative Functions-Variante.

## Bereitstehender Umfang
11 Fahrer, bis zu 20 Büro-Konten, Fahrzeuge, Tourstart und Tourende, Zustellabschluss mit geschützter Unterschrift, ausschließlich Büro-PDF und verschlüsselte Offline-Warteschlange.
Der Branch und Draft-PR enthalten die Umsetzung. Die App ist noch nicht bereitgestellt; aktuelle Beispieldaten und Tests bleiben fiktiv.

## Nächste ausdrücklich freizugebende Aktion
Ein isolierter interner Probelauf im vorhandenen Firebase-Testprojekt: separate Datenbank `protected-deliveries`, separates Hosting-Ziel `protected-app`, Backend-Codebase `protected-proofs` und eigener Backend-Verschlüsselungsschlüssel. Die vorhandene v3 und Standarddatenbank bleiben erhalten. Es erfolgt kein Merge nach main.
Cloud Functions benötigen den Blaze-Tarif. Die Abrechnung ist derzeit nicht aktiviert. Eine Freigabe muss Kosten, Zielressourcen und interne Testbereitstellung ausdrücklich umfassen; Zahlungsmittel oder Vertragsbestätigungen werden vom Kontoinhaber vorgenommen. Es wurde nichts kostenpflichtig aktiviert.

## Technische Aktivierung nach Freigabe
1. Erfolgreiche vollständige Tests desselben Codes, einschließlich Browser-Neustart ohne Netz.
2. Abrechnungsrahmen und Budgetbenachrichtigung festlegen; API-Aktivierung kontrollieren. Ein Budgethinweis allein ist keine automatische Kostenobergrenze.
3. Named-Datenbank Standard/eu und separate Hosting-Site anlegen, feste Zuordnung zum Hosting-Ziel prüfen.
4. Separates Backend-Servicekonto mit benötigten Rechten auf die Zielressourcen konfigurieren. Private Schlüssel ausschließlich in Secret Manager, keine Schlüssel in Git oder Browser.
5. Web-App/App Check mit korrektem Hosting-Ursprung einrichten. Funktionen erzwingen App Check. Keine globale Firestore-Erzwingung, solange v3 ohne App Check weiterläuft.
6. Erst nach Bestandsprüfung und bestätigtem Ziel Backend, neue Datenbankregeln und getrennte App bereitstellen. Standarddatenbank-Regeln unverändert lassen.
7. Mit fiktiven Mitarbeiterkonten Geräteprüfung: Büro, zwei verschiedene Fahrer, Rollenentzug, Funkloch, App-Neustart, Wiederholungsübertragung, Start-/Endzeiten, Fahrzeug und Büro-PDF.
8. Sicherung und tatsächliche Wiederherstellung in einem isolierten Ziel üben; Zuständigkeit bei Fehlern und Geräteverlust dokumentieren.

## Noch benötigte Betriebsentscheidungen
- Mitarbeiterliste mit 11 Fahrer- und bis zu 20 Büro-Adressen/Namen; pro Person eigene Zugangsdaten und passende Rechte. Konten werden nicht anhand einer geratenen Mitarbeiterliste erzeugt. Büro-Zugriff auf sämtliche Nachweise muss für die benannten Personen tatsächlich gewollt sein.
- Fahrzeugliste mit Kennzeichen oder interner Bezeichnung. Sie kann nach Aktivierung im Büro eingegeben werden.
- Verantwortlicher für Kundendaten, Aufbewahrungsdauer und Löschverfahren für Lieferdaten und Signaturen; Umgang mit Anfragen und fehlerhaften Nachweisen. Es wurde keine rechtliche Aufbewahrungsfrist erfunden und kein automatischer Löschlauf aktiviert.
- Datenverarbeitung/Vertrag mit Google, zulässige Datenstandorte und Geräteschutz prüfen. Firebase-Nutzung allein ersetzt keine betriebliche Datenschutzprüfung.
- Störungsweg für nicht übertragene Nachweise, gesperrte Fahrer und defekte/verlorene Geräte; Offline-Grenzen 12-Stunden-Cache, 48-Stunden-Übertragung und 200 ausstehende Vorgänge berücksichtigen.

## Freigabe für echte Lieferungen
Erst nach abgeschlossenem internen Geräteprobelauf, erfolgreicher Sicherungs-/Wiederherstellungsprüfung, bestätigten Datenschutz-/Aufbewahrungsregeln und ausdrücklicher Freigabe für echte Kundendaten. Die sichtbare Testkennzeichnung bleibt bis dahin aktiv. Für einen dauerhaften Produktivbetrieb ist ein separates Produktionsprojekt zu entscheiden, damit Authentifizierung, Abrechnung und Schutzmaßnahmen unabhängig vom alten Testprojekt verwaltet werden können.

Quelle: [Firebase-Funktionen benötigen Blaze](https://firebase.google.com/docs/functions/get-started), [Firebase-Datenschutz](https://firebase.google.com/support/privacy).
