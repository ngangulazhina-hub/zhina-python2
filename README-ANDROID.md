# Zhina Python Android / offline build

This project is prepared for an Android APK using Capacitor and GitHub Actions.

## Offline behavior
- **Pyodide core** (interpreter + standard library) is bundled into the APK under `public/pyodide/`.
- Pure standard-library scripts run fully offline with no network.
- **Scientific packages** (numpy, matplotlib, pandas, …) are *not* pre-bundled (APK size).
  They download on first import or when you tap **Get** in Libraries, then are cached in IndexedDB for later offline use.
- The first download of any extra package still requires internet.
- Package load and run operations have timeouts so the UI never stays stuck on "Running…".

## GitHub build (Codespace or local → Actions)
1. Create a GitHub repository and push this project to `main`.
2. Open **Actions → Build Zhina Python APK → Run workflow** (or push to `main`).
3. When the workflow finishes, download the `zhina-python-debug-apk` artifact.

The workflow installs Capacitor, downloads the Pyodide 314.0.7 **core** release, builds the web app, generates Android resources from `resources/icon.png`, and produces a debug APK.

## Local / Codespace prep
```bash
npm install
npm run android:prepare   # fetch pyodide core + mobile build + copy to dist
# Optional local Android tooling:
# npx cap add android && npx cap sync android
```

## Important
- The APK is **not** compiled inside this archive; compilation runs on GitHub's runner.
- After installing the APK: standard library works offline; scientific packages need one online fetch first.
- Cursor up/down control (volume-style buttons on the right of the editor) respects safe-area insets on Android.
