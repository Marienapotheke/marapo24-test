# Fahreransicht, Eingabe und Straßenberechnung – vorbereitet am 21.10.2026

Noch nicht veröffentlicht. Keine produktive Migration und keine Änderungen produktiver Lieferungen für Entwicklung oder Tests. Maßgeblicher Live-Stand bleibt die zuvor freigegebene Kontenverwaltung.

## Vereinbartes Verhalten

- In der Fahreransicht stehen offene Stopps oben. Bestätigte und bereits lokal offline abgeschlossene Stopps rutschen darunter; Nichtzustellungen werden ebenfalls unter den noch offenen Stopps gezeigt. Innerhalb beider Gruppen bleibt die bisherige relative Reihenfolge erhalten. Eine noch nicht bestätigte Übertragung bleibt sichtbar und wird nicht als Serverbestätigung ausgegeben. Entfernte Stopps und zurückgenommene Nachweise behalten ihre bisherigen Schutzregeln.
- Die Gruppierung ist ausschließlich eine Darstellung. Die gespeicherte Route wird dadurch nicht umgeschrieben. Navigation und Verschiebeschaltflächen werden über die Stoppkennung zugeordnet, damit nach dem Gruppieren kein fremder Stopp verändert oder angesteuert wird.
- Bei mindestens zwei Päckchen erscheint das optionale Feld „Zweiter Name (optional, gleiche Adresse)“. Nach ausdrücklicher Betreiberentscheidung bleibt es ein gemeinsamer Stopp mit gemeinsamem Betrag und gemeinsamem Zustellnachweis. Bei einer privaten persönlichen Übergabe gibt es weiterhin eine gemeinsame Unterschrift; die vorhandenen Regeln für Arztlieferungen und andere Übergabearten bleiben unverändert.
- Beide Namen erscheinen in Fahrer-/Büroansicht, Zustelldialog, zugehörigen Korrektur-/Entfernungsdialogen und PDF. Die Tagessuche im Büro findet auch den zweiten Namen. Päckchenzahl und Betrag werden jeweils einmal gezählt.
- Der zweite Name gehört zur konkreten Lieferung und ihrem Nachweis. Er wird nicht mit dem primären Kundenprofil zusammengeführt oder automatisch bei einer anderen Lieferung übernommen. Bei Auswahl einer Kundenvorlage wird das Zusatzfeld geleert.
- Bei Reduzieren auf ein Päckchen oder Auswahl „Arzt“ wird ein bereits eingegebener zweiter Name nicht still gelöscht. Das Feld bleibt sichtbar; vor Speichern muss entweder die Päckchenzahl passend gewählt oder der zweite Name bewusst entfernt werden.

## Eingabefokus

Die bisherige Darstellung hat das gesamte Erfassungsformular bei jeder Aktualisierung innerhalb der Seite neu eingehängt, auch wenn es bereits am richtigen Ort stand. Dadurch kann ein Browser den Fokus und die Bildschirmtastatur verlieren. Das Formular wird jetzt nur bei einem tatsächlichen Wechsel zwischen Fahrer- und Büroansicht versetzt. Auch Tourenkatalog und Arbeitsbeginn werden nicht bei jeder Aktualisierung unnötig neu eingehängt. Normales Tippen, Tabulator und selbst gewählte Feldwechsel bleiben möglich.

Browserprüfungen fokussieren Name, Straße, PLZ, Ort, Telefon, Betrag, Lieferhinweis und zweiten Namen, setzen den Cursor und lösen eine normale Neudarstellung aus. Fokus, Wert und Cursorposition bleiben erhalten. Der Test läuft in der Büroansicht und auf dem simulierten mobilen Fahrergerät.

## Ergänzung: Sortierknopf reagiert scheinbar nicht

Betreiberbeobachtung: Der Knopf ist normal antippbar, aber es scheint nichts zu passieren. Im bisherigen Code standen Fortschritt und Fehler ausschließlich im globalen Meldungsbereich weit oben, nicht beim Sortierknopf. Außerdem wurden gleichwertige Straßenendungen wie „Neustr.“ und „Neustraße“ streng als verschieden behandelt und verhinderten dann die gesamte Berechnung.

Direkt beim Sortierknopf erscheint jetzt die Prüfung der jeweiligen Lieferadresse mit Fortschritt und anschließend die Straßenberechnung. Ein Fehler nennt dort die betreffende Adresse bzw. die nicht bestätigte Berechnung. Sperrgründe wie Offlinebetrieb, ausstehende Übertragungen oder weniger als zwei offene Stopps sind sichtbar. Eine erfolgreiche Berechnung bestätigt die neue Reihenfolge ausdrücklich. Falls die berechnete Reihenfolge unverändert ist, sagt die App das ebenfalls ausdrücklich. Ein Konto-/Sitzungswechsel während einer Berechnung überträgt keine alte Adressfehlermeldung in den neuen Zugang.

Die Adressprüfung vereinheitlicht ausschließlich die gleichwertigen Endungen `straße`, `strasse` und `str.`. Eine andere Straße, andere Postleitzahl, anderer Ort oder andere Hausnummer bleiben gesperrt. Der vorhandene EU-Endpunkt, die kostenlose Budgetgrenze, die Versions-/Adress-Snapshotprüfung und die strenge Prüfung vollständiger Anbieterantworten bleiben erhalten. Der erste offene Stopp bleibt der bisherige Ausgangspunkt; kein neuer Standortzugriff und keine Übermittlung von Namen oder Telefonnummern. Koordinatenreihenfolge und Job-Zuordnung entsprechen der [Geoapify-Dokumentation](https://apidocs.geoapify.com/docs/route-planner/).

Der komplette lokale Knopfablauf ist mit einem simulierten Anbieter geprüft: falscher Ort, unvollständige Antwort, erfolgreiche neue Reihenfolge und ausdrücklich unveränderte Reihenfolge. Außerdem wird „Neustr. 3“ gegen „Neustraße 3“ geprüft, bei weiterhin abgewiesenem falschem Ort, PLZ, Straße oder Hausnummer. Dies stellt die konkrete reale Fehlerfahrt noch nicht nach; dafür wurden keine produktiven Kundenadressen oder realen Providerantworten ausgelesen. Keine Behauptung, jede tatsächliche Fahrt unabhängig optimiert zu haben.

## Rückwärtskompatibilität und Prüfung

Der zweite Name ist ein optionales, auf 90 Zeichen begrenztes Feld im bestehenden Lieferungs-JSON. Alte Stopps und Nachweise benötigen es nicht. Ältere Bearbeitungsclients, die das Feld nicht kennen, erhalten es beim Speichern unverändert. Ein expliziter leerer Wert entfernt es nur bei einem weiterhin bearbeitbaren offenen Stopp vor Tourstart. Abgeschlossene Nachweise bleiben unveränderlich. Keine SQL-Migration, kein Wechsel der verschlüsselten Offline-Datenbank; Cachekennung und Bereitschaftskennung werden gemeinsam aktualisiert.

Fiktive Prüfungen decken stabile Reihenfolge einschließlich Offline-Abschluss, gemeinsame Päckchensumme/Geldbetrag, Validierung, alte Bearbeitungsclients, Kundenprofiltrennung und geschützten Nachweis ab. Der Browser prüft zusätzlich beide Namen, Eingabefokus, sofortiges Nach-unten-Rutschen im Funkloch, richtige Navigation nach dem Sortieren und Tagessuche nach dem zweiten Namen. Bestehende Offline-, Kassen-, Unterschrifts- und Korrekturabläufe werden mitgeprüft.

Vor Veröffentlichung: Betreiberfreigabe für dieses Paket, erfolgreiche GitHub-Gesamtprüfung, frische verschlüsselte Betriebssicherung mit isoliertem Restore-Test und anschließender Live-Datei-/Archivabgleich. main/v3 bleiben unverändert.
