import type { PlayerDef } from '../../ast/types.js';
/** Generate player creation code inside a scene's create() method. */
export declare function generatePlayerCreate(player: PlayerDef, spawn: {
    x: number;
    y: number;
}): string;
/** Generate player control/update code inside a scene's update() method. */
export declare function generatePlayerUpdate(player: PlayerDef): string;
/** Generate input setup code. */
export declare function generatePlayerInputSetup(player: PlayerDef): string;
//# sourceMappingURL=playerTemplate.d.ts.map