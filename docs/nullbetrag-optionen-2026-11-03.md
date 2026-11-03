# Zahlungsgrund nur bei 0 € – vorbereitet am 03.11.2026

Noch nicht veröffentlicht. Ausgangspunkt ist die freigegebene Worker-Version f1708c87-551e-4f9c-b83b-30c62dc8f7f1.

Bei der Päckcheneingabe und Bearbeitung wird „Bei 0 €: Zahlungsgrund“ ausschließlich für einen gültigen Nullbetrag angezeigt und aktiviert. 0, 0,00 und 0.00 werden mit der bestehenden Euro-Prüfung erkannt. Bei positiven, leeren oder ungültigen Eingaben bleibt die Auswahl verborgen und deaktiviert. Die Aktualisierung erfolgt direkt bei der Eingabe ohne Neuzeichnen des Formulars oder Fokuswechsel. Pflegeeinrichtungen und Partnerapotheken behalten die bisherigen ausgeblendeten Betragsfelder.

Beim Speichern wird der Null-Euro-Zahlungsgrund nur bei einem Nullbetrag übertragen. Ein zuvor ausgewählter Grund wird für einen positiven Betrag nicht mitgespeichert. Vorhandene Datensätze und Nachweise werden nicht automatisch geändert. Server, Datenbankschema, Offline-Warteschlangen und Verschlüsselung unverändert.

Der bestehende Browserablauf prüft gültige Nullschreibweisen, positive und leere/ungültige Zwischenwerte, unveränderten Fokus, Speichern ohne widersprüchlichen Null-Euro-Grund und Rücksetzen nach dem Speichern. Alle fünf Browserabläufe mit fiktiven Daten lokal erfolgreich. Live-Veröffentlichung nach eigener Betreiberfreigabe und frischer verschlüsselter Sicherung mit isoliertem Restore-Test. main/v3 unverändert.
