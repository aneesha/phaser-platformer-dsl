import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { compile } from '../src/compiler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const examplesDir = join(__dirname, '..', 'examples');

const examples = readdirSync(examplesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let success = 0;
let failed = 0;

for (const example of examples) {
  const pfPath = join(examplesDir, example, 'game.pf');
  if (!existsSync(pfPath)) {
    console.log(`  Skip: ${example} (no game.pf)`);
    continue;
  }

  try {
    const source = readFileSync(pfPath, 'utf-8');
    const result = compile(source);
    const outPath = join(examplesDir, example, 'index.html');
    writeFileSync(outPath, result.html, 'utf-8');
    console.log(`  OK: ${example} -> index.html`);
    success++;
  } catch (err) {
    console.error(`  FAIL: ${example} — ${err instanceof Error ? err.message : err}`);
    failed++;
  }
}

console.log(`\nGenerated ${success} examples, ${failed} failures.`);
if (failed > 0) process.exit(1);
