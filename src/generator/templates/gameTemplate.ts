import { CodeBuilder } from '../codeBuilder.js';
import type { GameAST, CompileOptions } from '../../ast/types.js';
import { generatePreloadScene } from './preloadTemplate.js';
import { generateLevelScene } from './sceneTemplate.js';
import { generateHudScene } from './hudTemplate.js';

const DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js';

/** Generate a complete standalone HTML file with an embedded Phaser game. */
export function generateStandaloneHTML(ast: GameAST, options?: CompileOptions): string {
  const phaserCdn = options?.phaserCdn ?? DEFAULT_CDN;

  const b = new CodeBuilder();

  b.line('<!DOCTYPE html>');
  b.line('<html lang="en">');
  b.line('<head>');
  b.indent();
  b.line('<meta charset="UTF-8">');
  b.line('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  b.line(`<title>${escapeHtml(ast.title)}</title>`);
  b.line('<style>');
  b.indent();
  b.line('* { margin: 0; padding: 0; }');
  b.line('body { background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }');
  b.dedent();
  b.line('</style>');
  b.line(`<script src="${phaserCdn}"><\/script>`);
  b.dedent();
  b.line('</head>');
  b.line('<body>');
  b.line('<script>');

  // Generate all scene classes
  b.raw(generatePreloadScene(ast));
  b.line();

  for (let i = 0; i < ast.levels.length; i++) {
    b.raw(generateLevelScene(ast, ast.levels[i], i));
    b.line();
  }

  if (ast.hud) {
    b.raw(generateHudScene(ast.hud, ast.player.lives));
    b.line();
  }

  // Generate Phaser.Game config
  const sceneList = ['BootScene'];
  for (const level of ast.levels) {
    sceneList.push(sceneKey(level.name));
  }
  if (ast.hud) {
    sceneList.push('HudScene');
  }

  b.line('const config = {');
  b.indent();
  b.line('type: Phaser.AUTO,');
  b.line(`width: ${ast.config.width},`);
  b.line(`height: ${ast.config.height},`);
  b.line('physics: {');
  b.indent();
  b.line("default: 'arcade',");
  b.line('arcade: {');
  b.indent();
  b.line(`gravity: { y: ${ast.config.gravity} },`);
  b.line('debug: false,');
  b.dedent();
  b.line('},');
  b.dedent();
  b.line('},');
  b.line(`scene: [${sceneList.join(', ')}],`);
  b.dedent();
  b.line('};');
  b.line();
  b.line('const game = new Phaser.Game(config);');

  b.line('<\/script>');
  b.line('</body>');
  b.line('</html>');

  return b.toString();
}

function sceneKey(name: string): string {
  return 'Level_' + name.replace(/[^a-zA-Z0-9]/g, '_');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
