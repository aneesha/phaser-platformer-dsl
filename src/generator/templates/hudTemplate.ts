import { CodeBuilder } from '../codeBuilder.js';
import type { HudDef, HudElementDef } from '../../ast/types.js';
import { hexToInt } from '../../utils/strings.js';

/** Generate the HUD overlay scene. */
export function generateHudScene(hud: HudDef | undefined, maxLives: number): string {
  const b = new CodeBuilder();

  b.block('class HudScene extends Phaser.Scene', (b) => {
    b.block('constructor()', (b) => {
      b.line("super({ key: 'HudScene', active: false });");
    });
    b.line();
    b.block('create()', (b) => {
      b.line('this.scoreText = null;');
      b.line('this.livesText = null;');
      b.line('this.timerText = null;');
      b.line();

      if (hud) {
        for (const el of hud.elements) {
          generateHudElement(b, el, maxLives);
        }
      }

      b.line();
      b.line('// Listen for HUD update events');
      b.line("this.scene.get('BootScene'); // reference");
      b.line("this.game.events.on('updateScore', (score) => {");
      b.indent();
      b.line("if (this.scoreText) this.scoreText.setText('Score: ' + score);");
      b.dedent();
      b.line("});");
      b.line("this.game.events.on('updateLives', (lives) => {");
      b.indent();
      b.line("if (this.livesText) this.livesText.setText('Lives: ' + lives);");
      b.dedent();
      b.line("});");
      b.line("this.game.events.on('updateTimer', (time) => {");
      b.indent();
      b.line("if (this.timerText) this.timerText.setText('Time: ' + Math.ceil(time));");
      b.dedent();
      b.line("});");
    });
  });

  return b.toString();
}

function generateHudElement(b: CodeBuilder, el: HudElementDef, maxLives: number): void {
  const { x, y } = positionToXY(el.position);
  const fontSize = el.fontSize ?? 20;
  const color = el.color ?? '#FFFFFF';

  switch (el.type) {
    case 'score':
      b.line(
        `this.scoreText = this.add.text(${x}, ${y}, 'Score: 0', { fontSize: '${fontSize}px', color: '${color}' });`
      );
      break;
    case 'lives':
      b.line(
        `this.livesText = this.add.text(${x}, ${y}, 'Lives: ${maxLives}', { fontSize: '${fontSize}px', color: '${color}' });`
      );
      break;
    case 'timer':
      b.line(
        `this.timerText = this.add.text(${x}, ${y}, 'Time: 0', { fontSize: '${fontSize}px', color: '${color}' });`
      );
      break;
  }
}

function positionToXY(position: string): { x: number; y: number } {
  switch (position) {
    case 'top-left':
      return { x: 16, y: 16 };
    case 'top-right':
      return { x: 700, y: 16 };
    case 'top-center':
      return { x: 350, y: 16 };
    case 'bottom-left':
      return { x: 16, y: 560 };
    case 'bottom-right':
      return { x: 700, y: 560 };
    case 'bottom-center':
      return { x: 350, y: 560 };
    default:
      return { x: 16, y: 16 };
  }
}
