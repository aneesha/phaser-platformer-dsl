import { describe, it, expect, beforeAll } from 'vitest';
import { grammar } from '../../src/grammar/index.js';

const match = (input: string) => grammar.match(input);
const matchRule = (input: string, startRule: string) =>
  grammar.match(input, startRule);

describe('PlatformerDSL Grammar', () => {
  // ─── Lexical Rules ──────────────────────────────────────

  describe('lexical rules', () => {
    it('should parse identifiers', () => {
      expect(matchRule('mySprite', 'ident').succeeded()).toBe(true);
      expect(matchRule('player_1', 'ident').succeeded()).toBe(true);
      expect(matchRule('a', 'ident').succeeded()).toBe(true);
    });

    it('should reject reserved words as identifiers', () => {
      expect(matchRule('game', 'ident').succeeded()).toBe(false);
      expect(matchRule('player', 'ident').succeeded()).toBe(false);
      expect(matchRule('true', 'ident').succeeded()).toBe(false);
    });

    it('should allow identifiers starting with reserved prefixes', () => {
      expect(matchRule('gameOver', 'ident').succeeded()).toBe(true);
      expect(matchRule('playerSprite', 'ident').succeeded()).toBe(true);
      expect(matchRule('trueValue', 'ident').succeeded()).toBe(true);
    });

    it('should parse strings', () => {
      expect(matchRule('"hello world"', 'string').succeeded()).toBe(true);
      expect(matchRule('"assets/player.png"', 'string').succeeded()).toBe(true);
      expect(matchRule('""', 'string').succeeded()).toBe(true);
    });

    it('should parse numbers', () => {
      expect(matchRule('42', 'number').succeeded()).toBe(true);
      expect(matchRule('3.14', 'number').succeeded()).toBe(true);
      expect(matchRule('0', 'number').succeeded()).toBe(true);
      expect(matchRule('-10', 'number').succeeded()).toBe(true);
    });

    it('should parse booleans', () => {
      expect(matchRule('true', 'boolean').succeeded()).toBe(true);
      expect(matchRule('false', 'boolean').succeeded()).toBe(true);
    });

    it('should parse colors', () => {
      expect(matchRule('#FF0000', 'color').succeeded()).toBe(true);
      expect(matchRule('#87CEEB', 'color').succeeded()).toBe(true);
      expect(matchRule('#000000', 'color').succeeded()).toBe(true);
    });
  });

  // ─── Comments ────────────────────────────────────────────

  describe('comments', () => {
    it('should handle single-line comments', () => {
      const src = `game "Test" {
        // This is a comment
        config { width: 800, height: 600, gravity: 500, background: #87CEEB }
        assets { image bg "bg.png" }
        player { sprite: bg, speed: 200, jumpForce: 400, lives: 3, controls: arrows }
        level "L1" { spawn: { x: 0, y: 0 } }
      }`;
      expect(match(src).succeeded()).toBe(true);
    });

    it('should handle multi-line comments', () => {
      const src = `game "Test" {
        /* This is a
           multi-line comment */
        config { width: 800, height: 600, gravity: 500, background: #87CEEB }
        assets { image bg "bg.png" }
        player { sprite: bg, speed: 200, jumpForce: 400, lives: 3, controls: arrows }
        level "L1" { spawn: { x: 0, y: 0 } }
      }`;
      expect(match(src).succeeded()).toBe(true);
    });
  });

  // ─── Config Block ────────────────────────────────────────

  describe('config block', () => {
    it('should parse a full config', () => {
      const src = 'config { width: 800, height: 600, gravity: 500, background: #87CEEB }';
      expect(matchRule(src, 'ConfigBlock').succeeded()).toBe(true);
    });

    it('should parse config with trailing comma', () => {
      const src = 'config { width: 800, height: 600, }';
      expect(matchRule(src, 'ConfigBlock').succeeded()).toBe(true);
    });

    it('should parse partial config', () => {
      const src = 'config { width: 1024 }';
      expect(matchRule(src, 'ConfigBlock').succeeded()).toBe(true);
    });
  });

  // ─── Assets Block ───────────────────────────────────────

  describe('assets block', () => {
    it('should parse image assets', () => {
      const src = 'assets { image platform "assets/platform.png" }';
      expect(matchRule(src, 'AssetsBlock').succeeded()).toBe(true);
    });

    it('should parse spritesheet assets', () => {
      const src =
        'assets { spritesheet hero "assets/hero.png" { frameWidth: 32, frameHeight: 48 } }';
      expect(matchRule(src, 'AssetsBlock').succeeded()).toBe(true);
    });

    it('should parse tilemap assets', () => {
      const src = 'assets { tilemap lvl1 "assets/level1.json" }';
      expect(matchRule(src, 'AssetsBlock').succeeded()).toBe(true);
    });

    it('should parse audio assets', () => {
      const src = 'assets { audio jumpSfx "assets/jump.wav" }';
      expect(matchRule(src, 'AssetsBlock').succeeded()).toBe(true);
    });

    it('should parse multiple assets', () => {
      const src = `assets {
        spritesheet hero "assets/hero.png" { frameWidth: 32, frameHeight: 48 }
        image platform "assets/platform.png"
        tilemap lvl1 "assets/level1.json"
        audio jumpSfx "assets/jump.wav"
      }`;
      expect(matchRule(src, 'AssetsBlock').succeeded()).toBe(true);
    });
  });

  // ─── Player Block ───────────────────────────────────────

  describe('player block', () => {
    it('should parse a full player definition', () => {
      const src = `player {
        sprite: hero
        speed: 200
        jumpForce: 400
        lives: 3
        controls: arrows
      }`;
      expect(matchRule(src, 'PlayerBlock').succeeded()).toBe(true);
    });

    it('should parse player with wasd controls', () => {
      const src = 'player { sprite: hero, speed: 200, jumpForce: 400, lives: 3, controls: wasd }';
      expect(matchRule(src, 'PlayerBlock').succeeded()).toBe(true);
    });

    it('should parse player with both controls', () => {
      const src = 'player { sprite: hero, speed: 200, jumpForce: 400, lives: 3, controls: both }';
      expect(matchRule(src, 'PlayerBlock').succeeded()).toBe(true);
    });

    it('should parse player with animations', () => {
      const src = `player {
        sprite: hero
        speed: 200
        jumpForce: 400
        lives: 3
        controls: arrows
        animation walk { frames: [0, 1, 2, 3], fps: 10, loop: true }
        animation jump { frames: [4, 5], fps: 8, loop: false }
      }`;
      expect(matchRule(src, 'PlayerBlock').succeeded()).toBe(true);
    });
  });

  // ─── Enemy Block ────────────────────────────────────────

  describe('enemy block', () => {
    it('should parse patrol enemy', () => {
      const src = `enemy goomba {
        sprite: goombaSprite
        movement: patrol { speed: 60, distance: 150 }
        damage: 1
        stompable: true
      }`;
      expect(matchRule(src, 'EnemyBlock').succeeded()).toBe(true);
    });

    it('should parse chase enemy', () => {
      const src = `enemy ghost {
        sprite: ghostSprite
        movement: chase { speed: 80, range: 200 }
        damage: 1
        stompable: false
      }`;
      expect(matchRule(src, 'EnemyBlock').succeeded()).toBe(true);
    });

    it('should parse fly enemy', () => {
      const src = `enemy bat {
        sprite: batSprite
        movement: fly { speed: 40, amplitude: 50, frequency: 2 }
        damage: 1
        stompable: true
      }`;
      expect(matchRule(src, 'EnemyBlock').succeeded()).toBe(true);
    });

    it('should parse static enemy', () => {
      const src = `enemy spike {
        sprite: spikeSprite
        movement: static
        damage: 2
        stompable: false
      }`;
      expect(matchRule(src, 'EnemyBlock').succeeded()).toBe(true);
    });

    it('should parse enemy with animations', () => {
      const src = `enemy goomba {
        sprite: goombaSprite
        movement: patrol { speed: 60, distance: 150 }
        damage: 1
        stompable: true
        animation walk { frames: [0, 1], fps: 6, loop: true }
      }`;
      expect(matchRule(src, 'EnemyBlock').succeeded()).toBe(true);
    });
  });

  // ─── Collectible Block ──────────────────────────────────

  describe('collectible block', () => {
    it('should parse a basic collectible', () => {
      const src = `collectible coin {
        sprite: coinSprite
        score: 10
      }`;
      expect(matchRule(src, 'CollectibleBlock').succeeded()).toBe(true);
    });

    it('should parse collectible with effect', () => {
      const src = `collectible heart {
        sprite: heartSprite
        score: 0
        effect: extraLife
      }`;
      expect(matchRule(src, 'CollectibleBlock').succeeded()).toBe(true);
    });

    it('should parse all collectible effects', () => {
      for (const effect of ['extraLife', 'speedBoost', 'invincible', 'none']) {
        const src = `collectible item { sprite: s, score: 0, effect: ${effect} }`;
        expect(matchRule(src, 'CollectibleBlock').succeeded()).toBe(true);
      }
    });

    it('should parse collectible with animation', () => {
      const src = `collectible coin {
        sprite: coinSprite
        score: 10
        animation spin { frames: [0, 1, 2, 3], fps: 8, loop: true }
      }`;
      expect(matchRule(src, 'CollectibleBlock').succeeded()).toBe(true);
    });
  });

  // ─── Level Block ────────────────────────────────────────

  describe('level block', () => {
    it('should parse a minimal level', () => {
      const src = `level "Level 1" {
        spawn: { x: 50, y: 300 }
      }`;
      expect(matchRule(src, 'LevelBlock').succeeded()).toBe(true);
    });

    it('should parse tilemap-based level', () => {
      const src = `level "Level 1" {
        tilemap: level1map
        layers: { ground: "Ground", platforms: "Platforms" }
        spawn: { x: 50, y: 300 }
        enemies: [goomba at (200, 400), goomba at (500, 400)]
        coins: [coin at (150, 250), coin at (300, 250)]
        exit: { x: 750, y: 400 }
      }`;
      expect(matchRule(src, 'LevelBlock').succeeded()).toBe(true);
    });

    it('should parse inline platforms level', () => {
      const src = `level "Level 2" {
        spawn: { x: 50, y: 500 }
        platforms: [plat at (0, 580, 800, 20), plat at (100, 450, 200, 20)]
        coins: [coin at (150, 400)]
        exit: { x: 700, y: 200 }
      }`;
      expect(matchRule(src, 'LevelBlock').succeeded()).toBe(true);
    });

    it('should parse level with empty entity lists', () => {
      const src = `level "Empty" {
        spawn: { x: 0, y: 0 }
        enemies: []
        coins: []
      }`;
      expect(matchRule(src, 'LevelBlock').succeeded()).toBe(true);
    });
  });

  // ─── HUD Block ──────────────────────────────────────────

  describe('hud block', () => {
    it('should parse HUD with score and lives', () => {
      const src = `hud {
        score { position: top-left, fontSize: 24, color: #FFFFFF }
        lives { position: top-right, max: 3 }
      }`;
      expect(matchRule(src, 'HudBlock').succeeded()).toBe(true);
    });

    it('should parse HUD with timer', () => {
      const src = `hud {
        timer { position: top-center, fontSize: 32 }
      }`;
      expect(matchRule(src, 'HudBlock').succeeded()).toBe(true);
    });

    it('should parse all HUD positions', () => {
      for (const pos of ['top-left', 'top-right', 'top-center', 'bottom-left', 'bottom-right', 'bottom-center']) {
        const src = `hud { score { position: ${pos} } }`;
        expect(matchRule(src, 'HudBlock').succeeded()).toBe(true);
      }
    });
  });

  // ─── Rules Block ────────────────────────────────────────

  describe('rules block', () => {
    it('should parse basic rules', () => {
      const src = 'rules { win: reachExit, lose: noLives }';
      expect(matchRule(src, 'RulesBlock').succeeded()).toBe(true);
    });

    it('should parse rules with nextLevel', () => {
      const src = 'rules { win: reachExit, lose: noLives, nextLevel: "Level 2" }';
      expect(matchRule(src, 'RulesBlock').succeeded()).toBe(true);
    });

    it('should parse collectAll win condition', () => {
      const src = 'rules { win: collectAll coin, lose: noLives }';
      expect(matchRule(src, 'RulesBlock').succeeded()).toBe(true);
    });

    it('should parse survive win condition', () => {
      const src = 'rules { win: survive 60, lose: timerExpires }';
      expect(matchRule(src, 'RulesBlock').succeeded()).toBe(true);
    });

    it('should parse defeatAll win condition', () => {
      const src = 'rules { win: defeatAll, lose: fallOff }';
      expect(matchRule(src, 'RulesBlock').succeeded()).toBe(true);
    });

    it('should parse all lose conditions', () => {
      for (const cond of ['noLives', 'timerExpires', 'fallOff']) {
        const src = `rules { win: reachExit, lose: ${cond} }`;
        expect(matchRule(src, 'RulesBlock').succeeded()).toBe(true);
      }
    });
  });

  // ─── Sounds Block ───────────────────────────────────────

  describe('sounds block', () => {
    it('should parse sounds', () => {
      const src = `sounds {
        jump: jumpSfx
        collect: collectSfx
        bgm: bgMusic
      }`;
      expect(matchRule(src, 'SoundsBlock').succeeded()).toBe(true);
    });
  });

  // ─── Full Game ──────────────────────────────────────────

  describe('full game', () => {
    it('should parse a complete game definition', () => {
      const src = `game "Coin Quest" {
        config { width: 800, height: 600, gravity: 500, background: #87CEEB }

        assets {
          spritesheet hero "assets/player.png" { frameWidth: 32, frameHeight: 48 }
          image platform "assets/platform.png"
          tilemap level1map "assets/level1.json"
          audio jumpSfx "assets/jump.wav"
        }

        player {
          sprite: hero
          speed: 200
          jumpForce: 400
          lives: 3
          controls: arrows
          animation walk { frames: [0, 1, 2, 3], fps: 10, loop: true }
        }

        enemy goomba {
          sprite: goombaSprite
          movement: patrol { speed: 60, distance: 150 }
          damage: 1
          stompable: true
        }

        collectible coin {
          sprite: coinSprite
          score: 10
          animation spin { frames: [0, 1, 2, 3], fps: 8, loop: true }
        }

        level "Level 1" {
          tilemap: level1map
          layers: { ground: "Ground", platforms: "Platforms" }
          spawn: { x: 50, y: 300 }
          enemies: [goomba at (200, 400), goomba at (500, 400)]
          coins: [coin at (150, 250), coin at (300, 250)]
          exit: { x: 750, y: 400 }
        }

        level "Level 2" {
          spawn: { x: 50, y: 500 }
          platforms: [platform at (0, 580, 800, 20), platform at (100, 450, 200, 20)]
          coins: [coin at (150, 400)]
          exit: { x: 700, y: 200 }
        }

        hud {
          score { position: top-left, fontSize: 24, color: #FFFFFF }
          lives { position: top-right, max: 3 }
        }

        rules { win: reachExit, lose: noLives, nextLevel: "Level 2" }

        sounds {
          jump: jumpSfx
          collect: collectSfx
        }
      }`;
      expect(match(src).succeeded()).toBe(true);
    });

    it('should parse a minimal game', () => {
      const src = `game "Minimal" {
        config { width: 800, height: 600 }
        assets { image bg "bg.png" }
        player { sprite: bg, speed: 160, jumpForce: 330, lives: 3, controls: arrows }
        level "L1" { spawn: { x: 0, y: 0 } }
      }`;
      expect(match(src).succeeded()).toBe(true);
    });
  });

  // ─── Error Cases ────────────────────────────────────────

  describe('error cases', () => {
    it('should reject missing game keyword', () => {
      expect(match('"Test" { config { width: 800 } }').succeeded()).toBe(false);
    });

    it('should reject missing game title', () => {
      expect(match('game { config { width: 800 } }').succeeded()).toBe(false);
    });

    it('should reject invalid color format', () => {
      expect(matchRule('#GGG', 'color').succeeded()).toBe(false);
      expect(matchRule('#12345', 'color').succeeded()).toBe(false);
    });

    it('should reject unknown control scheme', () => {
      expect(matchRule('gamepad', 'controlScheme').succeeded()).toBe(false);
    });

    it('should reject unknown collectible effect', () => {
      expect(matchRule('fly', 'collectibleEffect').succeeded()).toBe(false);
    });

    it('should reject unknown win condition', () => {
      const src = 'rules { win: destroyAll, lose: noLives }';
      expect(matchRule(src, 'RulesBlock').succeeded()).toBe(false);
    });
  });
});
