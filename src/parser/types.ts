import type { MatchResult } from 'ohm-js';

export interface ParseResult {
  readonly match: MatchResult;
  readonly succeeded: boolean;
  readonly message?: string;
}
