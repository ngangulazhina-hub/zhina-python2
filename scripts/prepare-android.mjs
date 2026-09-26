import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const candidates = ['.output/public', '.vercel/output/static', 'dist/client', 'build'];
const source = candidates.find(existsSync);
if (!source) throw new Error(`Could not find a built web directory. Tried: ${candidates.join(', ')}`);

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp(source, 'dist', { recursive: true });
console.log(`Copied ${source} -> dist`);

// Pyodide must ship inside the app bundle for offline use — if it's missing
// here, the app will silently try to fetch it over the network at runtime
// instead (slow, and broken with no connection), with no error until someone
// actually tries to run Python. Fail the build loudly instead.
const pyodideEntry = 'dist/pyodide/pyodide.mjs';
if (!existsSync(pyodideEntry)) {
  throw new Error(
    `Pyodide was not bundled: ${pyodideEntry} is missing from the build output.\n` +
    `Check that public/pyodide/ was populated (npm run android:pyodide) BEFORE ` +
    `the web build ran, and that the build actually copies the public/ directory ` +
    `into ${source}.`,
  );
}
console.log('Verified Pyodide is present in dist/pyodide/.');
