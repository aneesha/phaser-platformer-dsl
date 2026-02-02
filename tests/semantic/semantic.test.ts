import { describe, it, expect } from 'vitest';
import { parseToAST } from '../../src/compiler.js';

describe('Semantic Actions', () => {
  // ─── Full Pipeline ──────────────────────────────────────

  it('should parse a minimal game to AST', () => {
    const src = `game "Test Game" {
      config { width: 640, height: 480, gravity: 300, background: #336699 }
      assets { image plat "plat.png" }
      player { sprite: plat, speed: 180, jumpForce: 350, lives: 2, controls: wasd }
      level "L1" { spawn: { x: 10, y: 20 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.title).toBe('Test Game');
    expect(ast.config.width).toBe(640);
    expect(ast.config.height).toBe(480);
    expect(ast.config.gravity).toBe(300);
    expect(ast.config.background).toBe('#336699');
    expect(ast.player.sprite).toBe('plat');
    expect(ast.player.speed).toBe(180);
    expect(ast.player.jumpForce).toBe(350);
    expect(ast.player.lives).toBe(2);
    expect(ast.player.controls).toBe('wasd');
    expect(ast.levels).toHaveLength(1);
    expect(ast.levels[0].name).toBe('L1');
    expect(ast.levels[0].spawn).toEqual({ x: 10, y: 20 });
  });

  // ─── Defaults ────────────────────────────────────────────

  it('should apply default config values', () => {
    const src = `game "Defaults" {
      config { width: 1024 }
      assets { image bg "bg.png" }
      player { sprite: bg }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.config.width).toBe(1024);
    expect(ast.config.height).toBe(600); // default
    expect(ast.config.gravity).toBe(500); // default
    expect(ast.config.background).toBe('#87CEEB'); // default
  });

  it('should apply default player values', () => {
    const src = `game "Defaults" {
      assets { image bg "bg.png" }
      player { sprite: bg }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.player.speed).toBe(160);
    expect(ast.player.jumpForce).toBe(330);
    expect(ast.player.lives).toBe(3);
    expect(ast.player.controls).toBe('arrows');
  });

  // ─── Assets ──────────────────────────────────────────────

  it('should parse all asset types', () => {
    const src = `game "Assets" {
      assets {
        spritesheet hero "hero.png" { frameWidth: 32, frameHeight: 48 }
        image platform "plat.png"
        tilemap map1 "map.json"
        audio sfx "sound.wav"
      }
      player { sprite: hero }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.assets).toHaveLength(4);
    expect(ast.assets[0]).toEqual({
      type: 'spritesheet',
      key: 'hero',
      path: 'hero.png',
      config: { frameWidth: 32, frameHeight: 48 },
    });
    expect(ast.assets[1]).toEqual({ type: 'image', key: 'platform', path: 'plat.png' });
    expect(ast.assets[2]).toEqual({ type: 'tilemap', key: 'map1', path: 'map.json' });
    expect(ast.assets[3]).toEqual({ type: 'audio', key: 'sfx', path: 'sound.wav' });
  });

  // ─── Enemies ─────────────────────────────────────────────

  it('should parse enemy with patrol movement', () => {
    const src = `game "Enemies" {
      assets { image gs "g.png" }
      player { sprite: gs }
      enemy goomba {
        sprite: gs
        movement: patrol { speed: 60, distance: 150 }
        damage: 1
        stompable: true
      }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.enemies).toHaveLength(1);
    expect(ast.enemies[0].name).toBe('goomba');
    expect(ast.enemies[0].movement).toEqual({ kind: 'patrol', speed: 60, distance: 150 });
    expect(ast.enemies[0].damage).toBe(1);
    expect(ast.enemies[0].stompable).toBe(true);
  });

  it('should parse enemy with chase movement', () => {
    const src = `game "Enemies" {
      assets { image gs "g.png" }
      player { sprite: gs }
      enemy ghost { sprite: gs, movement: chase { speed: 80, range: 200 }, damage: 1, stompable: false }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.enemies[0].movement).toEqual({ kind: 'chase', speed: 80, range: 200 });
  });

  it('should parse enemy with fly movement', () => {
    const src = `game "Enemies" {
      assets { image bs "b.png" }
      player { sprite: bs }
      enemy bat { sprite: bs, movement: fly { speed: 40, amplitude: 50, frequency: 2 }, damage: 1, stompable: true }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.enemies[0].movement).toEqual({ kind: 'fly', speed: 40, amplitude: 50, frequency: 2 });
  });

  it('should parse static enemy', () => {
    const src = `game "Enemies" {
      assets { image ss "s.png" }
      player { sprite: ss }
      enemy spike { sprite: ss, movement: static, damage: 2, stompable: false }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.enemies[0].movement).toEqual({ kind: 'static' });
  });

  // ─── Collectibles ────────────────────────────────────────

  it('should parse collectible with score and effect', () => {
    const src = `game "Collect" {
      assets { image cs "c.png" }
      player { sprite: cs }
      collectible heart { sprite: cs, score: 0, effect: extraLife }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.collectibles).toHaveLength(1);
    expect(ast.collectibles[0].name).toBe('heart');
    expect(ast.collectibles[0].score).toBe(0);
    expect(ast.collectibles[0].effect).toBe('extraLife');
  });

  it('should default collectible effect to none', () => {
    const src = `game "Collect" {
      assets { image cs "c.png" }
      player { sprite: cs }
      collectible coin { sprite: cs, score: 10 }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.collectibles[0].effect).toBe('none');
  });

  // ─── Levels ──────────────────────────────────────────────

  it('should parse tilemap-based level', () => {
    const src = `game "Levels" {
      assets {
        image gs "g.png"
        tilemap m1 "m1.json"
      }
      player { sprite: gs }
      enemy goomba { sprite: gs, movement: static, damage: 1, stompable: true }
      collectible coin { sprite: gs, score: 10 }
      level "Level 1" {
        tilemap: m1
        layers: { ground: "Ground", plats: "Platforms" }
        spawn: { x: 50, y: 300 }
        enemies: [goomba at (200, 400)]
        coins: [coin at (150, 250), coin at (300, 250)]
        exit: { x: 750, y: 400 }
      }
    }`;
    const ast = parseToAST(src);

    const level = ast.levels[0];
    expect(level.name).toBe('Level 1');
    expect(level.tilemap).toBe('m1');
    expect(level.layers).toEqual({ ground: 'Ground', plats: 'Platforms' });
    expect(level.spawn).toEqual({ x: 50, y: 300 });
    expect(level.enemies).toEqual([{ entity: 'goomba', x: 200, y: 400 }]);
    expect(level.collectibles).toEqual([
      { entity: 'coin', x: 150, y: 250 },
      { entity: 'coin', x: 300, y: 250 },
    ]);
    expect(level.exit).toEqual({ x: 750, y: 400 });
  });

  it('should parse inline-platforms level', () => {
    const src = `game "Levels" {
      assets { image p "p.png" }
      player { sprite: p }
      level "Level 2" {
        spawn: { x: 50, y: 500 }
        platforms: [p at (0, 580, 800, 20), p at (100, 450, 200, 20)]
      }
    }`;
    const ast = parseToAST(src);

    const level = ast.levels[0];
    expect(level.platforms).toEqual([
      { asset: 'p', x: 0, y: 580, width: 800, height: 20 },
      { asset: 'p', x: 100, y: 450, width: 200, height: 20 },
    ]);
  });

  // ─── HUD ─────────────────────────────────────────────────

  it('should parse HUD elements', () => {
    const src = `game "HUD" {
      assets { image bg "bg.png" }
      player { sprite: bg }
      level "L1" { spawn: { x: 0, y: 0 } }
      hud {
        score { position: top-left, fontSize: 24, color: #FFFFFF }
        lives { position: top-right, max: 3 }
      }
    }`;
    const ast = parseToAST(src);

    expect(ast.hud).toBeDefined();
    expect(ast.hud!.elements).toHaveLength(2);
    expect(ast.hud!.elements[0]).toEqual({
      type: 'score',
      position: 'top-left',
      fontSize: 24,
      color: '#FFFFFF',
    });
    expect(ast.hud!.elements[1]).toEqual({
      type: 'lives',
      position: 'top-right',
      max: 3,
    });
  });

  // ─── Rules ───────────────────────────────────────────────

  it('should parse rules with reachExit', () => {
    const src = `game "Rules" {
      assets { image bg "bg.png" }
      player { sprite: bg }
      level "L1" { spawn: { x: 0, y: 0 } }
      level "L2" { spawn: { x: 0, y: 0 } }
      rules { win: reachExit, lose: noLives, nextLevel: "L2" }
    }`;
    const ast = parseToAST(src);

    expect(ast.rules).toBeDefined();
    expect(ast.rules!.win).toEqual({ kind: 'reachExit' });
    expect(ast.rules!.lose).toEqual({ kind: 'noLives' });
    expect(ast.rules!.nextLevel).toBe('L2');
  });

  it('should parse collectAll win condition', () => {
    const src = `game "Rules" {
      assets { image bg "bg.png" }
      player { sprite: bg }
      collectible coin { sprite: bg, score: 10 }
      level "L1" { spawn: { x: 0, y: 0 } }
      rules { win: collectAll coin, lose: noLives }
    }`;
    const ast = parseToAST(src);

    expect(ast.rules!.win).toEqual({ kind: 'collectAll', entity: 'coin' });
  });

  it('should parse survive win condition', () => {
    const src = `game "Rules" {
      assets { image bg "bg.png" }
      player { sprite: bg }
      level "L1" { spawn: { x: 0, y: 0 } }
      rules { win: survive 60, lose: timerExpires }
    }`;
    const ast = parseToAST(src);

    expect(ast.rules!.win).toEqual({ kind: 'survive', seconds: 60 });
    expect(ast.rules!.lose).toEqual({ kind: 'timerExpires' });
  });

  // ─── Sounds ──────────────────────────────────────────────

  it('should parse sounds block', () => {
    const src = `game "Sounds" {
      assets {
        image bg "bg.png"
        audio jumpSfx "j.wav"
        audio collectSfx "c.wav"
      }
      player { sprite: bg }
      level "L1" { spawn: { x: 0, y: 0 } }
      sounds { jump: jumpSfx, collect: collectSfx }
    }`;
    const ast = parseToAST(src);

    expect(ast.sounds).toBeDefined();
    expect(ast.sounds!.jump).toBe('jumpSfx');
    expect(ast.sounds!.collect).toBe('collectSfx');
  });

  // ─── Animations ──────────────────────────────────────────

  it('should parse player animations', () => {
    const src = `game "Anim" {
      assets { spritesheet hero "hero.png" { frameWidth: 32, frameHeight: 32 } }
      player {
        sprite: hero
        animation walk { frames: [0, 1, 2, 3], fps: 10, loop: true }
        animation jump { frames: [4, 5], fps: 8, loop: false }
      }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.player.animations).toHaveLength(2);
    expect(ast.player.animations[0]).toEqual({
      name: 'walk',
      frames: [0, 1, 2, 3],
      fps: 10,
      loop: true,
    });
    expect(ast.player.animations[1]).toEqual({
      name: 'jump',
      frames: [4, 5],
      fps: 8,
      loop: false,
    });
  });

  // ─── Default Rules ──────────────────────────────────────

  it('should default rules when not specified', () => {
    const src = `game "NoRules" {
      assets { image bg "bg.png" }
      player { sprite: bg }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const ast = parseToAST(src);

    expect(ast.rules).toEqual({ win: { kind: 'reachExit' }, lose: { kind: 'noLives' } });
  });
});
