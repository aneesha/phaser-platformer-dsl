import { describe, it, expect } from 'vitest';
import { compile, parseToAST, generate } from '../../src/compiler.js';

describe('Code Generator', () => {
  const minimalGame = `game "Test" {
    config { width: 800, height: 600, gravity: 500, background: #87CEEB }
    assets { image plat "plat.png" }
    player { sprite: plat, speed: 200, jumpForce: 400, lives: 3, controls: arrows }
    level "Level 1" {
      spawn: { x: 50, y: 300 }
      platforms: [plat at (0, 580, 800, 20)]
      exit: { x: 750, y: 400 }
    }
  }`;

  it('should produce valid HTML output', () => {
    const result = compile(minimalGame);
    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('</html>');
  });

  it('should include Phaser CDN script', () => {
    const result = compile(minimalGame);
    expect(result.html).toContain('cdn.jsdelivr.net/npm/phaser');
  });

  it('should include game title', () => {
    const result = compile(minimalGame);
    expect(result.html).toContain('<title>Test</title>');
  });

  it('should include game config', () => {
    const result = compile(minimalGame);
    expect(result.html).toContain('width: 800');
    expect(result.html).toContain('height: 600');
    expect(result.html).toContain('gravity: { y: 500 }');
  });

  it('should generate BootScene with preload', () => {
    const result = compile(minimalGame);
    expect(result.html).toContain('class BootScene extends Phaser.Scene');
    expect(result.html).toContain("this.load.image('plat'");
  });

  it('should generate level scene class', () => {
    const result = compile(minimalGame);
    expect(result.html).toContain('class Level_Level_1 extends Phaser.Scene');
  });

  it('should generate player controls', () => {
    const result = compile(minimalGame);
    expect(result.html).toContain('createCursorKeys');
    expect(result.html).toContain('setVelocityX');
    expect(result.html).toContain('setVelocityY(-400)');
  });

  it('should generate platform creation', () => {
    const result = compile(minimalGame);
    expect(result.html).toContain('this.platforms = this.physics.add.staticGroup()');
  });

  it('should generate exit zone', () => {
    const result = compile(minimalGame);
    expect(result.html).toContain('this.exitZone = this.add.zone(750, 400');
  });

  it('should generate win/game-over handlers', () => {
    const result = compile(minimalGame);
    expect(result.html).toContain('handleWin()');
    expect(result.html).toContain('handleGameOver()');
    expect(result.html).toContain('YOU WIN!');
    expect(result.html).toContain('GAME OVER');
  });

  // ─── Enemy Generation ────────────────────────────────────

  it('should generate enemy code', () => {
    const src = `game "Enemy Test" {
      assets { image gs "g.png" }
      player { sprite: gs }
      enemy goomba { sprite: gs, movement: patrol { speed: 60, distance: 150 }, damage: 1, stompable: true }
      level "L1" {
        spawn: { x: 0, y: 0 }
        enemies: [goomba at (200, 400)]
      }
    }`;
    const result = compile(src);
    expect(result.html).toContain('this.enemies = this.physics.add.group');
    expect(result.html).toContain('patrolOriginX');
    expect(result.html).toContain('patrolDistance');
  });

  // ─── Collectible Generation ──────────────────────────────

  it('should generate collectible code', () => {
    const src = `game "Collect Test" {
      assets { image cs "c.png" }
      player { sprite: cs }
      collectible coin { sprite: cs, score: 10 }
      level "L1" {
        spawn: { x: 0, y: 0 }
        coins: [coin at (100, 200)]
      }
    }`;
    const result = compile(src);
    expect(result.html).toContain('this.collectibles = this.physics.add.group');
    expect(result.html).toContain('this.score += def.score');
  });

  // ─── HUD Generation ─────────────────────────────────────

  it('should generate HUD scene', () => {
    const src = `game "HUD Test" {
      assets { image bg "bg.png" }
      player { sprite: bg }
      level "L1" { spawn: { x: 0, y: 0 } }
      hud {
        score { position: top-left, fontSize: 24, color: #FFFFFF }
        lives { position: top-right, max: 3 }
      }
    }`;
    const result = compile(src);
    expect(result.html).toContain('class HudScene extends Phaser.Scene');
    expect(result.html).toContain("this.scoreText");
    expect(result.html).toContain("this.livesText");
    expect(result.html).toContain("updateScore");
  });

  // ─── Multi-Level Generation ──────────────────────────────

  it('should generate multiple level scenes', () => {
    const src = `game "Multi" {
      assets { image bg "bg.png" }
      player { sprite: bg }
      level "Level 1" {
        spawn: { x: 0, y: 0 }
        exit: { x: 700, y: 400 }
      }
      level "Level 2" { spawn: { x: 0, y: 0 } }
    }`;
    const result = compile(src);
    expect(result.html).toContain('class Level_Level_1 extends Phaser.Scene');
    expect(result.html).toContain('class Level_Level_2 extends Phaser.Scene');
    // First level should transition to second
    expect(result.html).toContain("this.scene.start('Level_Level_2')");
  });

  // ─── Custom CDN ──────────────────────────────────────────

  it('should allow custom Phaser CDN URL', () => {
    const ast = parseToAST(minimalGame);
    const result = generate(ast, { phaserCdn: 'https://custom.cdn/phaser.js' });
    expect(result.html).toContain('https://custom.cdn/phaser.js');
  });

  // ─── Sounds Generation ──────────────────────────────────

  it('should generate sound loading and playback', () => {
    const src = `game "Sound Test" {
      assets {
        image bg "bg.png"
        audio jumpSfx "jump.wav"
      }
      player { sprite: bg }
      level "L1" { spawn: { x: 0, y: 0 } }
      sounds { jump: jumpSfx }
    }`;
    const result = compile(src);
    expect(result.html).toContain("this.load.audio('jumpSfx'");
    expect(result.html).toContain("this.jumpSound = this.sound.add('jumpSfx')");
  });

  // ─── Spritesheet Loading ─────────────────────────────────

  it('should generate spritesheet loading', () => {
    const src = `game "Sprite Test" {
      assets { spritesheet hero "hero.png" { frameWidth: 32, frameHeight: 48 } }
      player { sprite: hero }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const result = compile(src);
    expect(result.html).toContain("this.load.spritesheet('hero', 'hero.png', { frameWidth: 32, frameHeight: 48 })");
  });

  // ─── Animation Generation ───────────────────────────────

  it('should generate animation creation in BootScene', () => {
    const src = `game "Anim Test" {
      assets { spritesheet hero "hero.png" { frameWidth: 32, frameHeight: 48 } }
      player {
        sprite: hero
        animation walk { frames: [0, 1, 2, 3], fps: 10, loop: true }
      }
      level "L1" { spawn: { x: 0, y: 0 } }
    }`;
    const result = compile(src);
    expect(result.html).toContain("key: 'hero_walk'");
    expect(result.html).toContain('frameRate: 10');
    expect(result.html).toContain('repeat: -1');
  });
});
