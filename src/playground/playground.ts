import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { compile, parseToAST } from '../compiler.js';
import { updatePreview } from '../editor/preview.js';

// ─── Event Bus (Observer pattern for component communication) ───

type EventHandler = (...args: any[]) => void;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler): void {
    const list = this.handlers.get(event) || [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  emit(event: string, ...args: any[]): void {
    (this.handlers.get(event) || []).forEach((h) => h(...args));
  }
}

const bus = new EventBus();

// ─── DSL Syntax Highlighting ──────────────────────────────

const dslLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.match('//')) { stream.skipToEnd(); return 'comment'; }
    if (stream.match('/*')) { while (!stream.match('*/') && !stream.eol()) stream.next(); return 'comment'; }
    if (stream.match('"')) { while (!stream.match('"') && !stream.eol()) { if (stream.next() === '\\') stream.next(); } return 'string'; }
    if (stream.match(/#[0-9a-fA-F]{6}/)) return 'atom';
    if (stream.match(/-?\d+(\.\d+)?/)) return 'number';

    const keywords = ['game','config','assets','player','enemy','collectible','level','hud','rules','sounds','animation','spritesheet','image','tilemap','audio','patrol','chase','fly','static','reachExit','collectAll','defeatAll','survive','noLives','timerExpires','fallOff','extraLife','speedBoost','invincible','none','arrows','wasd','both','true','false','at'];
    const properties = ['width','height','gravity','background','sprite','speed','jumpForce','lives','controls','movement','damage','stompable','score','effect','frameWidth','frameHeight','frames','fps','loop','layers','spawn','enemies','coins','platforms','exit','position','fontSize','color','max','win','lose','nextLevel','jump','collect','hurt','bgm','distance','range','amplitude','frequency'];

    if (stream.match(/[a-zA-Z_]\w*/)) {
      const word = stream.current();
      if (keywords.includes(word)) return 'keyword';
      if (properties.includes(word)) return 'propertyName';
      return 'variableName';
    }
    if (stream.match(/[{}()\[\]:,]/)) return 'punctuation';
    stream.next();
    return null;
  },
});

// ─── Example DSL ──────────────────────────────────────────

const PLAYGROUND_SOURCE = `game "Playground Demo" {
  config { width: 800, height: 600, gravity: 500, background: #87CEEB }

  assets {
    image plat "assets/platform.png"
  }

  player {
    sprite: plat
    speed: 200
    jumpForce: 400
    lives: 3
    controls: arrows
  }

  enemy goomba {
    sprite: plat
    movement: patrol { speed: 60, distance: 150 }
    damage: 1
    stompable: true
  }

  collectible coin {
    sprite: plat
    score: 10
  }

  level "Level 1" {
    spawn: { x: 50, y: 400 }
    platforms: [
      plat at (0, 580, 800, 20),
      plat at (200, 450, 150, 20),
      plat at (450, 350, 150, 20)
    ]
    enemies: [goomba at (300, 400)]
    coins: [coin at (250, 400), coin at (500, 300)]
    exit: { x: 750, y: 300 }
  }

  level "Level 2" {
    spawn: { x: 50, y: 400 }
    platforms: [
      plat at (0, 580, 800, 20),
      plat at (100, 450, 200, 20),
      plat at (400, 350, 200, 20),
      plat at (600, 250, 150, 20)
    ]
    coins: [coin at (150, 400), coin at (500, 300), coin at (650, 200)]
    exit: { x: 700, y: 200 }
  }

  hud {
    score { position: top-left, fontSize: 24, color: #FFFFFF }
    lives { position: top-right, max: 3 }
  }

  rules { win: reachExit, lose: noLives, nextLevel: "Level 2" }
}`;

// ─── DOM References ───────────────────────────────────────

const editorContainer = document.getElementById('editor')!;
const previewFrame = document.getElementById('preview') as HTMLIFrameElement;
const errorBar = document.getElementById('errorBar')!;
const compileBtn = document.getElementById('compileBtn')!;
const exportBtn = document.getElementById('exportBtn')!;
const levelTabsContainer = document.getElementById('levelTabs')!;
const entityList = document.getElementById('entityList')!;

// ─── Editor Setup ─────────────────────────────────────────

const editorState = EditorState.create({
  doc: PLAYGROUND_SOURCE,
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
    const ast = parseToAST(source);
    const result = compile(source);
    lastCompiledHtml = result.html;
    updatePreview(previewFrame, result.html);
    errorBar.textContent = 'Compiled successfully';
    errorBar.className = 'success';

    // Update level tabs
    bus.emit('levelsChanged', ast.levels.map((l) => l.name));

    // Update entity panel
    bus.emit('entitiesChanged', {
      enemies: ast.enemies.map((e) => e.name),
      collectibles: ast.collectibles.map((c) => c.name),
    });
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

// ─── Level Tabs ───────────────────────────────────────────

let activeLevel = 0;

bus.on('levelsChanged', (levelNames: string[]) => {
  levelTabsContainer.innerHTML = '';
  levelNames.forEach((name, i) => {
    const tab = document.createElement('button');
    tab.className = 'level-tab' + (i === activeLevel ? ' active' : '');
    tab.textContent = name;
    tab.addEventListener('click', () => {
      activeLevel = i;
      // Jump editor cursor to this level's definition
      const doc = editorView.state.doc.toString();
      const levelPattern = `level "${name}"`;
      const idx = doc.indexOf(levelPattern);
      if (idx >= 0) {
        editorView.dispatch({
          selection: { anchor: idx },
          scrollIntoView: true,
        });
        editorView.focus();
      }
      // Update active tab
      document.querySelectorAll('.level-tab').forEach((t, j) => {
        t.classList.toggle('active', j === i);
      });
    });
    levelTabsContainer.appendChild(tab);
  });
});

// ─── Entity Panel ─────────────────────────────────────────

bus.on('entitiesChanged', ({ enemies, collectibles }: { enemies: string[]; collectibles: string[] }) => {
  entityList.innerHTML = '';

  const playerChip = document.createElement('span');
  playerChip.className = 'entity-chip player';
  playerChip.textContent = 'player';
  entityList.appendChild(playerChip);

  enemies.forEach((name) => {
    const chip = document.createElement('span');
    chip.className = 'entity-chip enemy';
    chip.textContent = name;
    entityList.appendChild(chip);
  });

  collectibles.forEach((name) => {
    const chip = document.createElement('span');
    chip.className = 'entity-chip collectible';
    chip.textContent = name;
    entityList.appendChild(chip);
  });
});

// ─── Toolbar Actions ──────────────────────────────────────

compileBtn.addEventListener('click', doCompile);

exportBtn.addEventListener('click', () => {
  if (!lastCompiledHtml) doCompile();
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
