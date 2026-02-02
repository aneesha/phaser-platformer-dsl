import { CodeBuilder } from '../codeBuilder.js';
import type { GameAST, AnimationDef } from '../../ast/types.js';
import { resolveAssetPath } from '../assetResolver.js';

/** Generate the BootScene class that preloads all assets and creates animations. */
export function generatePreloadScene(ast: GameAST): string {
  const b = new CodeBuilder();

  b.block('class BootScene extends Phaser.Scene', (b) => {
    b.block('constructor()', (b) => {
      b.line("super({ key: 'BootScene' });");
    });
    b.line();
    b.block('preload()', (b) => {
      for (const asset of ast.assets) {
        const path = resolveAssetPath(asset);
        switch (asset.type) {
          case 'image':
            b.line(`this.load.image('${asset.key}', '${path}');`);
            break;
          case 'spritesheet':
            b.line(
              `this.load.spritesheet('${asset.key}', '${path}', { frameWidth: ${asset.config!.frameWidth}, frameHeight: ${asset.config!.frameHeight} });`
            );
            break;
          case 'tilemap':
            b.line(`this.load.tilemapTiledJSON('${asset.key}', '${path}');`);
            break;
          case 'audio':
            b.line(`this.load.audio('${asset.key}', '${path}');`);
            break;
        }
      }
    });
    b.line();
    b.block('create()', (b) => {
      // Create all animations
      const allAnims = collectAnimations(ast);
      for (const { ownerKey, anim } of allAnims) {
        b.line(`this.anims.create({`);
        b.indent();
        b.line(`key: '${ownerKey}_${anim.name}',`);
        b.line(
          `frames: this.anims.generateFrameNumbers('${ownerKey}', { frames: [${anim.frames.join(', ')}] }),`
        );
        b.line(`frameRate: ${anim.fps},`);
        b.line(`repeat: ${anim.loop ? -1 : 0},`);
        b.dedent();
        b.line('});');
      }
      b.line();
      // Start first level
      if (ast.levels.length > 0) {
        const firstSceneKey = sceneKey(ast.levels[0].name);
        b.line(`this.scene.start('${firstSceneKey}');`);
      }
    });
  });

  return b.toString();
}

function sceneKey(name: string): string {
  return 'Level_' + name.replace(/[^a-zA-Z0-9]/g, '_');
}

interface AnimOwner {
  ownerKey: string;
  anim: AnimationDef;
}

function collectAnimations(ast: GameAST): AnimOwner[] {
  const result: AnimOwner[] = [];

  for (const anim of ast.player.animations) {
    result.push({ ownerKey: ast.player.sprite, anim });
  }
  for (const enemy of ast.enemies) {
    for (const anim of enemy.animations) {
      result.push({ ownerKey: enemy.sprite, anim });
    }
  }
  for (const coll of ast.collectibles) {
    for (const anim of coll.animations) {
      result.push({ ownerKey: coll.sprite, anim });
    }
  }

  return result;
}
