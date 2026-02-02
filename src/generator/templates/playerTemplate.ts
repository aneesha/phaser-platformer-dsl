import { CodeBuilder } from '../codeBuilder.js';
import type { PlayerDef } from '../../ast/types.js';

/** Generate player creation code inside a scene's create() method. */
export function generatePlayerCreate(player: PlayerDef, spawn: { x: number; y: number }): string {
  const b = new CodeBuilder();

  b.line(`this.player = this.physics.add.sprite(${spawn.x}, ${spawn.y}, '${player.sprite}');`);
  b.line('this.player.setCollideWorldBounds(true);');
  b.line(`this.player.setBounce(0.1);`);

  return b.toString();
}

/** Generate player control/update code inside a scene's update() method. */
export function generatePlayerUpdate(player: PlayerDef): string {
  const b = new CodeBuilder();

  // Input references
  const useArrows = player.controls === 'arrows' || player.controls === 'both';
  const useWasd = player.controls === 'wasd' || player.controls === 'both';

  if (useArrows) {
    b.line('const cursors = this.cursors;');
  }
  if (useWasd) {
    b.line('const wasd = this.wasd;');
  }

  b.line();
  b.line(`const speed = ${player.speed};`);
  b.line('this.player.setVelocityX(0);');
  b.line();

  // Horizontal movement
  const leftConditions: string[] = [];
  const rightConditions: string[] = [];
  if (useArrows) {
    leftConditions.push('cursors.left.isDown');
    rightConditions.push('cursors.right.isDown');
  }
  if (useWasd) {
    leftConditions.push('wasd.left.isDown');
    rightConditions.push('wasd.right.isDown');
  }

  b.block(`if (${leftConditions.join(' || ')})`, (b) => {
    b.line('this.player.setVelocityX(-speed);');
    b.line("this.player.setFlipX(true);");
    if (player.animations.find((a) => a.name === 'walk')) {
      b.line(`if (this.player.body.onFloor()) this.player.anims.play('${player.sprite}_walk', true);`);
    }
  });
  b.block(`else if (${rightConditions.join(' || ')})`, (b) => {
    b.line('this.player.setVelocityX(speed);');
    b.line("this.player.setFlipX(false);");
    if (player.animations.find((a) => a.name === 'walk')) {
      b.line(`if (this.player.body.onFloor()) this.player.anims.play('${player.sprite}_walk', true);`);
    }
  });
  b.block('else', (b) => {
    b.line("this.player.anims.stop();");
  });

  b.line();

  // Jump
  const jumpConditions: string[] = [];
  if (useArrows) jumpConditions.push('cursors.up.isDown');
  if (useWasd) jumpConditions.push('wasd.up.isDown');

  b.block(`if ((${jumpConditions.join(' || ')}) && this.player.body.onFloor())`, (b) => {
    b.line(`this.player.setVelocityY(-${player.jumpForce});`);
    if (player.animations.find((a) => a.name === 'jump')) {
      b.line(`this.player.anims.play('${player.sprite}_jump', true);`);
    }
    b.line("if (this.jumpSound) this.jumpSound.play();");
  });

  return b.toString();
}

/** Generate input setup code. */
export function generatePlayerInputSetup(player: PlayerDef): string {
  const b = new CodeBuilder();

  if (player.controls === 'arrows' || player.controls === 'both') {
    b.line('this.cursors = this.input.keyboard.createCursorKeys();');
  }
  if (player.controls === 'wasd' || player.controls === 'both') {
    b.line("this.wasd = {");
    b.indent();
    b.line("up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),");
    b.line("down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),");
    b.line("left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),");
    b.line("right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),");
    b.dedent();
    b.line("};");
  }

  return b.toString();
}
