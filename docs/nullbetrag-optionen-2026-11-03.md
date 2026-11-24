# Zahlungsgrund nur bei 0 € – veröffentlicht am 03.11.2026

Nach ausdrücklicher Betreiberfreigabe veröffentlicht. Ausgangspunkt war die freigegebene Worker-Version f1708c87-551e-4f9c-b83b-30c62dc8f7f1.

Bei der Päckcheneingabe und Bearbeitung wird „Bei 0 €: Zahlungsgrund“ ausschließlich für einen gültigen Nullbetrag angezeigt und aktiviert. 0, 0,00 und 0.00 werden mit der bestehenden Euro-Prüfung erkannt. Bei positiven, leeren oder ungültigen Eingaben bleibt die Auswahl verborgen und deaktiviert. Die Aktualisierung erfolgt direkt bei der Eingabe ohne Neuzeichnen des Formulars oder Fokuswechsel. Pflegeeinrichtungen und Partnerapotheken behalten die bisherigen ausgeblendeten Betragsfelder.

Beim Speichern wird der Null-Euro-Zahlungsgrund nur bei einem Nullbetrag übertragen. Ein zuvor ausgewählter Grund wird für einen positiven Betrag nicht mitgespeichert. Vorhandene Datensätze und Nachweise werden nicht automatisch geändert. Server, Datenbankschema, Offline-Warteschlangen und Verschlüsselung unverändert.

Der bestehende Browserablauf prüft gültige Nullschreibweisen, positive und leere/ungültige Zwischenwerte, unveränderten Fokus, Speichern ohne widersprüchlichen Null-Euro-Grund und Rücksetzen nach dem Speichern. Alle fünf Browserabläufe mit fiktiven Daten lokal erfolgreich. Live-Veröffentlichung nach eigener Betreiberfreigabe und frischer verschlüsselter Sicherung mit isoliertem Restore-Test erfolgreich abgeschlossen. main/v3 unverändert.

## Zahlungsgrund nur bei 0 € – 03.11.2026, aktueller Betriebsstand

Nach ausdrücklicher Betreiberfreigabe „ja“ veröffentlicht: Code `56b666e02bc70cf6165d9cc58373eff3e30ba0c4`; [GitHub-Prüfung 41660171616](https://github.com/Marienapotheke/marapo24-test/actions/runs/41660171616) erfolgreich mit 186 Prüfungen (36 Grundprüfungen, 17 Emulatorprüfungen, ein v3-Browserablauf, 108 Cloudflare-Backendprüfungen, 19 Sicherungs-/Restoreprüfungen und fünf Cloudflare-Browserabläufe). Worker-Version `0b52800b-d61c-4d1e-a4ba-1aab49d15170`.

Bei Päckcheneingabe und Bearbeitung erscheinen die Null-Euro-Zahlungsgründe nur bei gültigem Nullbetrag. Positive, leere und ungültige Eingaben verbergen und deaktivieren die Auswahl. Bei positivem Betrag wird kein zuvor gewählter Null-Euro-Grund übertragen. Die Eingabe behält den Fokus. Pflege- und Partnerstopps bleiben von der Betragserfassung ausgenommen. Details: [Nullbetrag-Optionen](nullbetrag-optionen-2026-11-03.md).

Verschlüsselte Betriebssicherungen auf S1 vor Veröffentlichung um 16:42 Uhr und danach um 16:43 Uhr (Europe/Berlin), beide isoliert erfolgreich wiederhergestellt und geprüft. Alle 991 ursprünglichen Zustellnachweise, 52 Abrechnungen, 9 Korrekturen und 2 Fahrerzuordnungsnachweise bytegenau unverändert. 22 öffentliche Dateien entsprechen den Paketprüfsummen; 19 unangemeldete API-Zugriffe gesperrt. Server und PDF-Modul bytegleich zum vorherigen Paket. Gesamtes Datenbankschema, Live-Einstellungen, Schlüsselbindungen, D1-EU und Aufbewahrungszeitplan unverändert. Keine produktive Migration oder Testdatensätze; main/v3 unverändert.

Nach Speichern laufender Eingaben ausstehende Vorgänge übertragen, alle MARAPO24-Fenster schließen und im WLAN neu öffnen. Browserdaten nicht löschen.
