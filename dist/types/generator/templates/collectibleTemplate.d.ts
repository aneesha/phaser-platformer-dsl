import type { CollectibleDef, EntityPlacement } from '../../ast/types.js';
/** Generate collectible creation code. */
export declare function generateCollectibleCreate(collectibles: readonly CollectibleDef[], placements: readonly EntityPlacement[]): string;
/** Generate collectible overlap handler. */
export declare function generateCollectibleCollision(): string;
//# sourceMappingURL=collectibleTemplate.d.ts.map