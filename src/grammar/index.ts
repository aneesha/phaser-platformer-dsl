import * as ohm from 'ohm-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const grammarSource = readFileSync(
  join(__dirname, 'platformer.ohm'),
  'utf-8'
);

export const grammar = ohm.grammar(grammarSource);
