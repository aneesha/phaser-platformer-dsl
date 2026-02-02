export declare class DSLError extends Error {
    readonly phase: 'parse' | 'semantic' | 'validate' | 'generate';
    readonly details?: string | undefined;
    constructor(message: string, phase: 'parse' | 'semantic' | 'validate' | 'generate', details?: string | undefined);
}
export declare class ParseError extends DSLError {
    constructor(message: string, details?: string);
}
export declare class ValidationError extends DSLError {
    constructor(message: string, details?: string);
}
export declare class GeneratorError extends DSLError {
    constructor(message: string, details?: string);
}
//# sourceMappingURL=errors.d.ts.map