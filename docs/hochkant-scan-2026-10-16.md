# Hochkant-Scan: Beschleunigung vorbereitet, Kamera-Erkennung noch zu prüfen

Noch nicht veröffentlicht. Grundlage ist die freigegebene Synchronisationsversion `e20e79d689dfd5c32aec17d2ed4f1998646073ac` beziehungsweise deren Dokumentationsstand. Kein Deployment und keine Änderung produktiver Daten.

Betreiber berichtet: Scannen dauert wegen der verschiedenen Ausrichtungen zu lange; fotografiert wird ausschließlich aufrecht hochkant. Beim zuletzt versuchten Beleg wurde nur ein Teil des Namens erkannt, sonst keine Angaben. Das zuvor bereitgestellte PDF beschreibt das Drucklayout, ersetzt aber keine Prüfung mit einem tatsächlich aufgenommenen Handyfoto.

Vorbereitet: exakt ein OCR-Durchlauf ohne Drehversuche, auch bei fast vollständig fehlenden Feldern. Allgemeine deutsche Sprachmodelldaten dürfen unter einer eigenen Cachekennung wiederverwendet werden; bisher waren diese Downloads ausdrücklich vom Cache ausgeschlossen. Nur die öffentlichen Sprachmodelldaten werden zwischengespeichert. Foto, OCR-Rohtext und Kundendaten werden dadurch nicht gespeichert; der Worker wird nach jedem Scan weiterhin beendet und die Vorschau bei Übernahme/Abbruch/Abmeldung geleert. Kein Wechsel des Sprachmodells und keine Annahme einer besseren Erkennungsqualität allein durch diese Beschleunigung.

Die Oberfläche beschreibt die aufrechte, möglichst bildfüllende Hochkantaufnahme. Bestehende manuelle Prüfung und ausdrückliche Bestätigung bleiben erforderlich. Ausschließlich Offen wird als zu kassierender Betrag übernommen. Keine abgeschwächte Betrags-/Adressprüfung und keine erfundenen fehlenden Kundendaten.

Geprüft: zwei gezielte Tests für genau einen Erkennungslauf bei unleserlichem Text und für Abbruch ohne spätere Feldübernahme; drei bestehende Layout-/Zahlungsparserprüfungen. Mobiler vollständiger Büro-Browserablauf mit lokaler echter OCR auf fiktiven Belegen erfolgreich. Zweiter Scan lädt das Sprachmodell nicht erneut herunter, per Requestzähler geprüft. Synthetische Fotos belegen keine Zuverlässigkeit bei den gemeldeten echten Handyaufnahmen. Keine belastbare Laufzeitangabe für das betroffene Gerät.

Offen: Ein tatsächliches Handyfoto unter denselben Aufnahmebedingungen, vorzugsweise mit fiktiven beziehungsweise unkenntlich gemachten Kundendaten, wurde angefragt. Erst damit lässt sich feststellen, ob Bildausschnitt, Schärfe, Licht, Schriftgröße, Layoutanalyse oder Feldzuordnung den Ausfall verursachen. Weitere Erkennungsänderungen und echte Aussage zur Qualität bleiben bis dahin ausstehend. Technischer Hintergrund zum Wiederverwenden der öffentlichen Sprachdaten: [Tesseract.js Performance](https://github.com/naptha/tesseract.js/blob/master/docs/performance.md).

Vor Veröffentlichung nach vollständiger Prüfung konkrete Betreiberfreigabe sowie frische verschlüsselte Sicherung mit isoliertem Restore erforderlich. Backend, D1-EU, Schlüssel, Offline-Warteschlange und unveränderliche Nachweise bleiben unberührt.
