import { grammar } from '../grammar/index.js';
import { ParseError } from '../utils/errors.js';
import type { ParseResult } from './types.js';

export function parse(source: string): ParseResult {
  const match = grammar.match(source);
  if (match.failed()) {
    return {
      match,
      succeeded: false,
      message: match.message,
    };
  }
  return { match, succeeded: true };
}

export function parseOrThrow(source: string) {
  const result = parse(source);
  if (!result.succeeded) {
    throw new ParseError('Failed to parse DSL source', result.message);
  }
  return result.match;
}
