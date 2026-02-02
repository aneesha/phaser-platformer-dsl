import type { GameAST, CompileOptions, CompileResult } from './ast/types.js';

/**
 * Compile DSL source into a standalone Phaser.js game.
 * Facade function that orchestrates parse → AST → validate → generate.
 */
export function compile(source: string, options?: CompileOptions): CompileResult {
  const ast = parseToAST(source);
  return generate(ast, options);
}

/**
 * Parse DSL source into a typed AST.
 */
export function parseToAST(_source: string): GameAST {
  // Placeholder — implemented in Phase 3
  throw new Error('Not yet implemented');
}

/**
 * Generate Phaser.js code from a validated AST.
 */
export function generate(_ast: GameAST, _options?: CompileOptions): CompileResult {
  // Placeholder — implemented in Phase 4
  throw new Error('Not yet implemented');
}
