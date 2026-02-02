import type { AssetDef } from '../ast/types.js';

/** Resolve asset paths, potentially prefixing a base path. */
export function resolveAssetPath(asset: AssetDef, basePath = ''): string {
  if (asset.path.startsWith('http://') || asset.path.startsWith('https://')) {
    return asset.path;
  }
  return basePath ? `${basePath}/${asset.path}` : asset.path;
}
