import { mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const version = '314.0.7';
const archive = `pyodide-core-${version}.tar.bz2`;
const url = `https://github.com/pyodide/pyodide/releases/download/${version}/${archive}`;
const target = 'public/pyodide';

if (existsSync(`${target}/pyodide.mjs`) && existsSync(`${target}/python_stdlib.zip`)) {
  console.log('Pyodide core already present.');
  process.exit(0);
}

await mkdir('.cache', { recursive: true });
const local = `.cache/${archive}`;
if (!existsSync(local)) {
  console.log(`Downloading Pyodide ${version} core...`);
  execFileSync('curl', ['-L', '--fail', '--retry', '3', '-o', local, url], { stdio: 'inherit' });
}

await mkdir(target, { recursive: true });
execFileSync('tar', ['-xjf', local, '-C', target, '--strip-components=1'], { stdio: 'inherit' });
console.log(`Installed Pyodide ${version} core into ${target}`);
