import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

const shared: esbuild.BuildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  external: ['phaser'],
  target: 'es2020',
  sourcemap: true,
};

async function build() {
  mkdirSync('dist', { recursive: true });

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

  // Generate type declarations
  try {
    execSync('npx tsc --declaration --emitDeclarationOnly --outDir dist/types', { stdio: 'pipe' });
    // Copy the main declaration file to dist root
    const dtsContent = [
      readFileSync('dist/types/ast/types.d.ts', 'utf-8'),
      '',
      readFileSync('dist/types/compiler.d.ts', 'utf-8'),
      '',
      readFileSync('dist/types/index.d.ts', 'utf-8'),
    ].join('\n');
    // Write a simplified .d.ts
    writeFileSync('dist/phaser-platformer-dsl.d.ts', dtsContent, 'utf-8');
    console.log('Type declarations generated.');
  } catch {
    console.warn('Warning: Could not generate type declarations.');
  }

  console.log('Build complete.');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
