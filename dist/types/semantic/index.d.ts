import { grammar } from '../grammar/index.js';
import type { GameAST } from '../ast/types.js';
declare const semantics: import("ohm-js").Semantics;
export { semantics };
export declare function toAST(matchResult: ReturnType<typeof grammar.match>): Partial<GameAST>;
//# sourceMappingURL=index.d.ts.map