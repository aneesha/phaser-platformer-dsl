export type PatrolMovement = {
    readonly kind: 'patrol';
    readonly speed: number;
    readonly distance: number;
};
export type ChaseMovement = {
    readonly kind: 'chase';
    readonly speed: number;
    readonly range: number;
};
export type FlyMovement = {
    readonly kind: 'fly';
    readonly speed: number;
    readonly amplitude: number;
    readonly frequency: number;
};
export type StaticMovement = {
    readonly kind: 'static';
};
export type MovementPattern = PatrolMovement | ChaseMovement | FlyMovement | StaticMovement;
export type CollectibleEffect = 'extraLife' | 'speedBoost' | 'invincible' | 'none';
export type WinCondition = {
    readonly kind: 'reachExit';
} | {
    readonly kind: 'collectAll';
    readonly entity: string;
} | {
    readonly kind: 'defeatAll';
} | {
    readonly kind: 'survive';
    readonly seconds: number;
};
export type LoseCondition = {
    readonly kind: 'noLives';
} | {
    readonly kind: 'timerExpires';
} | {
    readonly kind: 'fallOff';
};
export interface AnimationDef {
    readonly name: string;
    readonly frames: readonly number[];
    readonly fps: number;
    readonly loop: boolean;
}
export type AssetType = 'image' | 'spritesheet' | 'tilemap' | 'audio';
export interface SpritesheetConfig {
    readonly frameWidth: number;
    readonly frameHeight: number;
}
export interface AssetDef {
    readonly type: AssetType;
    readonly key: string;
    readonly path: string;
    readonly config?: SpritesheetConfig;
}
export interface GameConfig {
    readonly width: number;
    readonly height: number;
    readonly gravity: number;
    readonly background: string;
}
export type ControlScheme = 'arrows' | 'wasd' | 'both';
export interface PlayerDef {
    readonly sprite: string;
    readonly speed: number;
    readonly jumpForce: number;
    readonly lives: number;
    readonly controls: ControlScheme;
    readonly animations: readonly AnimationDef[];
}
export interface EnemyDef {
    readonly name: string;
    readonly sprite: string;
    readonly movement: MovementPattern;
    readonly damage: number;
    readonly stompable: boolean;
    readonly animations: readonly AnimationDef[];
}
export interface CollectibleDef {
    readonly name: string;
    readonly sprite: string;
    readonly score: number;
    readonly effect: CollectibleEffect;
    readonly animations: readonly AnimationDef[];
}
export interface EntityPlacement {
    readonly entity: string;
    readonly x: number;
    readonly y: number;
}
export interface PlatformDef {
    readonly asset: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
export type TilemapLayers = Record<string, string>;
export interface LevelDef {
    readonly name: string;
    readonly tilemap?: string;
    readonly layers?: TilemapLayers;
    readonly spawn: {
        readonly x: number;
        readonly y: number;
    };
    readonly enemies: readonly EntityPlacement[];
    readonly collectibles: readonly EntityPlacement[];
    readonly platforms: readonly PlatformDef[];
    readonly exit?: {
        readonly x: number;
        readonly y: number;
    };
}
export type HudPosition = 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
export interface HudElementDef {
    readonly type: 'score' | 'lives' | 'timer';
    readonly position: HudPosition;
    readonly fontSize?: number;
    readonly color?: string;
    readonly max?: number;
}
export interface HudDef {
    readonly elements: readonly HudElementDef[];
}
export interface RulesDef {
    readonly win: WinCondition;
    readonly lose: LoseCondition;
    readonly nextLevel?: string;
}
export interface SoundsDef {
    readonly jump?: string;
    readonly collect?: string;
    readonly hurt?: string;
    readonly win?: string;
    readonly lose?: string;
    readonly bgm?: string;
}
export interface GameAST {
    readonly title: string;
    readonly config: GameConfig;
    readonly assets: readonly AssetDef[];
    readonly player: PlayerDef;
    readonly enemies: readonly EnemyDef[];
    readonly collectibles: readonly CollectibleDef[];
    readonly levels: readonly LevelDef[];
    readonly hud?: HudDef;
    readonly rules?: RulesDef;
    readonly sounds?: SoundsDef;
}
export type OutputMode = 'standalone-html' | 'module' | 'embed';
export interface CompileOptions {
    readonly mode?: OutputMode;
    readonly phaserCdn?: string;
    readonly minify?: boolean;
}
export interface CompileResult {
    readonly html: string;
    readonly errors: readonly string[];
}
//# sourceMappingURL=types.d.ts.map

import type { GameAST, CompileOptions, CompileResult } from './ast/types.js';
/**
 * Compile DSL source into a standalone Phaser.js game.
 * Facade function that orchestrates parse → AST → validate → generate.
 */
export declare function compile(source: string, options?: CompileOptions): CompileResult;
/**
 * Parse DSL source into a typed AST (with defaults applied and validation).
 */
export declare function parseToAST(source: string): GameAST;
/**
 * Generate Phaser.js code from a validated AST.
 */
export declare function generate(ast: GameAST, options?: CompileOptions): CompileResult;
//# sourceMappingURL=compiler.d.ts.map

export { compile, parseToAST, generate } from './compiler.js';
export type { GameAST, CompileOptions, CompileResult } from './ast/types.js';
//# sourceMappingURL=index.d.ts.map