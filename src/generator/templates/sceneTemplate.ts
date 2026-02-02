import { CodeBuilder } from '../codeBuilder.js';
import type { GameAST, LevelDef } from '../../ast/types.js';
import { generatePlayerCreate, generatePlayerUpdate, generatePlayerInputSetup } from './playerTemplate.js';
import { generateEnemyCreate, generateEnemyUpdate, generateEnemyCollision } from './enemyTemplate.js';
import { generateCollectibleCreate, generateCollectibleCollision } from './collectibleTemplate.js';
import { generateTilemapCreate } from './tilemapTemplate.js';

/** Generate a Phaser.Scene class for a single level. */
export function generateLevelScene(ast: GameAST, level: LevelDef, levelIndex: number): string {
  const b = new CodeBuilder();
  const sceneKeyStr = sceneKey(level.name);
  const nextSceneKey = ast.rules?.nextLevel
    ? sceneKey(ast.rules.nextLevel)
    : levelIndex < ast.levels.length - 1
      ? sceneKey(ast.levels[levelIndex + 1].name)
      : null;

  b.block(`class ${sceneKeyStr} extends Phaser.Scene`, (b) => {
    // Constructor
    b.block('constructor()', (b) => {
      b.line(`super({ key: '${sceneKeyStr}' });`);
    });
    b.line();

    // Create
    b.block('create()', (b) => {
      // State
      b.line('this.score = this.registry.get("score") || 0;');
      b.line(`this.lives = this.registry.get("lives") || ${ast.player.lives};`);
      b.line(`this.maxLives = ${ast.player.lives};`);
      b.line(`this.winCondition = "${ast.rules?.win?.kind || 'reachExit'}";`);
      b.line('this.isGameOver = false;');
      b.line();

      // Background
      b.line(`this.cameras.main.setBackgroundColor('${ast.config.background}');`);
      b.line();

      // Input setup
      b.raw(generatePlayerInputSetup(ast.player));
      b.line();

      // Player
      b.raw(generatePlayerCreate(ast.player, level.spawn));
      b.line();

      // Tilemap or inline platforms
      if (level.tilemap && level.layers) {
        b.raw(generateTilemapCreate(level, ast.assets));
      }

      if (level.platforms.length > 0) {
        b.line("this.platforms = this.physics.add.staticGroup();");
        for (const plat of level.platforms) {
          b.line(`this.platforms.create(${plat.x + plat.width / 2}, ${plat.y + plat.height / 2}, '${plat.asset}').setDisplaySize(${plat.width}, ${plat.height}).refreshBody();`);
        }
        b.line('this.physics.add.collider(this.player, this.platforms);');
        b.line();
      }

      // Enemies
      const enemyCode = generateEnemyCreate(ast.enemies, level.enemies);
      if (enemyCode) {
        b.raw(enemyCode);
        b.line('this.physics.add.collider(this.enemies, this.platforms || []);');
        b.line();
        b.raw(generateEnemyCollision());
        b.line();
      }

      // Collectibles
      const collectCode = generateCollectibleCreate(ast.collectibles, level.collectibles);
      if (collectCode) {
        b.raw(collectCode);
        b.line();
        b.raw(generateCollectibleCollision());
        b.line();
      }

      // Exit zone
      if (level.exit) {
        b.line(`this.exitZone = this.add.zone(${level.exit.x}, ${level.exit.y}, 40, 40);`);
        b.line('this.physics.add.existing(this.exitZone);');
        b.line('this.exitZone.body.setAllowGravity(false);');
        b.line('this.physics.add.overlap(this.player, this.exitZone, () => {');
        b.indent();
        b.line('if (this.winCondition === "reachExit") this.handleWin();');
        b.dedent();
        b.line('});');
        b.line();
      }

      // Sounds
      if (ast.sounds?.jump) {
        b.line(`this.jumpSound = this.sound.add('${ast.sounds.jump}');`);
      }
      if (ast.sounds?.collect) {
        b.line(`this.collectSound = this.sound.add('${ast.sounds.collect}');`);
      }
      if (ast.sounds?.hurt) {
        b.line(`this.hurtSound = this.sound.add('${ast.sounds.hurt}');`);
      }
      if (ast.sounds?.bgm) {
        b.line(`this.bgm = this.sound.add('${ast.sounds.bgm}', { loop: true });`);
        b.line('this.bgm.play();');
      }

      // Start HUD scene
      if (ast.hud) {
        b.line("this.scene.launch('HudScene');");
      }

      // Fall-off detection
      if (ast.rules?.lose?.kind === 'fallOff') {
        b.line('this.physics.world.setBoundsCollision(true, true, true, false);');
        b.line('this.player.setCollideWorldBounds(false);');
      }

      // Timer for survive condition
      if (ast.rules?.win?.kind === 'survive') {
        b.line(`this.surviveTime = ${(ast.rules.win as { seconds: number }).seconds};`);
        b.line('this.elapsedTime = 0;');
      }
    });
    b.line();

    // Update
    b.block('update(time, delta)', (b) => {
      b.line('if (this.isGameOver) return;');
      b.line();
      b.raw(generatePlayerUpdate(ast.player));
      b.line();
      b.raw(generateEnemyUpdate(ast.enemies));
      b.line();

      // Fall-off check
      if (ast.rules?.lose?.kind === 'fallOff') {
        b.block(`if (this.player.y > ${ast.config.height + 100})`, (b) => {
          b.line('this.handlePlayerDamage(1);');
        });
      }

      // Survive timer
      if (ast.rules?.win?.kind === 'survive') {
        b.line('this.elapsedTime += delta / 1000;');
        b.line("this.game.events.emit('updateTimer', this.surviveTime - this.elapsedTime);");
        b.block('if (this.elapsedTime >= this.surviveTime)', (b) => {
          b.line('this.handleWin();');
        });
      }

      // HUD updates
      b.line("this.game.events.emit('updateScore', this.score);");
      b.line("this.game.events.emit('updateLives', this.lives);");
    });
    b.line();

    // Damage handler
    b.block('handlePlayerDamage(amount)', (b) => {
      b.line('if (this.player.invincible) return;');
      b.line('this.lives -= amount;');
      b.line("if (this.hurtSound) this.hurtSound.play();");
      b.line();
      b.line('// Brief invincibility');
      b.line('this.player.invincible = true;');
      b.line('this.player.setAlpha(0.5);');
      b.line('this.time.delayedCall(1000, () => {');
      b.indent();
      b.line('if (this.player) { this.player.invincible = false; this.player.setAlpha(1); }');
      b.dedent();
      b.line('});');
      b.line();
      b.block('if (this.lives <= 0)', (b) => {
        b.line('this.handleGameOver();');
      });
    });
    b.line();

    // Win handler
    b.block('handleWin()', (b) => {
      b.line('if (this.isGameOver) return;');
      b.line('this.isGameOver = true;');
      b.line("if (this.bgm) this.bgm.stop();");
      b.line('this.registry.set("score", this.score);');
      b.line('this.registry.set("lives", this.lives);');
      if (nextSceneKey) {
        b.line(`this.scene.start('${nextSceneKey}');`);
      } else {
        b.line("this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'YOU WIN!', { fontSize: '48px', color: '#00ff00' }).setOrigin(0.5);");
        b.line('this.physics.pause();');
      }
    });
    b.line();

    // Game over handler
    b.block('handleGameOver()', (b) => {
      b.line('if (this.isGameOver) return;');
      b.line('this.isGameOver = true;');
      b.line("if (this.bgm) this.bgm.stop();");
      b.line('this.physics.pause();');
      b.line('this.player.setTint(0xff0000);');
      b.line("this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'GAME OVER', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);");
      b.line("this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 60, 'Click to restart', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);");
      b.line("this.input.on('pointerdown', () => {");
      b.indent();
      b.line('this.registry.set("score", 0);');
      b.line(`this.registry.set("lives", ${ast.player.lives});`);
      b.line(`this.scene.start('${sceneKey(ast.levels[0].name)}');`);
      b.dedent();
      b.line("});");
    });
  });

  return b.toString();
}

function sceneKey(name: string): string {
  return 'Level_' + name.replace(/[^a-zA-Z0-9]/g, '_');
}
