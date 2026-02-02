import type { GameAST, CompileOptions, CompileResult } from './ast/types.js';
/**
 * Compile DSL source into a standalone Phaser.js game.
 * Facade function that orchestrates parse → AST → validate → generate.
 */
export declare function compile(source: string, options?: CompileOptions): CompileResult;
/**
 * Parse DSL source into a typed AST (with defaults applied and validation).
 */
export declare function parseToAST(source: string): GameAST;
/**
 * Generate Phaser.js code from a validated AST.
 */
export declare function generate(ast: GameAST, options?: CompileOptions): CompileResult;
//# sourceMappingURL=compiler.d.ts.map