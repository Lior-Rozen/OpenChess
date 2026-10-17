# OpenChess

An Android app for drilling chess openings by the book. See [docs/DESIGN.md](docs/DESIGN.md) and
[docs/ROADMAP.md](docs/ROADMAP.md).

```
app/        Expo (React Native) + TypeScript: the phone app. Screens live in app/src/app/
server/     ASP.NET Core .NET 10 Minimal API + xUnit tests
content/    openings: PGN sources in pgn/, compiled JSON in openings/
tools/      scripts that regenerate the app's sounds and icons
docs/       design, roadmap and session prompts
```

## One-time setup

1. **Install the tools** (PowerShell):
   ```powershell
   winget install -e --id Git.Git
   winget install -e --id OpenJS.NodeJS.LTS
   winget install -e --id Microsoft.DotNet.SDK.10
   ```
   Open a new terminal afterwards so `git`, `node`, `npm` and `dotnet` are on the PATH.

   Windows blocks PowerShell scripts by default, and `npm`/`npx` are installed as scripts (you'll
   see "running scripts is disabled on this system"). Allow local scripts for your user, once, in a
   normal (non-admin) PowerShell:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
   If a terminal still blocks it (some VS Code or work setups reset the policy), call the `.cmd`
   versions instead: `npx.cmd expo start`, `npm.cmd test`, and so on.

2. **Install Expo Go on the phone** from the Play Store. It's a generic "player" app: it downloads
   your JavaScript from the PC and runs it, so you don't need to build an APK while developing.

3. **Install the app's packages:**
   ```powershell
   cd app
   npm install
   ```

4. **Allow the phone to reach the server through Windows Firewall.** By default Windows blocks
   incoming connections from other devices. In an **admin** PowerShell:
   ```powershell
   New-NetFirewallRule -DisplayName "Chess Openings API (5080)" -Direction Inbound -Protocol TCP -LocalPort 5080 -Action Allow -Profile Private
   ```
   Your Wi-Fi must be set to **Private** (Settings → Network & internet → Wi-Fi → your network →
   Network profile type → Private). On a Public network the rule above won't apply. Expo's own port
   (8081) usually gets a firewall prompt the first time you run `npx expo start`; allow it on
   private networks.

5. **Find your PC's LAN IP.** The phone can't use `localhost`, because on the phone that means the
   phone itself. Run:
   ```powershell
   ipconfig
   ```
   Under **Wireless LAN adapter Wi-Fi**, copy the **IPv4 Address** (e.g. `10.100.102.5` or `192.168.1.23`).

6. **Point the app at the server.** Copy `app/.env.example` to `app/.env` and put your IP in it:
   ```
   EXPO_PUBLIC_API_URL=http://10.100.102.5:5080
   ```
   `.env` is git-ignored. Restart `npx expo start` after changing it, because the value is baked in
   when the bundle is built. If your router gives the PC a new IP later, update this file.

## Running (two terminals)

**Terminal 1: the server**
```powershell
cd server
dotnet run --project ChessOpenings.Api
```
It listens on `http://0.0.0.0:5080` (all network interfaces, so the phone can reach it). Check it
from the PC with http://localhost:5080/api/hello, and **from the phone's browser** with
`http://<your-IP>:5080/api/hello`. If the phone's browser can't load it, the problem is the firewall
or the network profile, not the app.

**Terminal 2: the app**
```powershell
cd app
npx expo start
```
Scan the QR code with Expo Go (Android: open Expo Go → "Scan QR code"). The PC and the phone must
be on the **same Wi-Fi**. The app reloads on the phone every time you save a file. Press `r` in the
terminal to reload manually.

Home shows the Mastermind and **Hello, friend.** The server's status is in **Settings → About**:
**Server says: hello friend**, or **Server: offline** if it isn't running. The app works fully
either way, because it never depends on the server.

If the QR code won't connect (for example on guest Wi-Fi that isolates devices), use
`npx expo start --tunnel`. The app still loads that way, but the phone can't reach the local server.

## Tests

```powershell
cd app;    npm test; npm run typecheck; npm run lint; npm run validate-content
cd server; dotnet test
```

## Adding or editing openings

Openings are written as PGN in `content/pgn/` (format in [docs/DESIGN.md](docs/DESIGN.md) §4). In
`app/`, `npm run build-content` compiles them into `content/openings/*.json`, which the app
bundles; edit the PGN, never the JSON. Then `npm run validate-content` replays every line and
tells you exactly which move is illegal. A new opening must also be listed in
`content/index.json` and imported in `app/src/content/loader.ts`, and it shows a pawn icon until
one is drawn for it in `app/src/openings/icons.ts`.

## Building the APK (to share with friends)

In `app/`, once: `npx eas-cli login` with the Expo account. Then for each build:
```powershell
npx eas-cli build -p android --profile preview
```
It builds in the cloud (10 to 20 minutes) and ends with a link and a QR code for the `.apk`. Friends
open the link on their phone and allow "Install unknown apps" when Android asks. For a new version,
raise `version` in `app/app.json` first; the new APK installs over the old one and keeps progress.

## Repo

The code is on GitHub at https://github.com/Lior-Rozen/OpenChess, pushed with the
personal account.

Expo Router generates TypeScript types for the routes (the files in `app/src/app/`) while
`npx expo start` is running. After adding a new screen, run `npx expo start` once before
`npm run typecheck`, or it will report the new route as unknown.
