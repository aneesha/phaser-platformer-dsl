import type { GameAST, CompileOptions, CompileResult } from './ast/types.js';
import { parseOrThrow } from './parser/index.js';
import { toAST } from './semantic/index.js';
import { validate } from './ast/validators.js';
import { applyDefaults } from './ast/transforms.js';

/**
 * Compile DSL source into a standalone Phaser.js game.
 * Facade function that orchestrates parse → AST → validate → generate.
 */
export function compile(source: string, options?: CompileOptions): CompileResult {
  const ast = parseToAST(source);
  return generate(ast, options);
}

/**
 * Parse DSL source into a typed AST (with defaults applied and validation).
 */
export function parseToAST(source: string): GameAST {
  const matchResult = parseOrThrow(source);
  const rawAST = toAST(matchResult);
  const ast = applyDefaults(rawAST);

  const validation = validate(ast);
  if (!validation.valid) {
    // Attach warnings but don't throw — let generator handle them
    (ast as { _warnings?: readonly string[] })._warnings = validation.errors;
  }

  return ast;
}

/**
 * Generate Phaser.js code from a validated AST.
 */
export function generate(_ast: GameAST, _options?: CompileOptions): CompileResult {
  // Placeholder — implemented in Phase 4
  throw new Error('Not yet implemented');
}
