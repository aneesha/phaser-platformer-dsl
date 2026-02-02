import type { GameConfig, PlayerDef } from '../ast/types.js';
export declare const DEFAULT_CONFIG: Required<Omit<GameConfig, 'background'>> & {
    background: string;
};
export declare const DEFAULT_PLAYER: Pick<PlayerDef, 'speed' | 'jumpForce' | 'lives' | 'controls'>;
//# sourceMappingURL=defaults.d.ts.map