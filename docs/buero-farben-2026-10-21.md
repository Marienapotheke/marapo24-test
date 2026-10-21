# Büroansicht und Unterschriften – Vorbereitung 21.10.2026

Status: ausschließlich lokal vorbereitet und mit fiktiven Daten geprüft. Kein Deployment, keine produktive Migration und kein Zugriff auf produktive Kundeninhalte für diese Änderung. Der freigegebene Betriebsstand vom 19.10.2026 bleibt maßgeblich.

## Vereinbarte Darstellung

- Marienapotheke blau, Cusanus-Apotheke violett: Kundenkarten, Geldbeträge und getrennte Kassensummen. Tatsächlich kassierte Beträge bekommen eine zusätzliche dunkle Akzentfarbe innerhalb der jeweiligen Apothekenfarbe. PDF-Ausgaben übernehmen die Unterscheidung bei Apotheke, kassierten Beträgen und offenen Zahlungen.
- Nicht zugestellt: orange Statusschrift, hellere Kundenkarte; kein orangefarbener Rahmen. Text bleibt zusätzlich zur Farbe sichtbar.
- Büro-Touren lassen sich über ihre Überschrift einklappen. Bezeichnung, Datum und Tourstatus bleiben sichtbar. Der Zustand bleibt bei Aktualisierungen derselben Sitzung erhalten. Die Namenssuche öffnet passende Touren vorübergehend; die vorherige Klappwahl bleibt erhalten. Nach Abmeldung wird die Klappwahl verworfen.
- Nach Tourende werden nur aktuelle Kunden mit einem Geldbetrag nach Marien/Cusanus und darin alphabetisch dargestellt. Nullbeträge und historische/entfernte Einträge bleiben darunter als „Weitere Päckchen und Verlauf“ erreichbar. Fahrerreihenfolge und gespeicherte Daten bleiben unverändert.
- „Überweist“ ist ein zusätzlicher Grund bei nicht vollständig kassierter Zustellung, auch bei einer zulässigen Betragskorrektur. Kein automatischer Zahlungseingang und keine Ausbuchung. Teilzahlungen bleiben getrennt vom offenen Rest. Grund und offener Rest erscheinen fett/rot. Nach Tourende kennzeichnet die Büroansicht aktuelle Einträge mit noch offenem Betrag zusätzlich rot. Entfernte/zurückgenommene Originale zählen nicht als offene Forderung der Tour.
- Zustell- und Abrechnungsdialog haben „Unterschrift im Vollbild“. Die große Fläche zeigt den betreffenden Kunden bzw. Tourbetrag. Querhalten ist möglich; Größenwechsel bewahren die gezeichneten Striche. „Übernehmen“ überträgt proportional und ohne große Leerflächen in das bestehende begrenzte PNG-Format. „Zurück“ verwirft ausschließlich die Vollbildänderung. Arzt-/Briefkasten-/Nichtzustellungsabläufe behalten ihre bisherigen Regeln. Abmeldung leert auch die Vollbildfläche.

## Schutz und Prüfung

Keine Schemaänderung. Keine Änderung der verschlüsselten Offline-Datenbank oder ihres Produktionsnamens. Alte Warteschlangeneinträge und bestehende Nachweise bleiben kompatibel. Die neuen Präsentationsmodule sind Teil des Offline-Pakets; Cacheversion und Bereitschaftskennung werden gemeinsam aktualisiert. Die serverseitige Zahlungsprüfung akzeptiert den neuen Grund, sperrt aber widersprüchliche Zahlungen weiterhin.

Lokale Prüfungen: 36 Grundprüfungen, 84 Cloudflare-Backendprüfungen einschließlich zwei neuer Prüfungen zu Gruppierung/Zahlungsgrund, 16 Sicherungs-/Aufbewahrungsprüfungen und vier Cloudflare-Browserabläufe. PDF-/Abrechnungsprüfungen zusätzlich nach der PDF-Anpassung wiederholt. Browser prüfen beide Vollbild-Unterschriften, Größenwechsel, geschützte Archivierung, Klappen/Suche, rote Forderungsanzeige, orange Nichtzustellung und bestehende Offline-Synchronisation mit fiktiven Daten.

Vor Veröffentlichung: konkrete Betreiberfreigabe für dieses Paket, erfolgreiche GitHub-Gesamtprüfung, frische verschlüsselte Betriebssicherung mit isoliertem Restore-Test und anschließender Abgleich des veröffentlichten Pakets. main/v3 bleiben unverändert. Noch keine Freigabe für diese neue Veröffentlichung dokumentiert.
