# Kostenloser, getrennter MARAPO24-Testbetrieb

Aktuelle Ergänzungen zu Fahrer-PIN, Büro-Benutzernamen, Kundenvorschlägen, Sortierung und Sicherung: [Betriebsvorbereitung](betrieb-vorbereitung.md).

Die neue Variante liegt ausschließlich im Testzweig. `cloudflare/` enthält die neue Oberfläche, den vertrauenswürdigen Worker und das D1-Schema. Die bisherigen Firebase-Dateien bleiben als getrennte Variante erhalten. Es gibt keine Migration oder Verbindung zu Bestellungen der laufenden v3, keine Änderung der aktiven Firestore-Regeln und keinen automatischen Deploy-Schritt.

## Architektur und Schutz

Firebase Authentication des Projekts `marap024-botendienst-test` stellt die persönliche Anmeldung bereit. Der Worker prüft Firebase-ID-Token und App-Check-Token kryptografisch gegen die offiziellen Google-Schlüssel. Aus dem aktuellen D1-Profil werden Rollen und Freigaben gelesen. Der Browser darf keine Rollen, Administrator- oder Zusatz-Tour-Berechtigungen festlegen. Neue oder deaktivierte Konten erhalten keinen Datenzugriff. Büro/Fahrer-Doppelrollen werden unterstützt.

Die D1-Datenbank hat keinen öffentlichen Direktzugriff. Der Worker nimmt Änderungen nur über geprüfte Aktionen entgegen. Fahrer sehen eigene Touren und Statusmetadaten; das Nachweisarchiv gibt ausschließlich aktiven Büroprofilen Inhalte zurück. Eine einmalige Signatur wird vor dem Einreihen verschlüsselt. Der private RSA-Schlüssel gehört ausschließlich in ein Worker-Secret und niemals in GitHub, die Oberfläche oder eine normale Konfigurationsvariable. D1 speichert fertige Nachweise unveränderlich; Unique-Constraints und Trigger verhindern doppelte Abschlüsse und Änderungen. SQL-Admin-Zugriff bleibt ein besonders geschützter Betriebszugriff.

Das Büro erzeugt das PDF im Browser aus dem zuvor autorisierten Nachweis. Der Driver erhält bei Abschluss/Wiederholung nur eine Bestätigung. PDF, Namen und Signaturen werden nicht durch den Service Worker zwischengespeichert. Offline-Aufträge enthalten verschlüsselte Signaturen und werden kontogebunden übertragen. Der Fahrer kann offline nach vorbereiteter Tour Start, Zustellung und Ende erfassen; die Übernahme und Päckchenerfassung benötigen Internet. Zwischengespeicherte Zuordnungen gelten beim erneuten Laden höchstens zwölf Stunden. Bereits eingereihte Daten bleiben für dasselbe Konto erhalten. Geräteverlust oder gelöschter Browserspeicher kann noch nicht übertragene Daten verlieren.

## Umgesetzter Betriebsablauf

Der Wochentagskalender, einmalige tägliche Tourübernahme, Päckchenerfassung vor Start, Fahrzeug sowie Start- und Endzeit folgen `betriebsablauf-mehrfahrer.md`. Päckchen tragen Apotheke, Adresse, optionale Kontaktdaten und Bargeldbetrag. Nur zugestellte Päckchen zählen zur getrennten Kassensumme. Nicht zugestellt benötigt keine weitere Begründung. Persönliche Anmeldung und Abmeldung sowie Büro-/Fahrer-Doppelrollen funktionieren auf geteilten Tablets.

Die Administratorin kann bestehende Profile aktivieren, sperren, umbenennen und Büro-/Fahrerrollen verwalten. Initiale Identitätszuordnung, Administrationsflag und ausdrücklich benannte Zusatz-Tour-Freigaben müssen einmalig vertrauenswürdig bereitgestellt werden. Namen allein sind keine Identitätsnachweise. Für reale Benutzer fehlen bestätigte E-Mail-Adressen/UIDs; im Test stehen ausschließlich fiktive Konten bereit.

## Prüfung ohne Veröffentlichung

Nach Installation der drei gesperrten Dependency-Sätze in Root, `functions` und `cloudflare-probe`:

```text
pnpm test
pnpm test:emulator
pnpm test:browser
pnpm test:free
pnpm build:free
pnpm test:free:browser
```

Die bestehenden Emulatorprüfungen benötigen Java 21. Die Free-Browserprüfung benötigt nur den lokalen Auth-Emulator und Chromium. Die lokalen Worker-Tests prüfen echte Signaturverifikation mit synthetischen Schlüsseln und D1 mit fiktiven Rollen. Die ausschließlich lokale Browserbrücke übersetzt Emulator-Identitäten in synthetische Token; sie ist in keinem Deploy-Bundle enthalten. Der Tablet-Test prüft Offline-Start, verschlüsselte Signatur, fehlgeschlagene Zustellung, Tourende, erneutes Laden, verlorene Serverbestätigung, Übertragung ohne Duplikate, Büro-PDF und Benutzerwechsel.

## Kosten und Grenzen

Am 13.10.2026 zeigt das angemeldete Cloudflare-Konto **Workers Free – Aktiv** und keine gespeicherte Zahlungsmethode. Es wurde kein Upgrade aktiviert.

Laut offiziellen Preisen: Workers Free erlaubt 100.000 Anfragen pro Tag und 10 ms CPU pro Aufruf; statische Dateien sind kostenlos. D1 Free erlaubt 5 Millionen gelesene und 100.000 geschriebene Zeilen pro Tag, insgesamt 5 GB und höchstens 500 MB je Datenbank. Bei Überschreitung werden Anfragen abgewiesen. Die App behält unbestätigte Offline-Aufträge, statt einen Abschluss vorzutäuschen. Es gibt keinen automatischen Wechsel in einen kostenpflichtigen Tarif.

Lokale Tests messen keine verlässliche gehostete CPU-Zeit. Die geringe CPU-Grenze muss im ausdrücklich genehmigten Pilotbetrieb mit fiktiven Daten geprüft werden, insbesondere für Tokenprüfung, RSA-Entschlüsselung und PNG-Prüfung. Deshalb ist der kostenlose Dauerbetrieb noch nicht zugesichert. Ein notwendiger Tarifwechsel erfordert eine neue Entscheidung. Die Archivgröße muss überwacht werden; D1s siebentägige Wiederherstellung ersetzt keine langfristige Sicherung. Aufbewahrungsdauer, Sicherung/Export und reale Betriebsfreigabe bleiben gesonderte Entscheidungen.

Quellen: [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [D1-Preise](https://developers.cloudflare.com/d1/platform/pricing/), [D1-Grenzen](https://developers.cloudflare.com/d1/platform/limits/).

## Einrichtung nach ausdrücklicher Freigabe

Erst nach grüner Prüfung des finalen Commits und **expliziter Zustimmung zur Veröffentlichung der separaten Testvariante**: neue D1-Testdatenbank in Europa anlegen, Schema ausschließlich dort ausführen, RSA-Secret erzeugen und geschützt hinterlegen, Worker-Subdomain festlegen, Firebase-Anmeldedomäne und App Check für diese Subdomain konfigurieren, fiktive verifizierte Testkonten und D1-Profile bereitstellen und die neue Oberfläche veröffentlichen. App Check darf nicht als Abkürzung abgeschaltet werden. Keine Änderung der v3, ihrer Hosting-Ziele, ihres Datenbestands oder ihrer Firestore-Regeln.

`cloudflare/wrangler.template.jsonc` ist absichtlich nicht ausführbar konfiguriert: die Datenbank-ID fehlt. Es gibt keinen Standard-`wrangler.json`, kein Remote-Schema-Kommando und keine Deploy-Automation im Repository. Eine lokale, ignorierte Konfiguration wird erst nach Freigabe erstellt. Nach Freigabe müssen die gehosteten Rollen-/Nachweistests, CPU-/Quotenprüfung und Wiederanmeldung auf einem echten Android-Tablet bestanden sein. Bis dahin ist dies eine lokal geprüfte Kandidatenversion.

## Veröffentlichter Pilot – 13.10.2026

Der Nutzer hat nach grüner Prüfung ausdrücklich „ja dann veröffentliche diese“ freigegeben und Cloudflares Werkzeugverbindung persönlich bestätigt. Die separate Version wurde veröffentlicht: https://marapo24-protected-test.apotheker-stoeck.workers.dev/ . Getesteter Quellstand: `2c20b2dccc3d6bdb6afb8ee3e45f5f34162896f8`; GitHub-Lauf `38373007059` erfolgreich, einschließlich aller 68 Prüfungen. Worker-Version: `f39e9c17-6a4e-4469-9636-ee0a97a12e1a`.

Neue D1-Datenbank `marapo24-protected-test`, EU-Jurisdiktion, getrenntes Schema und ausschließlich fiktive Profile/Beispiellieferungen. Neue Firebase-Web-App `1:233196612528:web:340794b3d8e13f895f0475` mit reCAPTCHA Enterprise App Check ausschließlich für diese Testadresse. Eine Anmeldedomäne wurde ergänzt; bestehende Domänen und v3-Web-App bleiben erhalten. Firebase ohne Rechnungskonto, Cloudflare Workers Free, kein kostenpflichtiges Upgrade. Bestehende Firestore-Regeln wurden nicht verändert; `main` unverändert bei `ced0e7bc798bffab10b4d76c65719204ac30193d`.

Gehostet geprüft: echte Firebase-Anmeldung plus App Check, Fahrer-Tourstart mit Fahrzeug und Geräte-/Serverzeit, verschlüsselte fiktive Signatur, fehlgeschlagene Lieferung ohne Zusatzfelder, einmaliger Abschluss, Tourende, Abmeldung und Bürozugriff. Büro-PDF heruntergeladen: gültige PDF-Datei mit eingebettetem Signaturbild. Unangemeldete API-Anfrage antwortet 401 und `Cache-Control: no-store`. Passwörter und private Schlüssel stehen ausschließlich außerhalb des Repositories; private RSA-Daten sind Worker-Secrets. Der Pilot ist für fiktive Erprobung freigegeben, nicht für Patienten-/Echtdaten.

Laufzeitbeobachtung: alle beobachteten API-Aufrufe waren erfolgreich und ohne Worker-Ausnahme. Einzelne Aufrufe überschritten die nominelle Free-CPU-Grenze, insbesondere die erste Signaturprüfung mit 145 ms. Die Plattform hat diese Testaufrufe akzeptiert; dies ist keine Zusicherung für dauerhafte oder höhere Last. Vor einer Betriebsfreigabe müssen PNG-/Schlüsselprüfung weiter optimiert und CPU/Quota unter realistischer Last erneut geprüft werden. Eine bezahlte Variante wurde nicht aktiviert. reCAPTCHA hat ohne Rechnungskonto ebenfalls ein begrenztes Gratiskontingent; bei Überschreitung muss die App die fehlende Bestätigung beibehalten. Quelle: https://docs.cloud.google.com/recaptcha/docs/billing-information .