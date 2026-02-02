import type { GameAST, CompileOptions, CompileResult } from '../ast/types.js';
import { generateStandaloneHTML } from './templates/gameTemplate.js';

/** Generate Phaser.js game code from a validated AST. */
export function generate(ast: GameAST, options?: CompileOptions): CompileResult {
  const mode = options?.mode ?? 'standalone-html';

  switch (mode) {
    case 'standalone-html':
      return {
        html: generateStandaloneHTML(ast, options),
        errors: [],
      };
    case 'module':
    case 'embed':
      // For now, all modes produce standalone HTML
      return {
        html: generateStandaloneHTML(ast, options),
        errors: [],
      };
  }
}
