import { CodeBuilder } from '../codeBuilder.js';
import type { EnemyDef, EntityPlacement } from '../../ast/types.js';

/** Generate enemy creation code for a level. */
export function generateEnemyCreate(
  enemies: readonly EnemyDef[],
  placements: readonly EntityPlacement[]
): string {
  const b = new CodeBuilder();

  if (placements.length === 0) return '';

  b.line("this.enemies = this.physics.add.group({ allowGravity: true });");
  b.line();

  for (const placement of placements) {
    const def = enemies.find((e) => e.name === placement.entity);
    if (!def) continue;

    b.line(`{`);
    b.indent();
    b.line(`const enemy = this.enemies.create(${placement.x}, ${placement.y}, '${def.sprite}');`);
    b.line(`enemy.setBounce(0);`);
    b.line(`enemy.setCollideWorldBounds(true);`);
    b.line(`enemy.enemyDef = ${JSON.stringify({ name: def.name, movement: def.movement, damage: def.damage, stompable: def.stompable })};`);

    // Initial movement
    switch (def.movement.kind) {
      case 'patrol':
        b.line(`enemy.setVelocityX(${def.movement.speed});`);
        b.line(`enemy.patrolOriginX = ${placement.x};`);
        b.line(`enemy.patrolDistance = ${def.movement.distance};`);
        b.line(`enemy.patrolSpeed = ${def.movement.speed};`);
        break;
      case 'chase':
        b.line(`enemy.chaseSpeed = ${def.movement.speed};`);
        b.line(`enemy.chaseRange = ${def.movement.range};`);
        break;
      case 'fly':
        b.line(`enemy.body.allowGravity = false;`);
        b.line(`enemy.flyOriginY = ${placement.y};`);
        b.line(`enemy.flySpeed = ${def.movement.speed};`);
        b.line(`enemy.flyAmplitude = ${def.movement.amplitude};`);
        b.line(`enemy.flyFrequency = ${def.movement.frequency};`);
        b.line(`enemy.setVelocityX(${def.movement.speed});`);
        break;
      case 'static':
        b.line(`enemy.body.allowGravity = false;`);
        b.line(`enemy.body.immovable = true;`);
        break;
    }

    b.dedent();
    b.line(`}`);
  }

  return b.toString();
}

/** Generate enemy AI update code. */
export function generateEnemyUpdate(enemies: readonly EnemyDef[]): string {
  const b = new CodeBuilder();

  const hasPatrol = enemies.some((e) => e.movement.kind === 'patrol');
  const hasChase = enemies.some((e) => e.movement.kind === 'chase');
  const hasFly = enemies.some((e) => e.movement.kind === 'fly');

  if (!hasPatrol && !hasChase && !hasFly) return '';

  b.block('if (this.enemies)', (b) => {
    b.block('this.enemies.getChildren().forEach((enemy) =>', (b) => {
      b.line('const def = enemy.enemyDef;');
      b.line('if (!def || !enemy.active) return;');
      b.line();

      if (hasPatrol) {
        b.block("if (def.movement.kind === 'patrol')", (b) => {
          b.line('const dist = Math.abs(enemy.x - enemy.patrolOriginX);');
          b.block('if (dist >= enemy.patrolDistance)', (b) => {
            b.line('enemy.setVelocityX(-enemy.body.velocity.x);');
            b.line('enemy.setFlipX(enemy.body.velocity.x < 0);');
          });
        });
      }

      if (hasChase) {
        b.block("if (def.movement.kind === 'chase')", (b) => {
          b.line('const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);');
          b.block('if (dist < enemy.chaseRange)', (b) => {
            b.line('const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);');
            b.line('enemy.setVelocityX(Math.cos(angle) * enemy.chaseSpeed);');
            b.line('enemy.setFlipX(enemy.body.velocity.x < 0);');
          });
          b.block('else', (b) => {
            b.line('enemy.setVelocityX(0);');
          });
        });
      }

      if (hasFly) {
        b.block("if (def.movement.kind === 'fly')", (b) => {
          b.line('const time = this.time.now / 1000;');
          b.line('enemy.y = enemy.flyOriginY + Math.sin(time * enemy.flyFrequency) * enemy.flyAmplitude;');
          b.line('// Reverse direction at world bounds');
          b.block('if (enemy.x <= 10 || enemy.x >= this.physics.world.bounds.width - 10)', (b) => {
            b.line('enemy.setVelocityX(-enemy.body.velocity.x);');
          });
        });
      }
    });
    b.line(');');
  });

  return b.toString();
}

/** Generate stomp + damage overlap handlers. */
export function generateEnemyCollision(): string {
  const b = new CodeBuilder();

  b.line('this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {');
  b.indent();
  b.line('const def = enemy.enemyDef;');
  b.line('if (!def) return;');
  b.line();
  b.line('// Stomp check: player falling and above enemy');
  b.line('if (def.stompable && player.body.velocity.y > 0 && player.y < enemy.y - 10) {');
  b.indent();
  b.line('enemy.destroy();');
  b.line('player.setVelocityY(-200); // bounce');
  b.line('this.score += 50;');
  b.dedent();
  b.line('} else {');
  b.indent();
  b.line('this.handlePlayerDamage(def.damage);');
  b.dedent();
  b.line('}');
  b.dedent();
  b.line('});');

  return b.toString();
}
