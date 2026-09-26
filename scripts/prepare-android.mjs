import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const candidates = ['.output/public', '.vercel/output/static', 'dist/client', 'build'];
const source = candidates.find(existsSync);
if (!source) throw new Error(`Could not find a built web directory. Tried: ${candidates.join(', ')}`);

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp(source, 'dist', { recursive: true });
console.log(`Copied ${source} -> dist`);
