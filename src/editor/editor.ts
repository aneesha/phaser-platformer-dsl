import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { compile } from '../compiler.js';
import { updatePreview } from './preview.js';

// ─── DSL Syntax Highlighting ──────────────────────────────

const dslLanguage = StreamLanguage.define({
  token(stream) {
    // Comments
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }
    if (stream.match('/*')) {
      while (!stream.match('*/') && !stream.eol()) stream.next();
      return 'comment';
    }

    // Strings
    if (stream.match('"')) {
      while (!stream.match('"') && !stream.eol()) {
        if (stream.next() === '\\') stream.next();
      }
      return 'string';
    }

    // Colors
    if (stream.match(/#[0-9a-fA-F]{6}/)) {
      return 'atom';
    }

    // Numbers
    if (stream.match(/-?\d+(\.\d+)?/)) {
      return 'number';
    }

    // Keywords
    const keywords = [
      'game', 'config', 'assets', 'player', 'enemy', 'collectible',
      'level', 'hud', 'rules', 'sounds', 'animation',
      'spritesheet', 'image', 'tilemap', 'audio',
      'patrol', 'chase', 'fly', 'static',
      'reachExit', 'collectAll', 'defeatAll', 'survive',
      'noLives', 'timerExpires', 'fallOff',
      'extraLife', 'speedBoost', 'invincible', 'none',
      'arrows', 'wasd', 'both', 'true', 'false', 'at',
    ];

    const properties = [
      'width', 'height', 'gravity', 'background',
      'sprite', 'speed', 'jumpForce', 'lives', 'controls',
      'movement', 'damage', 'stompable', 'score', 'effect',
      'frameWidth', 'frameHeight', 'frames', 'fps', 'loop',
      'layers', 'spawn', 'enemies', 'coins', 'platforms', 'exit',
      'position', 'fontSize', 'color', 'max',
      'win', 'lose', 'nextLevel',
      'jump', 'collect', 'hurt', 'bgm',
      'distance', 'range', 'amplitude', 'frequency',
    ];

    if (stream.match(/[a-zA-Z_]\w*/)) {
      const word = stream.current();
      if (keywords.includes(word)) return 'keyword';
      if (properties.includes(word)) return 'propertyName';
      return 'variableName';
    }

    // Punctuation
    if (stream.match(/[{}()\[\]:,]/)) {
      return 'punctuation';
    }

    stream.next();
    return null;
  },
});

// ─── Default DSL Source ────────────────────────────────────

const DEFAULT_SOURCE = `game "My Platformer" {
  config { width: 800, height: 600, gravity: 500, background: #87CEEB }

  assets {
    image platform "assets/platform.png"
  }

  player {
    sprite: platform
    speed: 200
    jumpForce: 400
    lives: 3
    controls: arrows
  }

  level "Level 1" {
    spawn: { x: 50, y: 400 }
    platforms: [
      platform at (0, 580, 800, 20),
      platform at (200, 450, 150, 20),
      platform at (450, 350, 150, 20)
    ]
    exit: { x: 750, y: 300 }
  }

  rules { win: reachExit, lose: noLives }
}`;

// ─── Initialize Editor ────────────────────────────────────

const editorContainer = document.getElementById('editor')!;
const previewFrame = document.getElementById('preview') as HTMLIFrameElement;
const errorBar = document.getElementById('errorBar')!;
const compileBtn = document.getElementById('compileBtn')!;
const exportBtn = document.getElementById('exportBtn')!;

const editorState = EditorState.create({
  doc: DEFAULT_SOURCE,
  extensions: [
    basicSetup,
    dslLanguage,
    EditorView.theme({
      '&': { height: '100%' },
      '.cm-scroller': { overflow: 'auto' },
      '.cm-content': { fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace", fontSize: '14px' },
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        debouncedCompile();
      }
    }),
  ],
});

const editorView = new EditorView({
  state: editorState,
  parent: editorContainer,
});

// ─── Compilation ──────────────────────────────────────────

let compileTimeout: ReturnType<typeof setTimeout> | null = null;
let lastCompiledHtml = '';

function doCompile(): void {
  const source = editorView.state.doc.toString();
  try {
    const result = compile(source);
    lastCompiledHtml = result.html;
    updatePreview(previewFrame, result.html);
    errorBar.textContent = 'Compiled successfully';
    errorBar.className = 'success';
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errorBar.textContent = message;
    errorBar.className = 'error';
  }
}

function debouncedCompile(): void {
  if (compileTimeout) clearTimeout(compileTimeout);
  compileTimeout = setTimeout(doCompile, 500);
}

// ─── Toolbar Actions ──────────────────────────────────────

compileBtn.addEventListener('click', doCompile);

exportBtn.addEventListener('click', () => {
  if (!lastCompiledHtml) {
    doCompile();
  }
  const blob = new Blob([lastCompiledHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'game.html';
  a.click();
  URL.revokeObjectURL(url);
});

// ─── Initial Compile ──────────────────────────────────────

doCompile();
