# Büro- und Scan-Erweiterung vom 16.10.2026

## Freigabe und tatsächlicher Stand

Der Betreiber hat am 16.10.2026 ausdrücklich erklärt: „gut update ist von mir freigegeben“. Diese Freigabe gilt für das in diesem Chat vorbereitete Gesamtupdate einschließlich der vorangegangenen Praxistest-Änderungen. Sie wird nicht als bereits erfolgte Veröffentlichung dokumentiert.

Alle Änderungen befinden sich lokal im bestehenden Branch `test-geschuetzte-zustellnachweise`, aufbauend auf `08ba1cec83cb5bf2d2fa01a0d7dc1c5998a627c2`. `main`, die frühere Firebase/v3-Anwendung und Firestore-Regeln bleiben unverändert. Die ursprüngliche Betriebsfreigabe in `docs/echtdatenfreigabe.md` wurde gelesen und unverändert erhalten.

Die laufende App wurde ausschließlich über öffentliche Dateien und unangemeldete Zugriffssperren geprüft. Auch ihre öffentliche App-Konfiguration wurde lesend abgerufen: Produktionsmodus, Cloudflare-Backend, Enterprise App Check und bestehendes Firebase-Projekt bestätigt. Die öffentliche Site-Key-Konfiguration ist kein Backend-Geheimnis. Keine Anmeldung mit fremden Mitarbeiterkonten, keine Live-Kunden-/Tourdaten gelesen, keine produktive Migration, kein Deployment und kein Push durchgeführt.

Die zunächst fehlenden technischen Voraussetzungen wurden am 16.10.2026 hergestellt: Betreiber hat die lokale Cloudflare-Anmeldung selbst bestätigt und den bestehenden Sicherungsschlüssel mit der vorhandenen Offline-Hilfe wiederhergestellt. Der Schlüssel passt zu den bisherigen Betriebssicherungen; keine Schlüssel ersetzt oder erneuert. Aktuelle Worker-Bindung zur bestehenden Datenbank `marapo24-botendienst`, Datenstandort `eu`, Region `EEUR`, bisherige Variablen, Geheimnisnamen und stündlicher Aufbewahrungszeitplan wurden lesend bestätigt. Private Konfiguration und Schlüssel bleiben ausschließlich in ignorierten lokalen Dateien.

Frische verschlüsselte Betriebs- und Geheimnissicherung auf S1 am 16.10.2026 um 11:09 Uhr (Europe/Berlin), isolierte Wiederherstellung erfolgreich: Integrität, Fremdschlüssel und alle Zustell-/Abrechnungsschutztrigger geprüft. Die kontrollierte Migration wurde zusätzlich zweimal ausschließlich auf dieser getrennten Wiederherstellung simuliert; Bestandsdaten in Benutzern, Touren, Stopps und beiden Nachweisarchiven bytegleich erhalten. Keine Sicherung gelöscht (zehn geprüft, keine abgelaufen). Diese Prüfung verändert keine Live-Daten. Veröffentlichung folgt erst nach abschließenden Prüfungen.

## Bürokräfte nehmen selbst Lieferungen mit

Unter „Neue Tour anlegen“ gibt es die Auswahl „Selbst mitnehmen – mit meinem Bürozugang“. Die Tour wird für heute angelegt und der angemeldeten Person zugeordnet. Anschließend öffnet „Meine Mitnahme-Touren“ dieselben Erfassungs-, Zahlungs-, Unterschriften- und Tourfunktionen wie bei einer regulären Auslieferung. Keine zusätzliche Fahrerrolle und keine zusätzliche Fahrer-PIN erforderlich. Aktive Bürokräfte können weiterhin Touren für reguläre Fahrer vorbereiten.

Die Berechtigung ist auf eigene Mitnahme-Touren beschränkt: Bürokräfte können dadurch keine beliebige reguläre Tour als Fahrer übernehmen oder für andere Personen Zustellungen abschließen. Serverseitige Benutzerprüfung und Datenbank-Einfügeschutz kontrollieren die Zuordnung. Frühere Mitarbeiterrollen werden nicht geändert. Vor Tourstart können berechtigte Bürokräfte Stopps bearbeiten; nach Tourstart gelten die bestehenden Sperren, und ausschließlich die zugewiesene Person kann weitere dringende Stopps ergänzen. Fahrzeug, Kilometer und Tourstart/-ende bleiben erforderlich.

Die vorhandene verschlüsselte Offline-Warteschlange wird auch für Mitnahme-Touren genutzt. Ein Neustart im Funkloch stellt ausschließlich die zuvor geladenen eigenen Mitnahme-Touren wieder her; die allgemeine Büroübersicht wird dafür nicht offline gespeichert. Nach einer bewussten Abmeldung gelten weiterhin die vorhandenen Cache-Lösch- und Warteschlangenregeln.

## Fahreranmeldung ohne vorherige Gerätebestätigung

Fahrernamen und persönliche PIN-Anmeldung funktionieren ohne administrative Gerätefreigabe. Die Oberfläche bietet keine Gerätefreigabe mehr an. Persönliche PINs, App Check, Rate-Limits, gesperrte Mitarbeiterkonten und fehlende Bürorechte der PIN-Sitzungen bleiben geschützt.

Nach erfolgreicher PIN-Prüfung wird automatisch ein technischer Browserbezug erzeugt. Das ist keine Betreiberfreigabe: Zwei frische Browser können sich direkt mit einer gültigen PIN anmelden. Der automatisch ausgestellte Browsercookie bindet weiterhin die Sitzung; ein Sitzungscookie allein genügt nicht. Vorhandene technische Gerätetabellen und alte administrative Endpunkte bleiben zur Kompatibilität erhalten, begründen aber keine Pflicht zur Gerätefreigabe für neue Anmeldungen. Eine alte administrativ gesperrte Browserkennung verhindert keine erneute Anmeldung mit gültiger persönlicher PIN.

## Büroabrechnung am Folgetag

Jeder aktive Bürozugang sieht bei einer serverseitig beendeten Tour „Abrechnung offen“ und kann die Marienapotheken-Abrechnung dort mit eigener Unterschrift durchführen, auch bei einem früheren Tourdatum und ohne Anwesenheit oder aktive Anmeldung des Fahrers. Name und Identität stammen dabei verbindlich aus dem angemeldeten Bürozugang. Der tatsächliche Auslieferer bleibt separat erhalten.

Der Server berechnet den Marienapotheken-Betrag weiter aus archivierten Zustellnachweisen. Clientwerte ersetzen diese Berechnung nicht. Offene Stopps und unbestätigtes Tourende schließen die Abrechnung aus. Parallele Abrechnungen erzeugen genau einen unveränderlichen Nachweis; identische Wiederholungen bleiben möglich. Die bisherige Unterschriftenerfassung auf dem Fahrergerät bleibt für Kompatibilität erhalten und wird weiterhin ausdrücklich als manuelle Namenseingabe gekennzeichnet. Cusanus-Beträge bleiben getrennt und werden wie bisher nicht in den Marienapotheken-Abrechnungsnachweis eingerechnet.

Nach Abrechnung sehen Bürokräfte Namen, Zeitpunkt, PDF und über „Unterschrift ansehen“ die geschützte Unterschrift. Die Bildansicht wird beim Schließen oder Kontowechsel entfernt. Fahrer erhalten weiterhin keinen Downloadzugang zum Abrechnungsarchiv.

## Namenssuche

Die Büroübersicht hat oberhalb der Fahrten ein Suchfeld mit Lupensymbol. Es filtert Kundennamen innerhalb des ausgewählten Tages, ohne Groß-/Kleinschreibung zu beachten. Andere Tage und Adressfelder werden nicht durchsucht. Trefferzahl wird angezeigt. Tourkasse und Päckchengesamtzahl bleiben Gesamtsummen der jeweiligen Tour, auch wenn die Suche nur einzelne Stopps zeigt. Es werden keine Suchanfragen oder Kundenlisten in zusätzlichen Serverarchiven gespeichert.

## Mobiler Kamerascan

„Botendienstzettel scannen“ erscheint nur auf erkannten Smartphones und Tablets; unter Windows/Desktop-PCs wird das Bedienelement nicht erzeugt. Kamera oder Fotoauswahl startet ausschließlich nach Betätigung. `capture="environment"` bittet den Browser um die rückseitige Kamera; das konkrete Auswahlfenster entscheidet das Mobilbetriebssystem.

Gedruckter Text wird mit fest gepinntem Tesseract.js 7.0.0 und lokal ausgeliefertem deutschem Sprachmodell erkannt. Bibliothek, Worker und Kernmodule kommen ausschließlich vom eigenen App-Ursprung. Foto und OCR-Text werden weder an einen OCR-Anbieter noch an den App-Server übertragen. Foto und Arbeitsspeicher werden nach Verarbeitung/Abbruch freigegeben, der Worker beendet und die Dialogfelder nach Übernahme/Abmeldung geleert. Nur die anschließend bewusst gespeicherten Formularfelder werden als normaler Lieferstopp übertragen. Es werden keine Fotos als Nachweis archiviert.

Vorschläge: Name, Straße/Hausnummer, PLZ/Ort, Telefon, Herkunftsapotheke, Restbetrag und Zahlungsgrund. „Faktura/auf Rechnung“, ausdrücklich bar bezahlt und ausdrücklich EC bezahlt werden unterschieden. Allein „Bar“, „EC“ oder eine Rechnungsnummer führen nicht zur automatischen Nullsetzung. Mehrere mögliche Apotheken, mehrere Beträge und widersprüchliche Bezahlt-/Betragsangaben bleiben offen. Ein positiver Restbetrag neben einem Bezahlt-/Faktura-Vermerk verlangt manuelle Klärung.

Vor der Übernahme müssen die Angaben geprüft und ausdrücklich bestätigt werden. Fehlende Pflichtfelder oder widersprüchliche Zahlungseingaben verhindern die Übernahme. Die Funktion speichert niemals selbsttätig einen Lieferstopp. Neue Lieferhinweise werden nicht aus vorherigen Formularen übernommen. Päckchenzahl und Empfängerart sind anschließend gesondert zu prüfen. Pflege-/Partner-Nullbeträge haben unabhängig von Scanvorschlägen weiter Vorrang.

Der Scan lädt beim ersten Einsatz zusätzliche Software/Sprachdaten; verlässliche Offline-Scanverfügbarkeit wird nicht zugesagt. Manuelle Erfassung funktioniert weiter. OCR-Assets insgesamt rund 27 MB, größtes einzelnes Asset unter 5 MB. Sie gehören nicht zum verpflichtenden Offline-Vorladen der normalen App. Tests verwenden einen synthetischen gedruckten Zettel; echte Drucklayouts, Kameraqualität, Handschrift und jedes Mobilmodell sind damit nicht zertifiziert. Eine fiktive Vorlage des tatsächlich eingesetzten Zettels wäre für weitere Layoutanpassung hilfreich.

## Vorbereitete Datenbankänderung

`cloudflare/office-workflow.sql` legt ausschließlich die neue Zuordnungstabelle `self_delivery_tours` an und aktualisiert die zwei Einfügeschutztrigger für neue Zustell- und Abrechnungsnachweise. Bestehende Nachweise, Zahlungswerte, Signaturen sowie deren Änderungs-/Löschschutz werden nicht angefasst. Die Zuordnungstabelle wird bei regulärer fristgerechter Tourlöschung per Fremdschlüssel mit bereinigt. Fristen von höchstens 364 Tagen im Betrieb und höchstens 30 Tagen für Sicherungen werden nicht verlängert.

Die Migration wurde nur in lokalen fiktiven Beständen ausgeführt, einschließlich zweimaliger Anwendung. Sie muss vor Nutzung des neuen Workers im echten Betrieb kontrolliert angewendet werden. Die bestehende Kundenhinweis-Bereinigung und frühere produktive Migrationen werden nicht blind erneut ausgeführt. Eine Wiederherstellung des alten Worker-Codes allein ist kein Daten-Rollback: Mitnahme-Touren und neue Abrechnungsidentitäten benötigen den neuen Berechtigungspfad. Ein Rückfallplan muss diese bereits erfassten neuen Vorgänge berücksichtigen.

## Prüfung

Der lokale Bestand enthält die bisherigen Praxistest-Erweiterungen und neue Tests für Mitnahme ohne Fahrerrolle/PIN, fremde Touren, reguläre Tourübernahme, serverseitige Geldsummen, authentifizierte Folgetagsabrechnung, Parallelität, Archivschutz, Kundenname-Suche, Zahlungsparser, Geräteunterscheidung und frische Browser ohne Gerätefreigabe.

Zusätzlich zu den Backend-/Policy-/Backup-Tests laufen zwei Browserprüfungen: bisheriger kompletter Fahrer-/Offline-Ablauf und neuer Desktop-/Mobil-Ablauf mit echter lokaler Texterkennung eines fiktiven gedruckten Zettels, Übernahmevorschau, Desktop-Ausblendung, Offline-Mitnahme samt Neustart, Folgetagsansicht, Suche, Büroabrechnung und Unterschriftenansicht. Netzwerkprüfung bestätigt ausschließlich eigene OCR-Ressourcen. Die fiktiven Masken wurden visuell geprüft.

Ein eigener verschlüsselter Restore-Test bestätigt unveränderte historische Nachweisbytes, Integrität, Fremdschlüssel, Mitnahmezuordnung und alle bestehenden unveränderlichen Zustell-/Abrechnungsarchive nach Anwendung der Büromigration. Diese synthetischen Tests ersetzen die noch erforderliche frische Sicherung der wirklichen Betriebsdaten nicht. Die separate Firebase/v3-Emulatorprüfung wurde lokal nicht erneut ausgeführt; ihr Code bleibt unverändert.

## Verbleibender Veröffentlichungsschritt

Die Betreiberzustimmung liegt bereits vor. Noch erforderlich sind die Anmeldung im vorhandenen Cloudflare-Konto, die bestätigte produktive Worker-/D1-Konfiguration einschließlich EU-Bindung sowie der vorhandene lokale Sicherungsschlüssel. Anschließend frischen verschlüsselten Export erstellen und isoliert wiederherstellen, Integrität/Fremdschlüssel/Archivschutz prüfen, kontrollierte Migration und Deployment durchführen und danach öffentliche Dateien und Zugriffssperren erneut abgleichen. Keine neue Live-Datenbank, kein Ersatzschlüssel und keine Rückschaltung auf Testbestände.

Die beim Betreiber vorhandene lokale Wiederherstellungshilfe erzeugt nach Eingabe des getrennt aufbewahrten Kennworts `marapo24-recovery-key.json`. Kennwort und Schlüssel gehören nicht in Chat, Git oder den gemeinsamen Server-Sicherungsordner. Ein Cloudflare-Dashboard-Login allein ersetzt noch nicht die lokale OAuth-Anmeldung des Veröffentlichungsprogramms. Weiteres Vorgehen erfordert keine erneute pauschale Betreiberfreigabe, sondern diese technischen Voraussetzungen.
