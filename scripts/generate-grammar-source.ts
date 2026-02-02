import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ohmPath = join(__dirname, '..', 'src', 'grammar', 'platformer.ohm');
const outPath = join(__dirname, '..', 'src', 'grammar', 'grammarSource.ts');

const source = readFileSync(ohmPath, 'utf-8');

const tsContent = `// Auto-generated from platformer.ohm — do not edit directly.
// Run: npx tsx scripts/generate-grammar-source.ts

export const grammarSource = ${JSON.stringify(source)};
`;

writeFileSync(outPath, tsContent, 'utf-8');
console.log('Generated grammarSource.ts');
