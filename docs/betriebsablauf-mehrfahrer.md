# MARAPO24 – bestätigter Betriebsablauf (Entwicklungsgrundlage)

Stand: 13.10.2026. Ausschließlich Planung und Testentwicklung; keine Echtdaten, kein Deployment.

## Touren und Kalender
- Mo, Di, Do: Ärztetour 1 (vormittags); Hunsrück, Eifel, Mosel (mittags/nachmittags).
- Mi, Fr: zusätzlich Ärztetour 2 und Partnerapotheken-Tour (vormittags).
- Sa: ausschließlich eine allgemeine Vormittags-Kundentour, nur Privatkunden; keine Ärzte, Pflegeeinrichtungen oder Partnerapotheken.
- So: keine regulären Touren.
- Jede reguläre Tourart kann pro lokalem Kalendertag nur einmal von einem Fahrer übernommen werden; atomare Reservierung gegen gleichzeitige Übernahme.
- Fahrer wählen selbst die Tour, erfassen alle Päckchen vor Tourstart und starten anschließend. Nach Start grundsätzlich keine neuen Päckchen.
- Zusatz-/Sondertouren dürfen ausschließlich ausdrücklich berechtigte Bürokräfte anlegen.

## Päckchenerfassung
- Herkunft: Marienapotheke oder Cusanus-Apotheke, pro Päckchen.
- Name, Straße/Hausnummer, PLZ/Ort, optionale Telefonnummer, optionale Lieferhinweise, Barzahlbetrag in Euro.
- Barzahlung bei Übergabe; 0,00 € für bereits bezahlte oder auf Rechnung gehende Lieferungen. Zahlungsgrund bei 0,00 € optional unterscheidbar.
- Auswertung der kassierten Beträge getrennt nach Herkunftsapotheke.
- Bei erfolgreicher privater Zustellung Unterschrift erfassen; Nachweis ausschließlich für Büro abrufbar.
- Bei erfolgloser Zustellung nur Status „Nicht zugestellt“; keine Pflichtbegründung, Rückgabebestätigung oder weitere Fahreraktion. Nachbearbeitung erfolgt persönlich in der Apotheke.

## Rollen
- Individuelle Konten für etwa zehn Fahrer; drei gemeinsam genutzte Android-Tablets mit SIM, persönliche Anmeldung und sichere Abmeldung.
- Fahrer: eigene Tour übernehmen, vor Start Päckchen erfassen, Zustellungen abschließen. Keine Leserechte auf fertige Signaturen/Nachweise.
- Büro: alle Touren und geschützte Nachweise einsehen.
- Nur Carina Sonne (Administratorin), Manuela Thomas und Saskia Butzen-Christen dürfen zusätzliche Touren erstellen.
- Administratorin Carina Sonne: zusätzlich Konten/Rollen verwalten. Änderungen nur über autorisiertes Backend, nie allein clientseitig.
- Gabi Denzer und Yvonne Caspary: Fahrer- und Bürozugriff.
- Fahrer: Gabi Denzer, Yvonne Caspary, Sven Weiler, Sebastian Mehrwald, Hans Dreher, Petra Braun, Jutta Thul-Schröder, Justin Adams, Gerd Schneider, Dagmar Geisen. Jan Stöck vorläufig/ungeklärt.
- Weitere Bürokräfte: Michael Stöck, Samay Alrai, Mirjam Reinart, Beata Taszakowski, Manuela Thomas, Saskia Butzen-Christen, Heike Morbach, Carmen Haas, Bettina Kosmund, Rosi Göhl, Annette Knorr, Janine Schmitz, Carina Sonne, Melissa Jacoby, Julia Rauls, Karina Klei, Lea Dusemond, Isabell Herrmann, Iris Zimmer, Britta Fuhrmann-Schmidt.
- Keine Zugangsdaten oder personenbezogenen Patientendaten im Repository speichern.

## Technische Abnahmekriterien
1. Gleichzeitiger Zugriff zweier Fahrer auf dieselbe Tages-Tour: exakt eine Reservierung erfolgreich.
2. Unberechtigte Fahrer können weder fremde Touren lesen/ändern noch Büro-PDFs abrufen.
3. Büro-Sondertourerstellung nur mit den drei berechtigten Rollen.
4. Tourliste passt zum Wochentag, inkl. Mittwoch/Freitag und Samstag.
5. Nach Tourstart keine normale Ergänzung der Lieferliste; „Nicht zugestellt“ schließt ohne Pflichtfelder ab.
6. Geschützte Unterschriften nur serverseitig archiviert, Büro-PDF nur nach serverseitiger Berechtigungsprüfung.
7. Android-Tablet-Browser mit gemeinsam genutztem Gerät: Abmeldung entfernt Zugriff des vorigen Fahrers.
8. Bestehende v3/main bleibt bis gesonderter Freigabe unverändert.

## Sicherheitsgrenze
Bestehende Regeln/Prototyp unterstützen bisher feste Testkonto-UIDs. Vor Echtbetrieb auf serververwaltete Mehrbenutzerrollen umstellen, Test mit Emulatoren durchführen, Firebase-Produktivkonfiguration und Datenschutz prüfen. Nicht ungeprüft Regeln deployen: alte v3 würde sonst beeinträchtigt.
