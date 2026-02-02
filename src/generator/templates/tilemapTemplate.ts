import { CodeBuilder } from '../codeBuilder.js';
import type { LevelDef, AssetDef } from '../../ast/types.js';

/** Generate tilemap creation and collision setup code. */
export function generateTilemapCreate(level: LevelDef, assets: readonly AssetDef[]): string {
  const b = new CodeBuilder();

  if (!level.tilemap || !level.layers) return '';

  // Find the tileset image asset — use first image asset as tileset
  const tilesetAsset = assets.find((a) => a.type === 'image' && a.key.includes('tile'));
  const tilesetKey = tilesetAsset?.key ?? assets.find((a) => a.type === 'image')?.key ?? 'tiles';

  b.line(`const map = this.make.tilemap({ key: '${level.tilemap}' });`);
  b.line(`const tileset = map.addTilesetImage('tileset', '${tilesetKey}');`);
  b.line();

  for (const [layerName, tiledName] of Object.entries(level.layers)) {
    b.line(`this.${layerName}Layer = map.createLayer('${tiledName}', tileset, 0, 0);`);
    b.line(`if (this.${layerName}Layer) {`);
    b.indent();
    b.line(`this.${layerName}Layer.setCollisionByExclusion([-1]);`);
    b.line(`this.physics.add.collider(this.player, this.${layerName}Layer);`);
    if (b) {
      // Add enemy collider with this layer too
      b.line(`if (this.enemies) this.physics.add.collider(this.enemies, this.${layerName}Layer);`);
    }
    b.dedent();
    b.line('}');
  }

  return b.toString();
}
