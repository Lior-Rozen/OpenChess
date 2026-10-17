# OpenChess (chess openings trainer)

An Android app for drilling chess openings by the book. There is no engine: opening lines are
JSON data, the app plays the opponent's moves, and the user must find the book replies.

- **Read first:** `docs/DESIGN.md` (what and why) and `docs/ROADMAP.md` (phases with checkboxes).
- **Work one phase at a time.** Don't build features from later phases. Tick checkboxes in
  `docs/ROADMAP.md` when done.
- **Stack:** `app/` is Expo + TypeScript (strict), `server/` is ASP.NET Core .NET 10 Minimal API,
  and `content/` holds opening JSON.
- **Offline-first:** the app must work with no server running.
- **The trainer logic** (`app/src/trainer/`) is pure TypeScript with no React, and is covered by Jest.
- **Before committing:** `npm test`, `npm run typecheck`, `npm run lint` and
  `npm run validate-content` in `app/` (the last one runs `content/validate.ts`), and
  `dotnet test` in `server/`.
- **Environment:** Windows + PowerShell. The developer tests on an Android phone via Expo Go on the
  same Wi-Fi, and the server listens on `0.0.0.0:5080`.
- **The developer is new to mobile/frontend** and fluent in C#. Explain mobile-specific steps
  (firewall, LAN IP, Expo Go) explicitly.
