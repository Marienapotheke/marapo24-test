# Neue Personen in der Administration – vorbereitet am 21.10.2026

Noch nicht veröffentlicht. Die vorherige Veröffentlichung der Bürofarben bleibt der Live-Betriebsstand. Kein produktives Konto wurde für Entwicklung oder Tests angelegt.

## Bedienung

Im persönlich angemeldeten Administratorzugang erscheint unter „Mitarbeiterkonten verwalten“ das Formular „Neue Person hinzufügen“. Vor- und Nachname sowie Rolle wählen: Fahrer, Büro oder beide Rollen. Die Person erhält einen aktiven persönlichen Zugang; hier werden keine Administratorrechte vergeben.

Für Fahrer legt die Administratorin die persönliche sechsstellige PIN selbst fest, wie vom Betreiber ausdrücklich gewünscht. Das vorhandene Augensymbol erlaubt die Sichtkontrolle. Einfache Zahlenfolgen und identische Ziffern werden wie beim bisherigen PIN-Zurücksetzen abgewiesen. Es ist weiterhin keine Gerätefreigabe nötig.

Für Bürokräfte einen freien Benutzernamen eingeben; eine echte E-Mail-Adresse ist nicht erforderlich. Die App erzeugt ein zufälliges vorläufiges Passwort und zeigt es nach erfolgreicher Bestätigung im vorhandenen Zugangsdialog an. Persönlich weitergeben; vor Datenzugriff muss das Passwort geändert werden. Das Schließen des Dialogs bzw. Abmelden leert die Anzeige. Bei verlorenen Zugangsdaten bleibt das bestehende administrative Zurücksetzen verfügbar.

Neue Personen erscheinen nach bestätigtem Speichern in der Kontenliste und in den passenden Listen zum Zurücksetzen von Passwort oder PIN. Bestehende Rollen- und Sperrfunktionen bleiben verfügbar.

## Technischer Schutz

- Nur der verifizierte persönliche Firebase-Administratorzugang, dessen E-Mail mit der bestehenden privaten Administratorbindung übereinstimmt, darf `createStaffAccount` aufrufen. Büro-/Fahrer-Anmeldungen und andere E-Mail-Identitäten sind gesperrt.
- Profil, Passwortnachweis und gegebenenfalls PIN-Hash werden in einer atomaren D1-Transaktion angelegt. Benutzername ist eindeutig. Fehler an den Zugangsdaten hinterlassen kein halbfertiges Profil.
- Büro-Passwort ist kryptografisch zufällig und bleibt bis zur bestätigten Erstellung nur im Arbeitsspeicher des Formulars. Übertragen wird das vorhandene vorläufige Passwortnachweisformat; gespeichert werden gesalzene, mit dem bestehenden geheimen Schlüssel gebundene Hashes. PIN-Speicherung nutzt das bestehende gesalzene Hashverfahren. Keine Klartext-Zugangsdaten in Offline-Speicher, Kundendaten oder Protokollen.
- Eine zufällige Vorgangskennung wird bei fehlender Bestätigung wiederverwendet. Exakte Wiederholung erzeugt kein zweites Konto. Ein inzwischen geändertes Konto/PIN/Passwort wird dadurch nicht überschrieben. Bei unbestätigtem Netzwerkfehler bleiben die Eingaben für den Wiederholungsversuch gesperrt, der Bestätigungsbutton wird wieder freigegeben. Abmelden löscht den lokalen Vorgang; eine bereits bestätigte Serveranlage wird dadurch nicht rückgängig gemacht. Nach einem Seitenneustart gegebenenfalls Kontenliste und vorhandene Rücksetzfunktion verwenden.
- Frische Administratorberechtigung und die bestehenden Listenkapazitäten (höchstens 100 Konten bzw. 50 Fahrerrollen) werden beim Einfügen geprüft. Keine still abgeschnittenen neuen Fahrerlisten.
- Keine SQL-Migration. Keine Änderungen bestehender Identitäten, Nachweise, Signaturen, Beträge, Verschlüsselungsschlüssel, Offline-Datenbank oder Aufbewahrung. Cachekennung und Bereitschaftsmeldung werden gemeinsam aktualisiert.

## Prüfung und Veröffentlichung

Fiktive Backendprüfungen decken Zugriffsverweigerung, fremde Administrator-E-Mail, eingeschleuste Berechtigungen, ungültige PINs, tatsächliche Fahrer-PIN-Anmeldung, vorläufige Büroanmeldung mit Pflicht-Passwortwechsel, beide Rollen, wiederholte Vorgangskennungen, doppelte Benutzernamen und Listenkapazitäten, parallele Wiederholung sowie vollständigen Transaktionsabbruch bei einem Speicherfehler ab. Browserprüfung umfasst das Formular im echten Administratorablauf, eine verlorene erfolgreiche Serverbestätigung mit identischer Wiederholung, PIN-Augensymbol, Passwortausgabe und Leeren beim Schließen sowie das Ausblenden für normale Bürokräfte.

Vor Veröffentlichung sind Betreiberfreigabe für diese Erweiterung, erfolgreiche GitHub-Gesamtprüfung und eine frische verschlüsselte Betriebssicherung mit isoliertem Restore-Test erforderlich. main/v3 bleiben unverändert.
