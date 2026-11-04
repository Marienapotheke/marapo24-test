# Tourauswahl oben und einklappbare Päckchenerfassung – vorbereitet am 04.11.2026

Noch nicht veröffentlicht. Ausgangspunkt ist Worker-Version 0b52800b-d61c-4d1e-a4ba-1aab49d15170.

In der Fahreransicht stehen die verfügbaren Touren mit Übernahme zuerst, direkt danach die Auswahl der eigenen Tour. Die Arbeitsbeginn-Karte folgt darunter. Die Übernahmeauswahl bleibt auch bei einer gewählten oder laufenden Tour an dieser Position; sie wird nicht mehr in die Päckcheneingabe verschoben. Bestehende Übernahme-, Übergabe-, Arbeitszeit- und Berechtigungsregeln bleiben erhalten. Für reine Büro-Mitnahme bleibt die Fahrerübernahme wie bisher verborgen.

„Päckchen hinzufügen“ ist ein zunächst geöffneter, über seine Überschrift vollständig einklappbarer Bereich. Das gilt im Fahrer- und Bürobereich. Eingaben bleiben beim Einklappen erhalten; Hintergrundaktualisierungen öffnen den Bereich nicht. Beim bewussten Bearbeiten eines Päckchens öffnet er sich automatisch. Native Details-/Summary-Bedienung unterstützt Tastatur und Touch, mit mindestens 44 Pixel hoher Überschrift. Keine automatische Speicherung durch das Einklappen.

Vorhandene mobile Browserabläufe prüfen die Reihenfolge, das vollständige Einklappen bei ungespeichertem Entwurf und den Erhalt der Eingabe. Der Büroablauf prüft das automatische Öffnen beim Bearbeiten. Screenshot mit fiktiven Daten: artifacts/driver-top-collapsed-20261104.png. Alle fünf Browserabläufe mit fiktiven Daten lokal erfolgreich; mobile Darstellung anhand des Screenshots geprüft. Live-Veröffentlichung nach eigener Betreiberfreigabe, Gesamtprüfung und frischer verschlüsselter Sicherung mit isoliertem Restore-Test. Datenbankschema, Server, Offline-Warteschlangen und Archive bleiben unverändert; main/v3 werden nicht geändert.
