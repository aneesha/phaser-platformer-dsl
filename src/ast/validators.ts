import type { GameAST } from './types.js';
import { ValidationError } from '../utils/errors.js';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/** Validate a complete GameAST for reference integrity and consistency. */
export function validate(ast: Partial<GameAST>): ValidationResult {
  const errors: string[] = [];

  // Must have a title
  if (!ast.title) {
    errors.push('Game must have a title');
  }

  // Must have at least one level
  if (!ast.levels || ast.levels.length === 0) {
    errors.push('Game must define at least one level');
  }

  // Must have a player
  if (!ast.player) {
    errors.push('Game must define a player block');
  }

  // Build asset key set
  const assetKeys = new Set((ast.assets ?? []).map((a) => a.key));

  // Check player sprite reference
  if (ast.player?.sprite && assetKeys.size > 0 && !assetKeys.has(ast.player.sprite)) {
    errors.push(`Player references undefined asset: "${ast.player.sprite}"`);
  }

  // Build enemy/collectible name sets
  const enemyNames = new Set((ast.enemies ?? []).map((e) => e.name));
  const collectibleNames = new Set((ast.collectibles ?? []).map((c) => c.name));

  // Check enemy sprite references
  for (const enemy of ast.enemies ?? []) {
    if (assetKeys.size > 0 && !assetKeys.has(enemy.sprite)) {
      errors.push(`Enemy "${enemy.name}" references undefined asset: "${enemy.sprite}"`);
    }
  }

  // Check collectible sprite references
  for (const coll of ast.collectibles ?? []) {
    if (assetKeys.size > 0 && !assetKeys.has(coll.sprite)) {
      errors.push(`Collectible "${coll.name}" references undefined asset: "${coll.sprite}"`);
    }
  }

  // Check level name uniqueness
  const levelNames = new Set<string>();
  for (const level of ast.levels ?? []) {
    if (levelNames.has(level.name)) {
      errors.push(`Duplicate level name: "${level.name}"`);
    }
    levelNames.add(level.name);

    // Check tilemap reference
    if (level.tilemap && assetKeys.size > 0 && !assetKeys.has(level.tilemap)) {
      errors.push(`Level "${level.name}" references undefined tilemap: "${level.tilemap}"`);
    }

    // Check enemy placement references
    for (const ep of level.enemies ?? []) {
      if (!enemyNames.has(ep.entity)) {
        errors.push(
          `Level "${level.name}" places undefined enemy: "${ep.entity}"`
        );
      }
    }

    // Check collectible placement references
    for (const cp of level.collectibles ?? []) {
      if (!collectibleNames.has(cp.entity)) {
        errors.push(
          `Level "${level.name}" places undefined collectible: "${cp.entity}"`
        );
      }
    }

    // Tilemap + layers consistency
    if (level.tilemap && (!level.layers || Object.keys(level.layers).length === 0)) {
      errors.push(
        `Level "${level.name}" has a tilemap but no layers defined`
      );
    }
  }

  // Check rules nextLevel reference
  if (ast.rules?.nextLevel && !levelNames.has(ast.rules.nextLevel)) {
    errors.push(`Rules reference undefined next level: "${ast.rules.nextLevel}"`);
  }

  // Check collectAll win condition entity reference
  if (ast.rules?.win?.kind === 'collectAll') {
    if (!collectibleNames.has(ast.rules.win.entity)) {
      errors.push(
        `Win condition "collectAll" references undefined collectible: "${ast.rules.win.entity}"`
      );
    }
  }

  // Check sound references
  if (ast.sounds) {
    for (const [key, value] of Object.entries(ast.sounds)) {
      if (value && assetKeys.size > 0 && !assetKeys.has(value)) {
        errors.push(`Sound "${key}" references undefined asset: "${value}"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Validate and throw on first error. */
export function validateOrThrow(ast: Partial<GameAST>): void {
  const result = validate(ast);
  if (!result.valid) {
    throw new ValidationError(
      result.errors[0],
      result.errors.join('\n')
    );
  }
}
