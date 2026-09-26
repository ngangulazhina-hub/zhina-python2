# Zhina Python Android / offline build

This project is prepared for an Android APK using Capacitor and GitHub Actions.

## Offline behavior
- Pyodide core is bundled into the APK under `public/pyodide/`.
- Normal Python execution uses the bundled interpreter and standard library, so it does not need internet.
- Extra Pyodide/PyPI packages can be downloaded when online.
- Downloaded remote package responses are cached in IndexedDB by the Python worker so later runs can reuse them offline.
- The first download of a package still requires internet.

## GitHub build
1. Create a GitHub repository and upload this project.
2. Push to `main`, or open **Actions → Build Zhina Python APK → Run workflow**.
3. When the workflow finishes, open the run and download the `zhina-python-debug-apk` artifact.

The workflow installs Capacitor, downloads the Pyodide 314.0.7 core release, builds the web app, generates Android resources from `resources/icon.png`, and produces a debug APK.

## Important
The APK build is prepared but not compiled in this archive. The actual Android compilation happens on GitHub's runner.
