# Zeitpunkt erfolgloser Zustellversuche – vorbereitet am 05.11.2026

Noch nicht veröffentlicht. Ausgangspunkt ist die freigegebene Worker-Version 848d1bcf-716f-4a0c-8102-62dfc46d54f9.

Bei „nicht zugestellt“ erscheint direkt in Fahrer- und Büroansicht „Zustellversuch um HH:MM Uhr“ mit Datum. Vorrang hat der ursprüngliche Erfassungszeitpunkt am Fahrergerät, auch wenn der Abschluss später aus einer Offline-Warteschlange übertragen wurde. Noch ausstehende Übertragungen sind ausdrücklich als lokal gekennzeichnet. Bei alten Nachweisen ohne Gerätezeit erscheint der bekannte Serverzeitpunkt mit „Zustellversuch gespeichert um“. Offene, entfernte und aufgehobene Zustellungen erhalten keine irreführende Versuchszeit. Erfolgreiche Zustellungen behalten ihre bisherige Beschriftung.

Es werden nur vorhandene Zeitangaben angezeigt. Originalnachweise, Signaturen, Kundenprofile, Offline-Warteschlangen und Datenbankschema bleiben unverändert. Kein neuer Serverendpunkt und keine produktive Migration. Zeitformat Europe/Berlin.

Prüfungen mit fiktiven Daten: ursprüngliche Gerätezeit, Offline-Zeit, Server-Ersatzzeit, Ausschluss offener/entfernter/aufgehobener Datensätze sowie direkte Fahrer- und Büroanzeige nach fehlgeschlagener Zustellung. Zwei Zeit-/Backendprüfungen und alle fünf Browserabläufe lokal erfolgreich. Live-Veröffentlichung nach Betreiberfreigabe und frischer verschlüsselter Sicherung mit isoliertem Restore-Test. main/v3 unverändert.
