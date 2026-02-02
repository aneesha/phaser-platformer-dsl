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
  TilemapLayers,
  ControlScheme,
  CollectibleEffect,
  HudPosition,
  SpritesheetConfig,
} from '../ast/types.js';

// Build the semantics with a toAST operation
const semantics = grammar.createSemantics();

// ─── Helper: collect properties from a list of nodes ─────────

type PropBag = Record<string, unknown>;

function collectProps(nodes: { toAST(): unknown }[]): PropBag {
  const bag: PropBag = {};
  for (const node of nodes) {
    const result = node.toAST() as PropBag;
    for (const [key, value] of Object.entries(result)) {
      // Merge arrays (e.g., multiple animation blocks)
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

  Game(_game, title, _lb, blocks, _rb) {
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
      const result = block.toAST() as { __block: string; [key: string]: unknown };
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

    return {
      title: gameTitle,
      config,
      assets,
      player,
      enemies,
      collectibles,
      levels,
      hud,
      rules,
      sounds,
    } as Partial<GameAST>;
  },

  GameBlock(block) {
    return block.toAST();
  },

  // ─── Config ──────────────────────────────────────────────

  ConfigBlock(_config, _lb, first, _commas, rest, _trailing, _rb) {
    const props = collectProps([first, ...rest.children]);
    return { __block: 'config', value: props };
  },

  ConfigProp_width(_key, _colon, val) {
    return { width: val.toAST() };
  },
  ConfigProp_height(_key, _colon, val) {
    return { height: val.toAST() };
  },
  ConfigProp_gravity(_key, _colon, val) {
    return { gravity: val.toAST() };
  },
  ConfigProp_background(_key, _colon, val) {
    return { background: val.toAST() };
  },

  // ─── Assets ──────────────────────────────────────────────

  AssetsBlock(_assets, _lb, defs, _rb) {
    const assetList = defs.children.map((d: { toAST(): unknown }) => d.toAST() as AssetDef);
    return { __block: 'assets', value: assetList };
  },

  AssetDef_spritesheet(_kw, key, path, config) {
    return {
      type: 'spritesheet' as const,
      key: key.toAST() as string,
      path: path.toAST() as string,
      config: config.toAST() as SpritesheetConfig,
    };
  },
  AssetDef_image(_kw, key, path) {
    return {
      type: 'image' as const,
      key: key.toAST() as string,
      path: path.toAST() as string,
    };
  },
  AssetDef_tilemap(_kw, key, path) {
    return {
      type: 'tilemap' as const,
      key: key.toAST() as string,
      path: path.toAST() as string,
    };
  },
  AssetDef_audio(_kw, key, path) {
    return {
      type: 'audio' as const,
      key: key.toAST() as string,
      path: path.toAST() as string,
    };
  },

  SpritesheetConfig(_lb, _fwKey, _c1, fw, _comma, _fhKey, _c2, fh, _trailing, _rb) {
    return {
      frameWidth: fw.toAST() as number,
      frameHeight: fh.toAST() as number,
    };
  },

  // ─── Player ──────────────────────────────────────────────

  PlayerBlock(_player, _lb, first, _commas, rest, _trailing, _rb) {
    const props = collectProps([first, ...rest.children]);
    const animations = (props.animations || []) as AnimationDef[];
    delete props.animations;
    return {
      __block: 'player',
      value: { ...props, animations } as Partial<PlayerDef>,
    };
  },

  PlayerProp_sprite(_key, _colon, val) {
    return { sprite: val.toAST() };
  },
  PlayerProp_speed(_key, _colon, val) {
    return { speed: val.toAST() };
  },
  PlayerProp_jumpForce(_key, _colon, val) {
    return { jumpForce: val.toAST() };
  },
  PlayerProp_lives(_key, _colon, val) {
    return { lives: val.toAST() };
  },
  PlayerProp_controls(_key, _colon, val) {
    return { controls: val.toAST() };
  },
  PlayerProp_animation(animBlock) {
    const anim = animBlock.toAST() as AnimationDef;
    return { animations: [anim] };
  },

  // ─── Enemies ─────────────────────────────────────────────

  EnemyBlock(_enemy, name, _lb, first, _commas, rest, _trailing, _rb) {
    const props = collectProps([first, ...rest.children]);
    const animations = (props.animations || []) as AnimationDef[];
    delete props.animations;
    return {
      __block: 'enemy',
      value: {
        name: name.toAST() as string,
        ...props,
        animations,
      } as Partial<EnemyDef>,
    };
  },

  EnemyProp_sprite(_key, _colon, val) {
    return { sprite: val.toAST() };
  },
  EnemyProp_movement(_key, _colon, val) {
    return { movement: val.toAST() };
  },
  EnemyProp_damage(_key, _colon, val) {
    return { damage: val.toAST() };
  },
  EnemyProp_stompable(_key, _colon, val) {
    return { stompable: val.toAST() };
  },
  EnemyProp_animation(animBlock) {
    const anim = animBlock.toAST() as AnimationDef;
    return { animations: [anim] };
  },

  MovementDef_patrol(_kw, _lb, first, _commas, rest, _trailing, _rb) {
    const params = collectProps([first, ...rest.children]);
    return { kind: 'patrol', ...params } as MovementPattern;
  },
  MovementDef_chase(_kw, _lb, first, _commas, rest, _trailing, _rb) {
    const params = collectProps([first, ...rest.children]);
    return { kind: 'chase', ...params } as MovementPattern;
  },
  MovementDef_fly(_kw, _lb, first, _commas, rest, _trailing, _rb) {
    const params = collectProps([first, ...rest.children]);
    return { kind: 'fly', ...params } as MovementPattern;
  },
  MovementDef_static(_kw) {
    return { kind: 'static' } as MovementPattern;
  },

  MovementParam_speed(_key, _colon, val) {
    return { speed: val.toAST() };
  },
  MovementParam_distance(_key, _colon, val) {
    return { distance: val.toAST() };
  },
  MovementParam_range(_key, _colon, val) {
    return { range: val.toAST() };
  },
  MovementParam_amplitude(_key, _colon, val) {
    return { amplitude: val.toAST() };
  },
  MovementParam_frequency(_key, _colon, val) {
    return { frequency: val.toAST() };
  },

  // ─── Collectibles ────────────────────────────────────────

  CollectibleBlock(_collectible, name, _lb, first, _commas, rest, _trailing, _rb) {
    const props = collectProps([first, ...rest.children]);
    const animations = (props.animations || []) as AnimationDef[];
    delete props.animations;
    return {
      __block: 'collectible',
      value: {
        name: name.toAST() as string,
        effect: 'none',
        ...props,
        animations,
      } as Partial<CollectibleDef>,
    };
  },

  CollectibleProp_sprite(_key, _colon, val) {
    return { sprite: val.toAST() };
  },
  CollectibleProp_score(_key, _colon, val) {
    return { score: val.toAST() };
  },
  CollectibleProp_effect(_key, _colon, val) {
    return { effect: val.toAST() };
  },
  CollectibleProp_animation(animBlock) {
    const anim = animBlock.toAST() as AnimationDef;
    return { animations: [anim] };
  },

  // ─── Levels ──────────────────────────────────────────────

  LevelBlock(_level, name, _lb, props, _rb) {
    const bag = collectProps(props.children);
    return {
      __block: 'level',
      value: {
        name: name.toAST() as string,
        enemies: [],
        collectibles: [],
        platforms: [],
        ...bag,
      } as LevelDef,
    };
  },

  LevelProp_tilemap(_key, _colon, val) {
    return { tilemap: val.toAST() };
  },
  LevelProp_layers(_key, _colon, _lb, first, _commas, rest, _trailing, _rb) {
    const layers: TilemapLayers = {};
    const firstMapping = first.toAST() as [string, string];
    layers[firstMapping[0]] = firstMapping[1];
    for (const child of rest.children) {
      const mapping = child.toAST() as [string, string];
      layers[mapping[0]] = mapping[1];
    }
    return { layers };
  },
  LevelProp_spawn(_key, _colon, _lb, _xk, _xc, x, _comma, _yk, _yc, y, _rb) {
    return { spawn: { x: x.toAST() as number, y: y.toAST() as number } };
  },
  LevelProp_enemies(_key, _colon, _lb, list, _rb) {
    return { enemies: list.toAST() };
  },
  LevelProp_coins(_key, _colon, _lb, list, _rb) {
    return { collectibles: list.toAST() };
  },
  LevelProp_platforms(_key, _colon, _lb, list, _rb) {
    return { platforms: list.toAST() };
  },
  LevelProp_exit(_key, _colon, _lb, _xk, _xc, x, _comma, _yk, _yc, y, _rb) {
    return { exit: { x: x.toAST() as number, y: y.toAST() as number } };
  },

  LayerMapping(key, _colon, val) {
    return [key.toAST(), val.toAST()];
  },

  EntityPlacement(entity, _at, _lp, x, _comma, y, _rp) {
    return {
      entity: entity.toAST() as string,
      x: x.toAST() as number,
      y: y.toAST() as number,
    } as EntityPlacement;
  },

  PlatformPlacement(asset, _at, _lp, x, _c1, y, _c2, w, _c3, h, _rp) {
    return {
      asset: asset.toAST() as string,
      x: x.toAST() as number,
      y: y.toAST() as number,
      width: w.toAST() as number,
      height: h.toAST() as number,
    } as PlatformDef;
  },

  // ─── HUD ─────────────────────────────────────────────────

  HudBlock(_hud, _lb, elements, _rb) {
    return {
      __block: 'hud',
      value: {
        elements: elements.children.map((e: { toAST(): unknown }) => e.toAST()),
      } as HudDef,
    };
  },

  HudElement(type, _lb, first, _commas, rest, _trailing, _rb) {
    const props = collectProps([first, ...rest.children]);
    return {
      type: type.toAST() as string,
      ...props,
    } as HudElementDef;
  },

  hudType(node) {
    return node.sourceString;
  },

  HudProp_position(_key, _colon, val) {
    return { position: val.toAST() };
  },
  HudProp_fontSize(_key, _colon, val) {
    return { fontSize: val.toAST() };
  },
  HudProp_color(_key, _colon, val) {
    return { color: val.toAST() };
  },
  HudProp_max(_key, _colon, val) {
    return { max: val.toAST() };
  },

  hudPosition(node) {
    return node.sourceString as HudPosition;
  },

  // ─── Rules ───────────────────────────────────────────────

  RulesBlock(_rules, _lb, first, _commas, rest, _trailing, _rb) {
    const props = collectProps([first, ...rest.children]);
    return {
      __block: 'rules',
      value: props as RulesDef,
    };
  },

  RuleProp_win(_key, _colon, cond) {
    return { win: cond.toAST() };
  },
  RuleProp_lose(_key, _colon, cond) {
    return { lose: cond.toAST() };
  },
  RuleProp_nextLevel(_key, _colon, val) {
    return { nextLevel: val.toAST() };
  },

  WinCondition_reachExit(_kw) {
    return { kind: 'reachExit' } as WinCondition;
  },
  WinCondition_collectAll(_kw, entity) {
    return { kind: 'collectAll', entity: entity.toAST() } as WinCondition;
  },
  WinCondition_defeatAll(_kw) {
    return { kind: 'defeatAll' } as WinCondition;
  },
  WinCondition_survive(_kw, seconds) {
    return { kind: 'survive', seconds: seconds.toAST() } as WinCondition;
  },

  LoseCondition_noLives(_kw) {
    return { kind: 'noLives' } as LoseCondition;
  },
  LoseCondition_timerExpires(_kw) {
    return { kind: 'timerExpires' } as LoseCondition;
  },
  LoseCondition_fallOff(_kw) {
    return { kind: 'fallOff' } as LoseCondition;
  },

  // ─── Sounds ──────────────────────────────────────────────

  SoundsBlock(_sounds, _lb, first, _commas, rest, _trailing, _rb) {
    const props = collectProps([first, ...rest.children]);
    return {
      __block: 'sounds',
      value: props as SoundsDef,
    };
  },

  SoundProp_jump(_key, _colon, val) {
    return { jump: val.toAST() };
  },
  SoundProp_collect(_key, _colon, val) {
    return { collect: val.toAST() };
  },
  SoundProp_hurt(_key, _colon, val) {
    return { hurt: val.toAST() };
  },
  SoundProp_win(_key, _colon, val) {
    return { win: val.toAST() };
  },
  SoundProp_lose(_key, _colon, val) {
    return { lose: val.toAST() };
  },
  SoundProp_bgm(_key, _colon, val) {
    return { bgm: val.toAST() };
  },

  // ─── Animations ──────────────────────────────────────────

  AnimationBlock(_anim, name, _lb, first, _commas, rest, _trailing, _rb) {
    const props = collectProps([first, ...rest.children]);
    return {
      name: name.toAST() as string,
      loop: false,
      ...props,
    } as AnimationDef;
  },

  AnimProp_frames(_key, _colon, _lb, list, _rb) {
    return { frames: list.toAST() };
  },
  AnimProp_fps(_key, _colon, val) {
    return { fps: val.toAST() };
  },
  AnimProp_loop(_key, _colon, val) {
    return { loop: val.toAST() };
  },

  // ─── Lexical ─────────────────────────────────────────────

  ident(_first, _rest) {
    return this.sourceString;
  },

  string(_lq, chars, _rq) {
    return chars.sourceString;
  },

  stringChar(node) {
    return node.sourceString;
  },

  escapeChar(_bs, ch) {
    return ch.sourceString;
  },

  normalChar(ch) {
    return ch.sourceString;
  },

  number(_neg, _int, _dot, _frac) {
    return parseFloat(this.sourceString);
  },

  boolean(val) {
    return val.sourceString === 'true';
  },

  color(_hash, _h1, _h2, _h3, _h4, _h5, _h6) {
    return this.sourceString;
  },

  controlScheme(node) {
    return node.sourceString as ControlScheme;
  },

  collectibleEffect(node) {
    return node.sourceString as CollectibleEffect;
  },

  // ─── ListOf (Ohm built-in) ──────────────────────────────

  NonemptyListOf(first, _sep, rest) {
    return [first.toAST(), ...rest.children.map((c: { toAST(): unknown }) => c.toAST())];
  },

  EmptyListOf() {
    return [];
  },

  // ─── Iteration ──────────────────────────────────────────

  _iter(...children) {
    return children.map((c) => c.toAST());
  },

  _terminal() {
    return this.sourceString;
  },
});

export { semantics };

export function toAST(matchResult: ReturnType<typeof grammar.match>): Partial<GameAST> {
  return semantics(matchResult).toAST() as Partial<GameAST>;
}
