# MARAPO24 – geschützte Zustellnachweise (Testbranch)

Die bestehende Cloudflare-App läuft im ausdrücklich freigegebenen Echtbetrieb. Entwicklung und Tests im Branch `test-geschuetzte-zustellnachweise` verwenden ausschließlich fiktive Daten. Die Änderungen vom 03.11.2026 wurden nach ausdrücklicher Freigabe veröffentlicht; Nachweise stehen in der Betriebsdokumentation.

Nach gesonderter Freigabe ebenfalls veröffentlicht: [Abrechnung und Selbst-Mitnahme](docs/abrechnung-mitnahme-2026-11-03.md) mit leerem Namensfeld, entfallender Unterschrift bei 0 € Kasseneingang und vollständig ausgeblendeten Kilometern bei Selbst-Mitnahme.

Aktueller Wiederaufbau aus der Live-Version vom 30.10., maßgebliche Programmdateien und veröffentlichte Korrekturen: [Wiederaufbau vom 03.11.2026](docs/wiederaufbau-2026-11-03.md). Der aktuelle Server-Einstieg `cloudflare/worker.mjs` verwendet `cloudflare/recovered-worker.mjs`; ältere Servermodule sind historische Referenzen. `pnpm build:free`, `pnpm test:free`, `pnpm test:free:browser` und `pnpm test:backup` prüfen diese Cloudflare-Arbeitsfassung.

Details zu Backend, Büro-PDF, Zugriffsregeln, Tests und Grenzen zur laufenden v3: [Geschützte Zustellnachweise](docs/geschuetzte-zustellnachweise.md).

`pnpm test` prüft die Backend-Berechtigungen. `pnpm test:emulator` prüft Firestore-Regeln und echte Backend-Aufrufe ausschließlich im lokalen Projekt `demo-marapo24`. Java 21 und Node 22 erforderlich. Installation mit `pnpm install --frozen-lockfile --ignore-scripts` und `pnpm --dir functions install --frozen-lockfile --ignore-scripts`.

**Keine Live-Deployments, keine Regeländerungen, kein Merge nach main ohne Prüfung und ausdrückliche Zustimmung. Die Regeldatei ist inkompatibel mit den alten v3-Touren und darf nicht isoliert bereitgestellt werden.**
