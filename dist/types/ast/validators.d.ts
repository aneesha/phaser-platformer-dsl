import type { GameAST } from './types.js';
export interface ValidationResult {
    readonly valid: boolean;
    readonly errors: readonly string[];
}
/** Validate a complete GameAST for reference integrity and consistency. */
export declare function validate(ast: Partial<GameAST>): ValidationResult;
/** Validate and throw on first error. */
export declare function validateOrThrow(ast: Partial<GameAST>): void;
//# sourceMappingURL=validators.d.ts.map