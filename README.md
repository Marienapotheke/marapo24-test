# MARAPO24 – geschützte Zustellnachweise (Testbranch)

Nur fiktive Testdaten. Implementierung im Branch `test-geschuetzte-zustellnachweise`; nicht bereitgestellt, nicht für Echtbetrieb freigegeben.

Details zu Backend, Büro-PDF, Zugriffsregeln, Tests und Grenzen zur laufenden v3: [Geschützte Zustellnachweise](docs/geschuetzte-zustellnachweise.md).

`pnpm test` prüft die Backend-Berechtigungen. `pnpm test:emulator` prüft Firestore-Regeln und echte Backend-Aufrufe ausschließlich im lokalen Projekt `demo-marapo24`. Java 21 und Node 22 erforderlich. Installation mit `pnpm install --frozen-lockfile --ignore-scripts` und `pnpm --dir functions install --frozen-lockfile --ignore-scripts`.

**Keine Live-Deployments, keine Regeländerungen, kein Merge nach main ohne Prüfung und ausdrückliche Zustimmung. Die Regeldatei ist inkompatibel mit den alten v3-Touren und darf nicht isoliert bereitgestellt werden.**
