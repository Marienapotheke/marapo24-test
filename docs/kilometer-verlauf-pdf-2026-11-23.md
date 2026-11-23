# Kilometerkorrektur, sichtbarer Verlauf und vereinfachtes Zustell-PDF

Stand: 23.11.2026. Vorbereitung im bestehenden Zweig `test-geschuetzte-zustellnachweise`; keine Veröffentlichung und keine produktive Migration.

## Vereinbarte Bedienung

- Zugewiesene Fahrer können **Startkilometer nur während der laufenden Tour** korrigieren.
- **Endkilometer können nach bestätigtem Tourende bis zur Abrechnung** korrigiert werden. Auch eine unterschriebene Null-Abrechnung sperrt weitere Änderungen.
- Jede Korrektur braucht einen nachvollziehbaren Grund. Ganze Kilometer von 0 bis 9.999.999; Endkilometer dürfen nicht unter dem gültigen Start liegen. Historische fehlende Kilometer werden nicht erfunden.
- Schaltfläche bei den Tourdaten: „Startkilometer korrigieren“ beziehungsweise „Endkilometer korrigieren“. Bestätigte Internetverbindung und vorherige Übertragung ausstehender Tourvorgänge erforderlich, wie bei bisherigen Betragskorrekturen. Keine Kilometer bei Mitarbeiter-Mitnahme.
- „Kilometer-Korrekturverlauf“ direkt bei der Tour in Fahrer- und Büroansicht: alter und neuer Wert, Fahrer, Speicherzeitpunkt und Pflichtgrund. Die gefahrene Strecke verwendet die gültigen Werte.
- Vorhandene Päckchenänderungen erscheinen beim Kunden in der Büroansicht unter „Korrekturverlauf“, auch vor einem Zustellabschluss: geänderte Felder, vorheriger/neuer Wert, Name, Zeitpunkt und bereits erfasste Gründe. Frühere nicht erhobene Gründe werden nicht nachträglich erfunden. Bestehende Geldkorrekturen und Rücknahmen bleiben dort ebenfalls sichtbar. Kein PDF erforderlich.
- Geöffnete Korrekturverläufe bleiben bei Hintergrundaktualisierungen aufgeklappt; beim Abmelden wird der Ansichtsstatus verworfen.

## Zustell-PDF

Kundenname, gegebenenfalls zweiter Name, Adresse, vorhandene Telefonnummer, Herkunftsapotheke, Status, Päckchenzahl außer bei Arztlieferungen, ursprünglicher Zustell-/Versuchszeitpunkt, Zahlungsangaben und Unterschrift bleiben. Lieferhinweis und Fahrerkommentar erscheinen nur mit Inhalt. Nachbar/Ablageort nur bei passender Übergabeart und tatsächlicher Angabe. Briefkastenzustellung bleibt als solche erkennbar. Leere Angaben, Lieferungs-/Tourkennungen, Server-Archivzeitpunkt sowie Signatur-/Foto-Hashes entfallen. Ein vorhandenes Ablagefoto bleibt verfügbar. Abrechnungs- und Entfernungs-PDFs bleiben unverändert.

Das PDF zeigt die ursprünglich archivierten Daten und die zugehörige ursprüngliche Unterschrift. Nachträgliche Änderungen werden nicht mit dieser Unterschrift als neu bestätigt dargestellt. Statt ausführlicher Korrekturfolgenderseiten steht bei nachträglichen Korrekturen ein kurzer Hinweis auf den App-Verlauf; zurückgenommene Originale sind deutlich ungültig gekennzeichnet. Keine gespeicherten Nachweise oder früher heruntergeladenen PDFs werden verändert.

## Datensicherheit und Migration

`cloudflare/tour-odometer.sql` ist eine **separate, einmalig anzuwendende additive Migration**. Neue Tabelle `tour_odometer_corrections` mit ursprünglichem Touralter als Aufbewahrungsbeginn; keine Änderung vorhandener Tour-/Nachweiszeilen. Einfügeschutz prüft aktive Fahrerberechtigung, aktuelle Zuordnung, Tourstatus, Abrechnungssperre, vorherigen Wert und Revision atomar. Änderungs-/Löschschutz schützt den Verlauf; ein zusätzlicher Tourendeschutz verhindert auch bei konkurrierenden Anfragen einen Endstand unter korrigiertem Start. Änderungen machen alte Übergabeangebote ungültig. Bestehende Archivschutzregeln werden nicht ersetzt.

Start-/Endkennung, Fingerprint, Geräte-/Serverzeit und Rohkilometer bleiben beim Original. Wiederholte identische Korrekturen erzeugen keine zweite Änderung, auch nach verlorener Bestätigung oder späterer Abrechnung. Parallele Korrekturen derselben Revision können nicht beide gewinnen. Fahrer können keine fremden Touren ändern; Bürozugänge sehen den Verlauf, erhalten darüber keine Fahrerrechte.

Bestehende verschlüsselte Offline-Datenbank und Warteschlangen bleiben unverändert. Neue vollständige Offline-App-Version `odometer-20261123` enthält auch die neuen Anzeige-/PDF-Module. Der Aufbewahrungsjob entfernt Kilometerkorrekturen nach der bestehenden 364-Tage-Frist atomar mit Wiederherstellung der Löschsperre. Sicherungsprüfung erkennt fehlende neue Schutzregeln; ältere Sicherungen ohne neue Tabelle bleiben unterstützt. D1-EU, Schlüssel, Retention-Zeitplan und Zugänge werden nicht geändert.

## Prüfung und Veröffentlichung

Lokal erfolgreich: **182 Prüfungen** (36 Grundprüfungen, 119 Cloudflare-Backend-/PDFprüfungen, 22 Sicherungs-/Restore-/Retentionsprüfungen und fünf Browserabläufe). Neue Prüfungen decken getrennte Kilometer-Zeitfenster, Pflichtgrund, falsche Rollen/Zuordnung, ungültige Werte, exakte Wiederholung auch nach Abrechnung, verlorene Bestätigung, konkurrierende Korrekturen/Tourende, unveränderte Originale, Büroverlauf und Maskierung von HTML ab. Verschlüsselte Wiederherstellung enthält neue Tabelle, Originalkilometer und Schutzregeln; Aufbewahrung richtet sich nach ursprünglichem Touralter. Das vereinfachte PDF wurde mit fiktiven Standard-/Nachbar-/Nichtzustell-/Korrektur-/Langtextbeispielen gerendert und visuell geprüft. Eine vorübergehende OneDrive-Dateisperre und die fehlende Standard-Browserpfadangabe wurden durch erneuten Lauf mit dem vorhandenen lokalen Testbrowser aufgelöst.

Nur fiktive Daten für lokale Backend-, Browser-, PDF- und verschlüsselte Restore-Prüfungen. Das vom Betreiber bereitgestellte echte PDF wurde ausschließlich lesend zur Layoutanalyse verwendet; Kundendaten und Unterschrift werden nicht in Testdaten oder ins Repository übernommen.

Die 22 öffentlichen Dateien der Live-App wurden lesend bytegenau gegen das veröffentlichte Paket vom 18.11. geprüft. Referenz-Worker: `f095d154-e9ce-4788-9b4b-f25c380b39b8`. Kein produktiver Kundendatenabruf für diese Vorbereitung.

Vor einer Veröffentlichung erforderlich: ausdrückliche Betreiberfreigabe einschließlich neuer Verlaufstabelle/Schutzregeln, frische verschlüsselte Betriebssicherung und erfolgreicher isolierter Restore-Test; Migration zunächst auf isolierter Wiederherstellung prüfen. Danach Migration einmalig und getestetes Programm veröffentlichen, öffentliche Dateien/geschützte APIs, EU/Bindings/Retention sowie unveränderte Originalarchive prüfen und abschließende verschlüsselte Sicherung mit Restore durchführen. `main` und v3 bleiben unverändert; kein Merge.
