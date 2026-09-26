import { cp, mkdir, rm, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const candidates = ['.output/public', '.vercel/output/static', 'dist/client', 'build'];
const source = candidates.find(existsSync);
if (!source) throw new Error(`Could not find a built web directory. Tried: ${candidates.join(', ')}`);

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp(source, 'dist', { recursive: true });
console.log(`Copied ${source} -> dist`);

// Pyodide must ship inside the app bundle for offline use. It's not enough to
// check for pyodide.mjs (a tiny JS loader) — the files that actually make
// Python work offline are the wasm binary and the stdlib zip, and those are
// large enough that some static-asset copy steps silently drop them. Check
// all three, and print sizes so a partial copy is visible in the log instead
// of silently shipping a broken app.
const pyodideDir = 'dist/pyodide';
const required = ['pyodide.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip'];

console.log(`\nChecking ${pyodideDir}:`);
if (existsSync(pyodideDir)) {
  const files = await readdir(pyodideDir);
  for (const f of files) {
    const s = await stat(`${pyodideDir}/${f}`);
    console.log(`  ${f} — ${(s.size / 1024 / 1024).toFixed(2)} MB`);
  }
} else {
  console.log('  (directory does not exist)');
}

const missing = [];
for (const f of required) {
  if (!existsSync(`${pyodideDir}/${f}`)) missing.push(f);
}

if (missing.length > 0) {
  throw new Error(
    `Pyodide was not fully bundled — missing: ${missing.join(', ')} in ${pyodideDir}.\n` +
    `This means the web build's static-asset copy step is dropping some files from ` +
    `public/pyodide/ (likely the large binary/zip ones) when producing ${source}. ` +
    `Check that public/pyodide/ was fully populated before the build ran, and that ` +
    `nothing in the build pipeline filters by file extension or size.`,
  );
}
console.log('\nVerified Pyodide core files are present in dist/pyodide/.');
