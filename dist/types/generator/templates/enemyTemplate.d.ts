import type { EnemyDef, EntityPlacement } from '../../ast/types.js';
/** Generate enemy creation code for a level. */
export declare function generateEnemyCreate(enemies: readonly EnemyDef[], placements: readonly EntityPlacement[]): string;
/** Generate enemy AI update code. */
export declare function generateEnemyUpdate(enemies: readonly EnemyDef[]): string;
/** Generate stomp + damage overlap handlers. */
export declare function generateEnemyCollision(): string;
//# sourceMappingURL=enemyTemplate.d.ts.map