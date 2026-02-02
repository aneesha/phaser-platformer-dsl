import type { GameAST, GameConfig, PlayerDef, EnemyDef, CollectibleDef } from './types.js';
import { DEFAULT_CONFIG, DEFAULT_PLAYER } from '../utils/defaults.js';

/** Fill in default values for any omitted properties. */
export function applyDefaults(ast: Partial<GameAST>): GameAST {
  return {
    title: ast.title ?? 'Untitled Game',
    config: fillConfigDefaults(ast.config),
    assets: ast.assets ?? [],
    player: fillPlayerDefaults(ast.player),
    enemies: (ast.enemies ?? []).map(fillEnemyDefaults),
    collectibles: (ast.collectibles ?? []).map(fillCollectibleDefaults),
    levels: ast.levels ?? [],
    hud: ast.hud,
    rules: ast.rules ?? { win: { kind: 'reachExit' }, lose: { kind: 'noLives' } },
    sounds: ast.sounds,
  };
}

function fillConfigDefaults(config?: Partial<GameConfig>): GameConfig {
  return {
    width: config?.width ?? DEFAULT_CONFIG.width,
    height: config?.height ?? DEFAULT_CONFIG.height,
    gravity: config?.gravity ?? DEFAULT_CONFIG.gravity,
    background: config?.background ?? DEFAULT_CONFIG.background,
  };
}

function fillPlayerDefaults(player?: Partial<PlayerDef>): PlayerDef {
  return {
    sprite: player?.sprite ?? 'player',
    speed: player?.speed ?? DEFAULT_PLAYER.speed,
    jumpForce: player?.jumpForce ?? DEFAULT_PLAYER.jumpForce,
    lives: player?.lives ?? DEFAULT_PLAYER.lives,
    controls: player?.controls ?? DEFAULT_PLAYER.controls,
    animations: player?.animations ?? [],
  };
}

function fillEnemyDefaults(enemy: Partial<EnemyDef>): EnemyDef {
  return {
    name: enemy.name ?? 'enemy',
    sprite: enemy.sprite ?? 'enemy',
    movement: enemy.movement ?? { kind: 'static' },
    damage: enemy.damage ?? 1,
    stompable: enemy.stompable ?? false,
    animations: enemy.animations ?? [],
  };
}

function fillCollectibleDefaults(coll: Partial<CollectibleDef>): CollectibleDef {
  return {
    name: coll.name ?? 'item',
    sprite: coll.sprite ?? 'item',
    score: coll.score ?? 10,
    effect: coll.effect ?? 'none',
    animations: coll.animations ?? [],
  };
}
