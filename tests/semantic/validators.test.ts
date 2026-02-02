import { describe, it, expect } from 'vitest';
import { validate } from '../../src/ast/validators.js';
import type { GameAST } from '../../src/ast/types.js';

const minimalAST: GameAST = {
  title: 'Test',
  config: { width: 800, height: 600, gravity: 500, background: '#87CEEB' },
  assets: [{ type: 'image', key: 'bg', path: 'bg.png' }],
  player: { sprite: 'bg', speed: 160, jumpForce: 330, lives: 3, controls: 'arrows', animations: [] },
  enemies: [],
  collectibles: [],
  levels: [{ name: 'L1', spawn: { x: 0, y: 0 }, enemies: [], collectibles: [], platforms: [] }],
  rules: { win: { kind: 'reachExit' }, lose: { kind: 'noLives' } },
};

describe('AST Validation', () => {
  it('should pass for a valid minimal AST', () => {
    const result = validate(minimalAST);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when title is missing', () => {
    const result = validate({ ...minimalAST, title: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Game must have a title');
  });

  it('should fail when no levels defined', () => {
    const result = validate({ ...minimalAST, levels: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Game must define at least one level');
  });

  it('should fail when player is missing', () => {
    const result = validate({ ...minimalAST, player: undefined as never });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Game must define a player block');
  });

  it('should detect undefined player sprite reference', () => {
    const ast = {
      ...minimalAST,
      player: { ...minimalAST.player, sprite: 'nonexistent' },
    };
    const result = validate(ast);
    expect(result.errors).toContain('Player references undefined asset: "nonexistent"');
  });

  it('should detect duplicate level names', () => {
    const ast = {
      ...minimalAST,
      levels: [
        { name: 'L1', spawn: { x: 0, y: 0 }, enemies: [], collectibles: [], platforms: [] },
        { name: 'L1', spawn: { x: 0, y: 0 }, enemies: [], collectibles: [], platforms: [] },
      ],
    };
    const result = validate(ast);
    expect(result.errors).toContain('Duplicate level name: "L1"');
  });

  it('should detect undefined enemy placement', () => {
    const ast = {
      ...minimalAST,
      levels: [{
        name: 'L1',
        spawn: { x: 0, y: 0 },
        enemies: [{ entity: 'ghost', x: 100, y: 200 }],
        collectibles: [],
        platforms: [],
      }],
    };
    const result = validate(ast);
    expect(result.errors).toContain('Level "L1" places undefined enemy: "ghost"');
  });

  it('should detect undefined collectible placement', () => {
    const ast = {
      ...minimalAST,
      levels: [{
        name: 'L1',
        spawn: { x: 0, y: 0 },
        enemies: [],
        collectibles: [{ entity: 'gem', x: 100, y: 200 }],
        platforms: [],
      }],
    };
    const result = validate(ast);
    expect(result.errors).toContain('Level "L1" places undefined collectible: "gem"');
  });

  it('should detect undefined nextLevel reference', () => {
    const ast = {
      ...minimalAST,
      rules: { win: { kind: 'reachExit' as const }, lose: { kind: 'noLives' as const }, nextLevel: 'Level 99' },
    };
    const result = validate(ast);
    expect(result.errors).toContain('Rules reference undefined next level: "Level 99"');
  });

  it('should detect tilemap without layers', () => {
    const ast = {
      ...minimalAST,
      assets: [...minimalAST.assets, { type: 'tilemap' as const, key: 'map1', path: 'map.json' }],
      levels: [{
        name: 'L1',
        tilemap: 'map1',
        spawn: { x: 0, y: 0 },
        enemies: [],
        collectibles: [],
        platforms: [],
      }],
    };
    const result = validate(ast);
    expect(result.errors).toContain('Level "L1" has a tilemap but no layers defined');
  });

  it('should detect undefined collectAll entity', () => {
    const ast = {
      ...minimalAST,
      rules: { win: { kind: 'collectAll' as const, entity: 'gem' }, lose: { kind: 'noLives' as const } },
    };
    const result = validate(ast);
    expect(result.errors).toContain('Win condition "collectAll" references undefined collectible: "gem"');
  });
});
