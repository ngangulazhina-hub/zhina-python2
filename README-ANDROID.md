# Zhina Python Android / offline build

This project is prepared for an Android APK using Capacitor and GitHub Actions.

## Offline behavior
- **Pyodide core** (interpreter + standard library) is bundled into the APK under `public/pyodide/`.
- Pure standard-library scripts run fully offline with no network.
- **Scientific packages** (numpy, matplotlib, pandas, …) download from the Pyodide CDN on first use when online, then are cached in IndexedDB for later offline runs.
- Package load / install / run have timeouts so the UI never stays stuck on "Running…".

## input()
Put answers in the **Program input** box at the bottom of the terminal (one line per `input()` call), then press Run. If the box is empty, `input()` receives an empty string instead of raising EOFError.

## Editor
- Enter keeps the current block indent (and indents after lines ending with `:`).
- `(` `[` `{` `"` `'` auto-close.
- Caret is thickened for mobile visibility; pinch-to-zoom still adjusts font size.

## GitHub build (Codespace or local → Actions)
1. Push this project to `main` on GitHub.
2. Open **Actions → Build Zhina Python APK → Run workflow** (or wait for the push trigger).
3. Download the `zhina-python-debug-apk` artifact when the job finishes.

The workflow installs Capacitor, downloads Pyodide **314.0.7** core, builds the web app, patches Android permissions (INTERNET, NETWORK_STATE, VIBRATE, WAKE_LOCK), and produces a debug APK.

## Local / Codespace prep
```bash
npm install
npm run android:prepare
```

## Important
- Compilation of the APK happens on GitHub's runner, not in this archive.
- First fetch of scientific packages needs internet; after that they work offline from cache.
