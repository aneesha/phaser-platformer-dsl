/* eslint-disable @typescript-eslint/no-explicit-any */
import { grammar } from '../grammar/index.js';
import type {
  GameAST,
  GameConfig,
  AssetDef,
  PlayerDef,
  EnemyDef,
  CollectibleDef,
  LevelDef,
  HudDef,
  HudElementDef,
  RulesDef,
  SoundsDef,
  AnimationDef,
  MovementPattern,
  WinCondition,
  LoseCondition,
  EntityPlacement,
  PlatformDef,
  ControlScheme,
  CollectibleEffect,
  HudPosition,
  SpritesheetConfig,
} from '../ast/types.js';

// Ohm semantic action nodes are dynamically typed.
// We use `any` for node parameters since `.toAST()` is added at runtime.
type N = any;

const semantics = grammar.createSemantics();

// ─── Helper: collect properties from a list of nodes ─────────

type PropBag = Record<string, unknown>;

function collectProps(nodes: N[]): PropBag {
  const bag: PropBag = {};
  for (const node of nodes) {
    const result = node.toAST() as PropBag;
    for (const [key, value] of Object.entries(result)) {
      if (Array.isArray(value) && Array.isArray(bag[key])) {
        bag[key] = [...(bag[key] as unknown[]), ...value];
      } else {
        bag[key] = value;
      }
    }
  }
  return bag;
}

// ─── Semantic Actions ────────────────────────────────────────

semantics.addOperation<unknown>('toAST', {
  // ─── Top Level ───────────────────────────────────────────

  Game(_game: N, title: N, _lb: N, blocks: N, _rb: N) {
    const gameTitle = title.toAST() as string;
    let config: Partial<GameConfig> = {};
    const assets: AssetDef[] = [];
    let player: Partial<PlayerDef> | undefined;
    const enemies: EnemyDef[] = [];
    const collectibles: CollectibleDef[] = [];
    const levels: LevelDef[] = [];
    let hud: HudDef | undefined;
    let rules: RulesDef | undefined;
    let sounds: SoundsDef | undefined;

    for (const block of blocks.children) {
      const result = block.toAST() as { __block: string; value: unknown };
      switch (result.__block) {
        case 'config':
          config = result.value as GameConfig;
          break;
        case 'assets':
          assets.push(...(result.value as AssetDef[]));
          break;
        case 'player':
          player = result.value as PlayerDef;
          break;
        case 'enemy':
          enemies.push(result.value as EnemyDef);
          break;
        case 'collectible':
          collectibles.push(result.value as CollectibleDef);
          break;
        case 'level':
          levels.push(result.value as LevelDef);
          break;
        case 'hud':
          hud = result.value as HudDef;
          break;
        case 'rules':
          rules = result.value as RulesDef;
          break;
        case 'sounds':
          sounds = result.value as SoundsDef;
          break;
      }
    }

    return { title: gameTitle, config, assets, player, enemies, collectibles, levels, hud, rules, sounds };
  },

  GameBlock(block: N) {
    return block.toAST();
  },

  // ─── Config ──────────────────────────────────────────────

  ConfigBlock(_config: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    const props = collectProps([first, ...rest.children]);
    return { __block: 'config', value: props };
  },

  ConfigProp_width(_key: N, _colon: N, val: N) {
    return { width: val.toAST() };
  },
  ConfigProp_height(_key: N, _colon: N, val: N) {
    return { height: val.toAST() };
  },
  ConfigProp_gravity(_key: N, _colon: N, val: N) {
    return { gravity: val.toAST() };
  },
  ConfigProp_background(_key: N, _colon: N, val: N) {
    return { background: val.toAST() };
  },

  // ─── Assets ──────────────────────────────────────────────

  AssetsBlock(_assets: N, _lb: N, defs: N, _rb: N) {
    const assetList = defs.children.map((d: N) => d.toAST() as AssetDef);
    return { __block: 'assets', value: assetList };
  },

  AssetDef_spritesheet(_kw: N, key: N, path: N, config: N) {
    return {
      type: 'spritesheet' as const,
      key: key.toAST() as string,
      path: path.toAST() as string,
      config: config.toAST() as SpritesheetConfig,
    };
  },
  AssetDef_image(_kw: N, key: N, path: N) {
    return {
      type: 'image' as const,
      key: key.toAST() as string,
      path: path.toAST() as string,
    };
  },
  AssetDef_tilemap(_kw: N, key: N, path: N) {
    return {
      type: 'tilemap' as const,
      key: key.toAST() as string,
      path: path.toAST() as string,
    };
  },
  AssetDef_audio(_kw: N, key: N, path: N) {
    return {
      type: 'audio' as const,
      key: key.toAST() as string,
      path: path.toAST() as string,
    };
  },

  SpritesheetConfig(_lb: N, _fwKey: N, _c1: N, fw: N, _comma: N, _fhKey: N, _c2: N, fh: N, _trailing: N, _rb: N) {
    return {
      frameWidth: fw.toAST() as number,
      frameHeight: fh.toAST() as number,
    };
  },

  // ─── Player ──────────────────────────────────────────────

  PlayerBlock(_player: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    const props = collectProps([first, ...rest.children]);
    const animations = (props.animations || []) as AnimationDef[];
    delete props.animations;
    return { __block: 'player', value: { ...props, animations } };
  },

  PlayerProp_sprite(_key: N, _colon: N, val: N) { return { sprite: val.toAST() }; },
  PlayerProp_speed(_key: N, _colon: N, val: N) { return { speed: val.toAST() }; },
  PlayerProp_jumpForce(_key: N, _colon: N, val: N) { return { jumpForce: val.toAST() }; },
  PlayerProp_lives(_key: N, _colon: N, val: N) { return { lives: val.toAST() }; },
  PlayerProp_controls(_key: N, _colon: N, val: N) { return { controls: val.toAST() }; },
  PlayerProp_animation(animBlock: N) {
    return { animations: [animBlock.toAST() as AnimationDef] };
  },

  // ─── Enemies ─────────────────────────────────────────────

  EnemyBlock(_enemy: N, name: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    const props = collectProps([first, ...rest.children]);
    const animations = (props.animations || []) as AnimationDef[];
    delete props.animations;
    return { __block: 'enemy', value: { name: name.toAST(), ...props, animations } };
  },

  EnemyProp_sprite(_key: N, _colon: N, val: N) { return { sprite: val.toAST() }; },
  EnemyProp_movement(_key: N, _colon: N, val: N) { return { movement: val.toAST() }; },
  EnemyProp_damage(_key: N, _colon: N, val: N) { return { damage: val.toAST() }; },
  EnemyProp_stompable(_key: N, _colon: N, val: N) { return { stompable: val.toAST() }; },
  EnemyProp_animation(animBlock: N) {
    return { animations: [animBlock.toAST() as AnimationDef] };
  },

  MovementDef_patrol(_kw: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    return { kind: 'patrol', ...collectProps([first, ...rest.children]) } as MovementPattern;
  },
  MovementDef_chase(_kw: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    return { kind: 'chase', ...collectProps([first, ...rest.children]) } as MovementPattern;
  },
  MovementDef_fly(_kw: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    return { kind: 'fly', ...collectProps([first, ...rest.children]) } as MovementPattern;
  },
  MovementDef_static(_kw: N) {
    return { kind: 'static' } as MovementPattern;
  },

  MovementParam_speed(_key: N, _colon: N, val: N) { return { speed: val.toAST() }; },
  MovementParam_distance(_key: N, _colon: N, val: N) { return { distance: val.toAST() }; },
  MovementParam_range(_key: N, _colon: N, val: N) { return { range: val.toAST() }; },
  MovementParam_amplitude(_key: N, _colon: N, val: N) { return { amplitude: val.toAST() }; },
  MovementParam_frequency(_key: N, _colon: N, val: N) { return { frequency: val.toAST() }; },

  // ─── Collectibles ────────────────────────────────────────

  CollectibleBlock(_coll: N, name: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    const props = collectProps([first, ...rest.children]);
    const animations = (props.animations || []) as AnimationDef[];
    delete props.animations;
    return { __block: 'collectible', value: { name: name.toAST(), effect: 'none', ...props, animations } };
  },

  CollectibleProp_sprite(_key: N, _colon: N, val: N) { return { sprite: val.toAST() }; },
  CollectibleProp_score(_key: N, _colon: N, val: N) { return { score: val.toAST() }; },
  CollectibleProp_effect(_key: N, _colon: N, val: N) { return { effect: val.toAST() }; },
  CollectibleProp_animation(animBlock: N) {
    return { animations: [animBlock.toAST() as AnimationDef] };
  },

  // ─── Levels ──────────────────────────────────────────────

  LevelBlock(_level: N, name: N, _lb: N, props: N, _rb: N) {
    const bag = collectProps(props.children);
    return {
      __block: 'level',
      value: {
        name: name.toAST() as string,
        enemies: [] as EntityPlacement[],
        collectibles: [] as EntityPlacement[],
        platforms: [] as any[],
        ...bag,
      },
    };
  },

  LevelProp_tilemap(_key: N, _colon: N, val: N) { return { tilemap: val.toAST() }; },
  LevelProp_layers(_key: N, _colon: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    const layers: Record<string, string> = {};
    const firstMapping = first.toAST() as [string, string];
    layers[firstMapping[0]] = firstMapping[1];
    for (const child of rest.children) {
      const mapping = (child as N).toAST() as [string, string];
      layers[mapping[0]] = mapping[1];
    }
    return { layers };
  },
  LevelProp_spawn(_key: N, _colon: N, _lb: N, _xk: N, _xc: N, x: N, _comma: N, _yk: N, _yc: N, y: N, _rb: N) {
    return { spawn: { x: x.toAST() as number, y: y.toAST() as number } };
  },
  LevelProp_enemies(_key: N, _colon: N, _lb: N, list: N, _rb: N) {
    return { enemies: list.toAST() };
  },
  LevelProp_coins(_key: N, _colon: N, _lb: N, list: N, _rb: N) {
    return { collectibles: list.toAST() };
  },
  LevelProp_platforms(_key: N, _colon: N, _lb: N, list: N, _rb: N) {
    return { platforms: list.toAST() };
  },
  LevelProp_exit(_key: N, _colon: N, _lb: N, _xk: N, _xc: N, x: N, _comma: N, _yk: N, _yc: N, y: N, _rb: N) {
    return { exit: { x: x.toAST() as number, y: y.toAST() as number } };
  },

  LayerMapping(key: N, _colon: N, val: N) {
    return [key.toAST(), val.toAST()];
  },

  EntityPlacement(entity: N, _at: N, _lp: N, x: N, _comma: N, y: N, _rp: N) {
    return { entity: entity.toAST(), x: x.toAST(), y: y.toAST() } as EntityPlacement;
  },

  PlatformPlacement(asset: N, _at: N, _lp: N, x: N, _c1: N, y: N, _c2: N, w: N, _c3: N, h: N, _rp: N) {
    return { asset: asset.toAST(), x: x.toAST(), y: y.toAST(), width: w.toAST(), height: h.toAST() } as PlatformDef;
  },

  // ─── HUD ─────────────────────────────────────────────────

  HudBlock(_hud: N, _lb: N, elements: N, _rb: N) {
    return {
      __block: 'hud',
      value: { elements: elements.children.map((e: N) => e.toAST()) } as HudDef,
    };
  },

  HudElement(type: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    const props = collectProps([first, ...rest.children]);
    return { type: type.toAST() as string, ...props } as HudElementDef;
  },

  hudType(_node: N) {
    return this.sourceString;
  },

  HudProp_position(_key: N, _colon: N, val: N) { return { position: val.toAST() }; },
  HudProp_fontSize(_key: N, _colon: N, val: N) { return { fontSize: val.toAST() }; },
  HudProp_color(_key: N, _colon: N, val: N) { return { color: val.toAST() }; },
  HudProp_max(_key: N, _colon: N, val: N) { return { max: val.toAST() }; },

  hudPosition(_node: N) {
    return this.sourceString as HudPosition;
  },

  // ─── Rules ───────────────────────────────────────────────

  RulesBlock(_rules: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    const props = collectProps([first, ...rest.children]);
    return { __block: 'rules', value: props };
  },

  RuleProp_win(_key: N, _colon: N, cond: N) { return { win: cond.toAST() }; },
  RuleProp_lose(_key: N, _colon: N, cond: N) { return { lose: cond.toAST() }; },
  RuleProp_nextLevel(_key: N, _colon: N, val: N) { return { nextLevel: val.toAST() }; },

  WinCondition_reachExit(_kw: N) { return { kind: 'reachExit' } as WinCondition; },
  WinCondition_collectAll(_kw: N, entity: N) { return { kind: 'collectAll', entity: entity.toAST() } as WinCondition; },
  WinCondition_defeatAll(_kw: N) { return { kind: 'defeatAll' } as WinCondition; },
  WinCondition_survive(_kw: N, seconds: N) { return { kind: 'survive', seconds: seconds.toAST() } as WinCondition; },

  LoseCondition_noLives(_kw: N) { return { kind: 'noLives' } as LoseCondition; },
  LoseCondition_timerExpires(_kw: N) { return { kind: 'timerExpires' } as LoseCondition; },
  LoseCondition_fallOff(_kw: N) { return { kind: 'fallOff' } as LoseCondition; },

  // ─── Sounds ──────────────────────────────────────────────

  SoundsBlock(_sounds: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    const props = collectProps([first, ...rest.children]);
    return { __block: 'sounds', value: props };
  },

  SoundProp_jump(_key: N, _colon: N, val: N) { return { jump: val.toAST() }; },
  SoundProp_collect(_key: N, _colon: N, val: N) { return { collect: val.toAST() }; },
  SoundProp_hurt(_key: N, _colon: N, val: N) { return { hurt: val.toAST() }; },
  SoundProp_win(_key: N, _colon: N, val: N) { return { win: val.toAST() }; },
  SoundProp_lose(_key: N, _colon: N, val: N) { return { lose: val.toAST() }; },
  SoundProp_bgm(_key: N, _colon: N, val: N) { return { bgm: val.toAST() }; },

  // ─── Animations ──────────────────────────────────────────

  AnimationBlock(_anim: N, name: N, _lb: N, first: N, _commas: N, rest: N, _trailing: N, _rb: N) {
    const props = collectProps([first, ...rest.children]);
    return { name: name.toAST() as string, loop: false, ...props } as AnimationDef;
  },

  AnimProp_frames(_key: N, _colon: N, _lb: N, list: N, _rb: N) { return { frames: list.toAST() }; },
  AnimProp_fps(_key: N, _colon: N, val: N) { return { fps: val.toAST() }; },
  AnimProp_loop(_key: N, _colon: N, val: N) { return { loop: val.toAST() }; },

  // ─── Lexical ─────────────────────────────────────────────

  ident(this: N, _first: N, _rest: N) {
    return this.sourceString;
  },

  string(_lq: N, chars: N, _rq: N) {
    return chars.sourceString;
  },

  stringChar(node: N) { return node.sourceString; },
  escapeChar(_bs: N, ch: N) { return ch.sourceString; },
  normalChar(ch: N) { return ch.sourceString; },

  number(this: N, _neg: N, _int: N, _dot: N, _frac: N) {
    return parseFloat(this.sourceString);
  },

  boolean(val: N) {
    return val.sourceString === 'true';
  },

  color(this: N, _hash: N, _h1: N, _h2: N, _h3: N, _h4: N, _h5: N, _h6: N) {
    return this.sourceString;
  },

  controlScheme(_node: N) {
    return this.sourceString as ControlScheme;
  },

  collectibleEffect(_node: N) {
    return this.sourceString as CollectibleEffect;
  },

  // ─── ListOf (Ohm built-in) ──────────────────────────────

  NonemptyListOf(first: N, _sep: N, rest: N) {
    return [first.toAST(), ...rest.children.map((c: N) => c.toAST())];
  },

  EmptyListOf() {
    return [];
  },

  // ─── Iteration ──────────────────────────────────────────

  _iter(...children: N[]) {
    return children.map((c: N) => c.toAST());
  },

  _terminal(this: N) {
    return this.sourceString;
  },
});

export { semantics };

export function toAST(matchResult: ReturnType<typeof grammar.match>): Partial<GameAST> {
  return (semantics(matchResult) as any).toAST() as Partial<GameAST>;
}
