# Abrechnung und Selbst-Mitnahme – veröffentlicht am 03.11.2026

## Ergänzung: Abrechnungsdialog erneut öffnen – 03.11.2026, aktueller Betriebsstand

Nach der Betreiberfreigabe und der Aufforderung „weiter“ veröffentlicht: Code `112f0da747c37d27adbcccca87fb8a26ce051bb4`, Worker-Version `009cb64e-2dde-4634-9d28-3d0c4f5ffac9`. [GitHub-Prüfung 41624126236](https://github.com/Marienapotheke/marapo24-test/actions/runs/41624126236) erfolgreich mit 186 Prüfungen (36 Grundprüfungen, 17 Emulatorprüfungen, ein v3-Browserablauf, 108 Cloudflare-Backendprüfungen, 19 Sicherungs-/Restoreprüfungen und fünf Cloudflare-Browserabläufe). Das konkrete Produktionspaket wurde zusätzlich isoliert geprüft.

Die unten dokumentierten Abrechnungs- und Selbst-Mitnahme-Änderungen bleiben enthalten. Zusätzlich werden nach Abbruch eines unbestätigten Speicherversuchs die Dialogfelder zurückgesetzt: Beim erneuten Öffnen ist der Name wieder leer und bearbeitbar. Der mobile Browserablauf prüft Verbindungsfehler, Abbruch, Wiederöffnung und anschließendes erfolgreiches Speichern. Gegenüber dem ersten heutigen Paket wurden nur die App-Datei und Paketdokumentation geändert; Server und PDF sind bytegleich.

Frische verschlüsselte Betriebssicherungen auf S1 vor Veröffentlichung um 15:31 Uhr und danach um 15:32 Uhr (Europe/Berlin), beide isoliert erfolgreich wiederhergestellt. Alle 990 ursprünglichen Zustellnachweise, 52 Abrechnungen, 9 Korrekturen und 2 Fahrerzuordnungsnachweise sind bytegenau unverändert. Alle 22 veröffentlichten Dateien stimmen mit dem geprüften Paket überein; 19 unangemeldete API-Zugriffe sind gesperrt. Datenbankschema, Live-Einstellungen, Schlüsselbindungen, D1-EU und Aufbewahrungszeitplan unverändert. Keine produktive Migration; main/v3 unverändert.

Nach Speichern laufender Eingaben ausstehende Vorgänge übertragen, alle MARAPO24-Fenster schließen und im WLAN neu öffnen. Browserdaten nicht löschen.

Nach ausdrücklicher Freigabe am 03.11. veröffentlicht. Ausgangspunkt war die zuvor freigegebene Live-Version `8f5def12-30a6-4ba1-b167-79d3bb3976ec`. Es werden ausschließlich fiktive Daten getestet; keine produktiven Touren, Nachweise oder Abrechnungen geändert und keine Migration ausgeführt.

## Bestätigte Regeln

- Die Abrechnungsunterschrift entfällt, wenn für Marienapotheke und Cusanus-Apotheke insgesamt 0 € tatsächlich kassiert wurden. Noch offene Kundenforderungen allein lösen keine Unterschrift aus. Entfernte und zurückgenommene Stopps zählen nicht. Fahrer- und Büroansicht zeigen keinen neuen Unterschriftsknopf; der Server nimmt ebenfalls keinen neuen Null-Kassen-Nachweis an.
- Nach ausdrücklicher Rückfrage bleibt die bisherige Marien-Abrechnungsunterschrift auch dann sichtbar, wenn nur für Cusanus Geld kassiert wurde und Marien 0 € hat. Die bisherige Abrechnungsart und ihre Betragszuordnung werden dadurch nicht umgestellt.
- Die tatsächlich abrechnende Person trägt ihren Namen selbst ein. Das Feld beginnt auf Fahrer- und Bürogeräten leer und ist bearbeitbar. Der angemeldete Zugang wird nicht automatisch als abrechnende Person übernommen.
- Der manuell eingegebene Name und die Unterschrift stehen im Abrechnungsnachweis. Der technisch angemeldete Zugang bleibt separat über `settledByUid`/`settledByName` dokumentiert. Die neue Büro-Kennung `name-entered-on-office-device` behauptet keine persönlich verifizierte Anmeldung der unterschreibenden Person. Büroanzeige und PDF unterscheiden diese Angaben eindeutig.
- Bei allen echten Selbst-Mitnahme-Touren entfällt die Kilometeranzeige in Fahrer-/Büroansicht, Start-/Enddialog und Gesamtdistanz. Auch ältere Selbst-Mitnahmen mit gespeicherter Fahrzeugkennung benötigen keine neue Kilometerangabe mehr. Reguläre Botendienst-Touren behalten Fahrzeug- und Kilometerpflicht.

## Schutz vorhandener Daten und Warteschlangen

Bestehende Abrechnungen bleiben sichtbar und lesbar, auch ältere Null-Abrechnungen. Originale Namen, Unterschriften, Identitätskennungen und Beträge werden nicht verändert. Ein wiederholter Aufruf eines bereits gespeicherten alten Vorgangs bleibt vor der neuen Null-Prüfung idempotent bestätigt. Bereits erfasste Anfangs-/Endkilometer älterer Selbst-Mitnahmen werden nicht gelöscht. Ein noch laufender Altfall kann ohne neue Endkilometer abgeschlossen werden; bereits offline erfasste zulässige Endkilometer alter Clients bleiben bei Übertragung erhalten. Fehlende Angaben werden nicht als erfundene Strecke ergänzt.

Der neue Server prüft positive Kasseneingänge bei beiden Apotheken und beim Einfügen der Abrechnung noch einmal atomar. Eine gleichzeitige Korrektur der letzten Zahlung auf 0 und eine neue Abrechnungsunterschrift können nicht beide erfolgreich sein. Der bestehende Schutz der Marien-Kassensumme, der Abrechnung vor späteren Änderungen und der unveränderlichen Archive bleibt bestehen. Keine neue SQL-Tabelle und keine Änderung produktiver Trigger.

Die verschlüsselte Offline-Datenbank behält ihre bisherige Kennung. Nur App-Cache und Bereitschaftskennung werden auf `settlement-self-20261103` aktualisiert. Keine Löschung von Browserdaten oder Warteschlangen.

## PDF-Arbeitsfassung

Die unveränderte PDF-Referenz unter `recovery/cloudflare-20261030/` bleibt erhalten. `cloudflare/office-pdf.mjs` ist nun eine bearbeitbare Kopie dieses wiedergewonnenen Laufzeitmoduls mit gezielter Ergänzung für die manuell eingetragene Büro-Abrechnungsperson und die getrennte Angabe des angemeldeten Zugangs. Bibliotheken und Lizenzhinweise bleiben enthalten; der Build übernimmt diese aktuelle Arbeitsfassung. Historische Identitätskennungen behalten ihre bisherigen Beschriftungen.

## Fiktive Prüfungen

Backendprüfungen decken reine offene Forderungen ohne Kasseneingang, positive Marien-/Cusanus-Beträge, entfernte/aufgehobene Stopps, Ablehnung neuer Null-Unterschriften, unveränderte ältere Null-Nachweise und deren exakte Wiederholung, manuell abweichenden Signaturnamen mit getrenntem Zugriffskonto, PDF-Erzeugung, konkurrierende Betragskorrektur sowie alte Selbst-Mitnahme-Abschlüsse mit und ohne bereits erfasste Kilometer ab.

Die Browserabläufe prüfen fehlende Knöpfe bei 0 € trotz offener Forderung, weiter mögliche Abrechnung bei ausschließlich kassiertem Cusanus-Betrag, anfangs leeres/bearbeitbares Namensfeld, Anzeige und PDF der tatsächlichen Abrechnungsperson sowie vollständiges Ausblenden der Kilometer alter Selbst-Mitnahme bei unveränderten gespeicherten Werten. Normale Touren, Unterschriften, Kassenkorrekturen und Offline-Abschlüsse werden weiter mitgeprüft.

Veröffentlichungsvoraussetzungen erfüllt: erfolgreiche Gesamtprüfung, ausdrückliche Betreiberfreigabe dieses konkreten Pakets, frische verschlüsselte Betriebssicherung mit isoliertem Restore und erfolgreicher Live-/Archivabgleich. main/v3 und bestehende Archive bleiben unverändert.

## Ergänzung zur Wiederöffnung

Beim Schließen des Abrechnungsdialogs werden auch vorübergehend gesperrte Eingabefelder und Schaltflächen zurückgesetzt. Nach einem abgebrochenen Speicherversuch beginnt ein neu geöffneter Dialog deshalb wieder mit einem leeren, bearbeitbaren Namen. Ein mobiler Bürotest simuliert genau diesen Verbindungsfehler vor Übertragung, bricht ab, öffnet neu und speichert anschließend erfolgreich. Bestehende bereits bestätigte Vorgänge bleiben geschützt.

## Veröffentlichungsnachweis

## Erste Veröffentlichung: Abrechnung bei Kasseneingang, tatsächlicher Name und Selbst-Mitnahme ohne Kilometer – 03.11.2026

Nach ausdrücklicher Betreiberfreigabe „ja“ zum konkret geprüften Paket veröffentlicht: Code `925193d0926b25a44925594884feef818f6f3292`; [GitHub-Prüfung 41622402514](https://github.com/Marienapotheke/marapo24-test/actions/runs/41622402514) erfolgreich mit 186 Prüfungen (36 Grundprüfungen, 17 Emulatorprüfungen, ein v3-Browserablauf, 108 Cloudflare-Backendprüfungen, 19 Sicherungs-/Restore-/Retentions-/Wiederaufbauprüfungen und fünf Cloudflare-Browserabläufe). Worker-Version `54098dad-e181-4054-9d53-cb7a4f386e2e`.

Bei insgesamt 0 € tatsächlich kassiertem Geld für Marien und Cusanus entfällt die neue Abrechnungsunterschrift in Fahrer- und Büroansicht, auch bei offenen Kundenforderungen. Der Server verweigert neue Null-Kassen-Nachweise und prüft die Einnahmen beim Einfügen atomar. Bei ausschließlich kassiertem Cusanus-Geld bleibt die bisherige Marien-Abrechnungsunterschrift nach ausdrücklicher Rückfrage sichtbar. Bestehende Null-Abrechnungen und deren exakte Wiederholungen bleiben unverändert erhalten.

Das Namensfeld jeder neuen Abrechnung startet leer und ist auch im Büro bearbeitbar. Die tatsächlich abrechnende Person trägt ihren Namen ein und unterschreibt. Der angemeldete Zugang wird getrennt zur Nachvollziehbarkeit gespeichert und nicht automatisch als physisch abrechnende Person ausgegeben. Büroansicht und PDF unterscheiden diese Angaben; historische Identitätskennungen und Originalnachweise bleiben erhalten. Selbst-Mitnahme-Touren zeigen und verlangen keine Kilometer mehr, auch ältere Touren mit vorhandener Fahrzeugkennung. Gespeicherte Altwerte werden nicht gelöscht; schon offline erfasste zulässige Endkilometer alter Clients bleiben übertragbar. Reguläre Touren behalten ihre bisherigen Fahrzeug-/Kilometerregeln.

Verschlüsselte Betriebssicherung auf S1 vor Veröffentlichung um 11:54 Uhr und danach um 11:55 Uhr (Europe/Berlin), beide isoliert erfolgreich wiederhergestellt und mit Integrität, Fremdschlüsseln und Archivschutz geprüft. Alle 984 vorherigen Zustellnachweise, 51 Abrechnungen, 9 Korrekturen und 2 Fahrerzuordnungsnachweise bytegenau unverändert. 22 öffentliche Dateien bytegenau mit dem Paket abgeglichen, 19 unangemeldete API-Zugriffe gesperrt. Gesamtes Datenbankschema, Schlüsselbindungen, D1-EU, Kompatibilitätseinstellungen und Aufbewahrungszeitplan unverändert. Keine produktive Migration oder Testdatensätze; main/v3 unverändert.

Nach Speichern laufender Eingaben ausstehende Vorgänge übertragen, alle MARAPO24-Fenster schließen und im WLAN neu öffnen; Browserdaten nicht löschen. Vor Abfahrt „Für Funklöcher vorbereitet“ prüfen. Details: [Abrechnung und Selbst-Mitnahme](abrechnung-mitnahme-2026-11-03.md).
