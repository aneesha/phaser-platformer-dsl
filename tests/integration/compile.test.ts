import { describe, it, expect } from 'vitest';
import { compile } from '../../src/compiler.js';

describe('Full Compilation Pipeline', () => {
  it('should compile a complete game with all features', () => {
    const src = `game "Coin Quest" {
      config { width: 800, height: 600, gravity: 500, background: #87CEEB }

      assets {
        spritesheet hero "assets/player.png" { frameWidth: 32, frameHeight: 48 }
        image platform "assets/platform.png"
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
        sprite: hero
        movement: patrol { speed: 60, distance: 150 }
        damage: 1
        stompable: true
      }

      collectible coin {
        sprite: hero
        score: 10
        animation spin { frames: [0, 1, 2, 3], fps: 8, loop: true }
      }

      level "Level 1" {
        spawn: { x: 50, y: 300 }
        platforms: [platform at (0, 580, 800, 20), platform at (100, 450, 200, 20)]
        enemies: [goomba at (200, 400), goomba at (500, 400)]
        coins: [coin at (150, 250), coin at (300, 250)]
        exit: { x: 750, y: 400 }
      }

      level "Level 2" {
        spawn: { x: 50, y: 500 }
        platforms: [platform at (0, 580, 800, 20)]
        coins: [coin at (150, 400)]
        exit: { x: 700, y: 200 }
      }

      hud {
        score { position: top-left, fontSize: 24, color: #FFFFFF }
        lives { position: top-right, max: 3 }
      }

      rules { win: reachExit, lose: noLives, nextLevel: "Level 2" }

      sounds { jump: jumpSfx }
    }`;

    const result = compile(src);

    // No errors
    expect(result.errors).toHaveLength(0);

    // Valid HTML structure
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('<title>Coin Quest</title>');
    expect(result.html).toContain('</html>');

    // Phaser configuration
    expect(result.html).toContain('Phaser.AUTO');
    expect(result.html).toContain('width: 800');
    expect(result.html).toContain('height: 600');

    // All scenes registered
    expect(result.html).toContain('BootScene');
    expect(result.html).toContain('Level_Level_1');
    expect(result.html).toContain('Level_Level_2');
    expect(result.html).toContain('HudScene');

    // Assets loaded
    expect(result.html).toContain("this.load.spritesheet('hero'");
    expect(result.html).toContain("this.load.image('platform'");
    expect(result.html).toContain("this.load.audio('jumpSfx'");

    // Player mechanics
    expect(result.html).toContain('createCursorKeys');
    expect(result.html).toContain('setVelocityY(-400)');

    // Enemies
    expect(result.html).toContain('this.enemies');
    expect(result.html).toContain('patrolOriginX');

    // Collectibles
    expect(result.html).toContain('this.collectibles');

    // Level transition
    expect(result.html).toContain("this.scene.start('Level_Level_2')");

    // HUD
    expect(result.html).toContain('Score:');
    expect(result.html).toContain('Lives:');

    // Sounds
    expect(result.html).toContain("this.jumpSound");
  });

  it('should handle error in DSL gracefully', () => {
    expect(() => compile('not valid dsl')).toThrow();
  });
});
