export class DSLError extends Error {
  constructor(
    message: string,
    public readonly phase: 'parse' | 'semantic' | 'validate' | 'generate',
    public readonly details?: string
  ) {
    super(`[${phase}] ${message}`);
    this.name = 'DSLError';
  }
}

export class ParseError extends DSLError {
  constructor(message: string, details?: string) {
    super(message, 'parse', details);
    this.name = 'ParseError';
  }
}

export class ValidationError extends DSLError {
  constructor(message: string, details?: string) {
    super(message, 'validate', details);
    this.name = 'ValidationError';
  }
}

export class GeneratorError extends DSLError {
  constructor(message: string, details?: string) {
    super(message, 'generate', details);
    this.name = 'GeneratorError';
  }
}
