import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

const shared: esbuild.BuildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  external: ['phaser'],
  target: 'es2020',
  sourcemap: true,
};

async function build() {
  // IIFE bundle (for script tags)
  await esbuild.build({
    ...shared,
    outfile: 'dist/phaser-platformer-dsl.js',
    format: 'iife',
    globalName: 'PhaserPlatformerDSL',
    minify: true,
    banner: {
      js: `/* phaser-platformer-dsl v${pkg.version} */`,
    },
  });

  // ESM bundle (for modern bundlers)
  await esbuild.build({
    ...shared,
    outfile: 'dist/phaser-platformer-dsl.esm.js',
    format: 'esm',
    minify: true,
    banner: {
      js: `/* phaser-platformer-dsl v${pkg.version} */`,
    },
  });

  console.log('Build complete.');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
