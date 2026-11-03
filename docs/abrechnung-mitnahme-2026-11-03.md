# Abrechnung und Selbst-Mitnahme – vorbereitet am 03.11.2026

Noch nicht veröffentlicht. Ausgangspunkt ist die am 03.11. freigegebene Live-Version `8f5def12-30a6-4ba1-b167-79d3bb3976ec`. Es werden ausschließlich fiktive Daten getestet; keine produktiven Touren, Nachweise oder Abrechnungen geändert und keine Migration ausgeführt.

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

Vor Veröffentlichung sind erfolgreiche Gesamtprüfung, ausdrückliche Betreiberfreigabe dieses konkreten Pakets und frische verschlüsselte Betriebssicherung mit isoliertem Restore erforderlich; anschließend Live-/Archivabgleich. main/v3 und bestehende Archive bleiben unverändert.
