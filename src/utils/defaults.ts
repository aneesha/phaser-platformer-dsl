import type { GameConfig, PlayerDef } from '../ast/types.js';

export const DEFAULT_CONFIG: Required<Omit<GameConfig, 'background'>> & { background: string } = {
  width: 800,
  height: 600,
  gravity: 500,
  background: '#87CEEB',
};

export const DEFAULT_PLAYER: Pick<PlayerDef, 'speed' | 'jumpForce' | 'lives' | 'controls'> = {
  speed: 160,
  jumpForce: 330,
  lives: 3,
  controls: 'arrows',
};
