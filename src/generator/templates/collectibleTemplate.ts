import { CodeBuilder } from '../codeBuilder.js';
import type { CollectibleDef, EntityPlacement } from '../../ast/types.js';

/** Generate collectible creation code. */
export function generateCollectibleCreate(
  collectibles: readonly CollectibleDef[],
  placements: readonly EntityPlacement[]
): string {
  const b = new CodeBuilder();

  if (placements.length === 0) return '';

  b.line("this.collectibles = this.physics.add.group({ allowGravity: false });");
  b.line();

  for (const placement of placements) {
    const def = collectibles.find((c) => c.name === placement.entity);
    if (!def) continue;

    b.line(`{`);
    b.indent();
    b.line(`const item = this.collectibles.create(${placement.x}, ${placement.y}, '${def.sprite}');`);
    b.line(`item.collectDef = ${JSON.stringify({ name: def.name, score: def.score, effect: def.effect })};`);

    // Play animation if defined
    if (def.animations.length > 0) {
      b.line(`item.anims.play('${def.sprite}_${def.animations[0].name}');`);
    }

    b.dedent();
    b.line(`}`);
  }

  return b.toString();
}

/** Generate collectible overlap handler. */
export function generateCollectibleCollision(): string {
  const b = new CodeBuilder();

  b.line('this.physics.add.overlap(this.player, this.collectibles, (player, item) => {');
  b.indent();
  b.line('const def = item.collectDef;');
  b.line('if (!def) return;');
  b.line();
  b.line('item.destroy();');
  b.line('this.score += def.score;');
  b.line("if (this.collectSound) this.collectSound.play();");
  b.line();
  b.block("if (def.effect === 'extraLife')", (b) => {
    b.line('this.lives = Math.min(this.lives + 1, this.maxLives);');
  });
  b.block("else if (def.effect === 'speedBoost')", (b) => {
    b.line('this.player.speedMultiplier = 1.5;');
    b.line('this.time.delayedCall(5000, () => { this.player.speedMultiplier = 1; });');
  });
  b.block("else if (def.effect === 'invincible')", (b) => {
    b.line('this.player.invincible = true;');
    b.line('this.player.setAlpha(0.5);');
    b.line('this.time.delayedCall(5000, () => { this.player.invincible = false; this.player.setAlpha(1); });');
  });
  b.line();
  b.line('// Check collectAll win condition');
  b.line('if (this.winCondition === "collectAll" && this.collectibles.countActive() === 0) {');
  b.indent();
  b.line('this.handleWin();');
  b.dedent();
  b.line('}');
  b.dedent();
  b.line('});');

  return b.toString();
}
