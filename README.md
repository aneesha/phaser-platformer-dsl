# Phaser Platformer DSL

A simple, expressive domain-specific language for generating Phaser.js platformer games. Write a `.pf` file describing your game and compile it into a standalone, playable HTML file.

## Quick Start

```bash
npm install
npm run build
```

### Write a game

Create a `game.pf` file:

```
game "My Platformer" {
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

  enemy goomba {
    sprite: platform
    movement: patrol { speed: 60, distance: 150 }
    damage: 1
    stompable: true
  }

  collectible coin {
    sprite: platform
    score: 10
  }

  level "Level 1" {
    spawn: { x: 50, y: 400 }
    platforms: [
      platform at (0, 580, 800, 20),
      platform at (200, 450, 150, 20)
    ]
    enemies: [goomba at (300, 400)]
    coins: [coin at (250, 400)]
    exit: { x: 750, y: 300 }
  }

  hud {
    score { position: top-left, fontSize: 24, color: #FFFFFF }
    lives { position: top-right, max: 3 }
  }

  rules { win: reachExit, lose: noLives }
}
```

### Compile it

```js
import { compile } from 'phaser-platformer-dsl';

const result = compile(source);
// result.html is a standalone HTML file with an embedded Phaser game
```

Or use the CLI:

```bash
npm run generate-examples
```

## API

### `compile(source: string, options?: CompileOptions): CompileResult`

Compile DSL source into a standalone Phaser.js game. Returns `{ html: string, errors: string[] }`.

### `parseToAST(source: string): GameAST`

Parse DSL source into a typed AST (with defaults applied).

### `generate(ast: GameAST, options?: CompileOptions): CompileResult`

Generate Phaser.js code from a validated AST.

### Options

```ts
interface CompileOptions {
  mode?: 'standalone-html' | 'module' | 'embed';
  phaserCdn?: string;  // default: jsdelivr CDN
  minify?: boolean;
}
```

## DSL Reference

### Game Structure

```
game "Title" {
  config { ... }
  assets { ... }
  player { ... }
  enemy <name> { ... }
  collectible <name> { ... }
  level "Name" { ... }
  hud { ... }
  rules { ... }
  sounds { ... }
}
```

### Config Block

| Property | Type | Default | Description |
|---|---|---|---|
| `width` | number | 800 | Game canvas width |
| `height` | number | 600 | Game canvas height |
| `gravity` | number | 500 | World gravity (y-axis) |
| `background` | color | #87CEEB | Background color |

### Assets Block

```
assets {
  image <key> "<path>"
  spritesheet <key> "<path>" { frameWidth: 32, frameHeight: 48 }
  tilemap <key> "<path>"
  audio <key> "<path>"
}
```

### Player Block

| Property | Type | Default | Description |
|---|---|---|---|
| `sprite` | ident | required | Asset key for player sprite |
| `speed` | number | 160 | Horizontal movement speed |
| `jumpForce` | number | 330 | Jump velocity |
| `lives` | number | 3 | Starting lives |
| `controls` | arrows/wasd/both | arrows | Input scheme |
| `animation <name> { ... }` | block | - | Animation definition |

### Enemy Block

```
enemy <name> {
  sprite: <key>
  movement: patrol { speed: 60, distance: 150 }  // or chase, fly, static
  damage: 1
  stompable: true
}
```

**Movement patterns:**
- `patrol { speed, distance }` — walk back and forth
- `chase { speed, range }` — move toward player when in range
- `fly { speed, amplitude, frequency }` — sinusoidal flight
- `static` — stationary hazard

### Collectible Block

```
collectible <name> {
  sprite: <key>
  score: 10
  effect: none  // extraLife, speedBoost, invincible, none
}
```

### Level Block

Levels support two modes: tilemap-based or inline platforms.

**Inline platforms:**
```
level "Level 1" {
  spawn: { x: 50, y: 400 }
  platforms: [<asset> at (x, y, width, height), ...]
  enemies: [<enemy> at (x, y), ...]
  coins: [<collectible> at (x, y), ...]
  exit: { x: 750, y: 300 }
}
```

**Tilemap-based:**
```
level "Level 1" {
  tilemap: <key>
  layers: { ground: "Ground", platforms: "Platforms" }
  spawn: { x: 50, y: 300 }
  enemies: [...]
  coins: [...]
  exit: { x: 750, y: 400 }
}
```

### HUD Block

```
hud {
  score { position: top-left, fontSize: 24, color: #FFFFFF }
  lives { position: top-right, max: 3 }
  timer { position: top-center }
}
```

Positions: `top-left`, `top-right`, `top-center`, `bottom-left`, `bottom-right`, `bottom-center`

### Rules Block

```
rules {
  win: reachExit,      // collectAll <entity>, defeatAll, survive <seconds>
  lose: noLives,       // timerExpires, fallOff
  nextLevel: "Level 2"
}
```

### Sounds Block

```
sounds {
  jump: <audioKey>
  collect: <audioKey>
  hurt: <audioKey>
  win: <audioKey>
  lose: <audioKey>
  bgm: <audioKey>
}
```

### Comments

```
// Single-line comment
/* Multi-line
   comment */
```

## Editor

Launch the web-based editor with live preview:

```bash
npm run dev:editor
```

Open `http://localhost:3000`. Edit DSL on the left, see the game update live on the right.

## Playground

Launch the extended playground with level tabs and entity panel:

```bash
npm run dev:playground
```

Open `http://localhost:3001`.

## Examples

Three example games are included:

| Example | Description |
|---|---|
| `examples/simple-platformer/` | Single level, basic enemies and coins |
| `examples/coin-collector/` | Multiple enemy types, collectAll win, effects |
| `examples/multi-level/` | 3 levels with transitions, varied enemies |

Generate the HTML files:

```bash
npm run generate-examples
```

Then open any `examples/*/index.html` in a browser.

## Development

```bash
npm test            # Run all tests (103 tests)
npm run test:watch  # Watch mode
npm run typecheck   # TypeScript type checking
npm run build       # Build dist bundles
```

## Architecture

```
DSL Source (.pf) → Ohm.js Grammar → Semantic Actions → AST → Validator → Code Generator → HTML + Phaser.js
```

**Design patterns:** Visitor (semantic actions), Builder (code generation), Strategy (enemy AI), Facade (`compile()`), Observer (editor/preview), Registry (assets/entities).

## License

MIT
