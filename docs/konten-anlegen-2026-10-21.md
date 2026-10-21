# Neue Personen in der Administration – veröffentlicht am 21.10.2026

Nach ausdrücklicher Betreiberfreigabe am 21.10.2026 veröffentlicht. Kein produktives Konto wurde für Entwicklung oder Tests angelegt. Sicherung und Live-Prüfung sind unten dokumentiert.

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

## Veröffentlichungsnachweis

## Fahrer- und Bürokonten in der Administration anlegen – 21.10.2026, aktueller Betriebsstand

Nach ausdrücklicher Betreiberfreigabe „ja“ zur konkreten Veröffentlichung der Kontenverwaltung veröffentlicht: geprüfter Code `dc25f98a1c63d86f3dba517068e287e1aef2f4a4`; [GitHub-Prüfung 39574250934](https://github.com/Marienapotheke/marapo24-test/actions/runs/39574250934) erfolgreich mit 163 Tests (36 Grundprüfungen, 17 Emulatorprüfungen, ein v3-Browserablauf, 89 Cloudflare-Backendprüfungen, 16 Sicherungsprüfungen und vier Cloudflare-Browserabläufe). Worker-Version `6d0e805d-bf8e-4a30-a144-2f4297529f32`.

Der verifizierte persönliche Administratorzugang kann unter „Mitarbeiterkonten verwalten“ neue Personen als Fahrer, Büro oder mit beiden Rollen anlegen. Fahrer-PIN wird von der Administratorin selbst festgelegt. Bürokräfte erhalten einen eindeutigen Benutzernamen und ein zufälliges vorläufiges Passwort mit Pflichtänderung vor Datenzugriff. Atomare Anlage und wiederholbare Vorgangskennung verhindern halbfertige und doppelte Konten bei Speicher-/Übertragungsfehlern. Keine neuen Administratorrechte und keine Gerätefreigabe. Bestehende Konten und Zugangsverfahren bleiben erhalten.

Verschlüsselte Betriebssicherung auf S1 vor Veröffentlichung um 11:21 Uhr und danach um 11:22 Uhr (Europe/Berlin), jeweils isoliert erfolgreich wiederhergestellt und mit Integrität, Fremdschlüsseln und Archivschutz geprüft. Alle 329 vorherigen Zustellnachweise und 18 Abrechnungen bytegenau unverändert; im laufenden Betrieb kamen zwischenzeitlich 2 weitere Zustellnachweise hinzu. 22 öffentliche Dateien bytegenau abgeglichen, zwölf unangemeldete API-Zugriffe einschließlich Kontenanlage gesperrt. Schlüsselbindungen, D1-EU, Aufbewahrungszeitplan und Offline-Datenbank erhalten. Keine Migration und keine produktiven Testkonten; main/v3 unverändert.

Nach Speichern laufender Eingaben ausstehende Vorgänge übertragen, alle MARAPO24-Fenster schließen und im WLAN neu öffnen; Browserdaten nicht löschen. Danach mit dem persönlichen Administratorzugang anmelden. Details: [Neue Personen in der Administration](konten-anlegen-2026-10-21.md).
