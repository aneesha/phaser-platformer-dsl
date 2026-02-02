/**
 * Generate simple placeholder sprite PNG assets for examples.
 * Uses Node.js built-in zlib — no external image libraries needed.
 * Creates solid-color rectangle PNGs with optional simple patterns.
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { deflateSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ─── Minimal PNG Encoder ──────────────────────────────────

function createPNG(width: number, height: number, pixels: Uint8Array): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT — raw pixel data with filter byte per row
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
      rawData[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }
  const compressed = deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC-32 implementation
function crc32(buf: Buffer): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ─── Sprite Generators ────────────────────────────────────

function solidRect(w: number, h: number, r: number, g: number, b: number, a = 255): Uint8Array {
  const pixels = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    pixels[i * 4] = r;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = b;
    pixels[i * 4 + 3] = a;
  }
  return pixels;
}

function platformSprite(w: number, h: number): Uint8Array {
  const pixels = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // Brown platform with darker top edge and lighter face
      if (y < 3) {
        // Top grass
        pixels[i] = 76; pixels[i+1] = 153; pixels[i+2] = 0; pixels[i+3] = 255;
      } else if (y < 5) {
        // Dark brown edge
        pixels[i] = 101; pixels[i+1] = 67; pixels[i+2] = 33; pixels[i+3] = 255;
      } else {
        // Brick pattern
        const brickX = (y % 8 < 4) ? x % 16 : (x + 8) % 16;
        if (brickX === 0 || y % 8 === 0) {
          // Mortar
          pixels[i] = 120; pixels[i+1] = 80; pixels[i+2] = 40; pixels[i+3] = 255;
        } else {
          // Brick face
          pixels[i] = 160; pixels[i+1] = 100; pixels[i+2] = 50; pixels[i+3] = 255;
        }
      }
    }
  }
  return pixels;
}

function playerSprite(w: number, h: number): Uint8Array {
  const pixels = new Uint8Array(w * h * 4);
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      pixels[i+3] = 0; // default transparent

      // Head (circle at top)
      const headR = 8;
      const headCx = cx, headCy = 10;
      const dHead = Math.sqrt((x - headCx) ** 2 + (y - headCy) ** 2);
      if (dHead <= headR) {
        pixels[i] = 255; pixels[i+1] = 200; pixels[i+2] = 150; pixels[i+3] = 255; // skin
        // Eyes
        if (y >= 8 && y <= 10 && (x === cx - 3 || x === cx + 3)) {
          pixels[i] = 40; pixels[i+1] = 40; pixels[i+2] = 60; pixels[i+3] = 255;
        }
      }

      // Body (rectangle)
      if (y >= 19 && y <= 32 && x >= cx - 6 && x <= cx + 6) {
        pixels[i] = 50; pixels[i+1] = 120; pixels[i+2] = 220; pixels[i+3] = 255; // blue shirt
      }

      // Legs
      if (y >= 33 && y <= 44 && ((x >= cx - 5 && x <= cx - 1) || (x >= cx + 1 && x <= cx + 5))) {
        pixels[i] = 60; pixels[i+1] = 60; pixels[i+2] = 120; pixels[i+3] = 255; // dark pants
      }

      // Feet
      if (y >= 45 && y <= 47 && ((x >= cx - 6 && x <= cx - 1) || (x >= cx + 1 && x <= cx + 6))) {
        pixels[i] = 100; pixels[i+1] = 60; pixels[i+2] = 30; pixels[i+3] = 255; // shoes
      }
    }
  }
  return pixels;
}

function coinSprite(w: number, h: number): Uint8Array {
  const pixels = new Uint8Array(w * h * 4);
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  const r = Math.min(cx, cy) - 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (d <= r) {
        if (d <= r - 2) {
          // Inner gold
          pixels[i] = 255; pixels[i+1] = 215; pixels[i+2] = 0; pixels[i+3] = 255;
          // Dollar sign hint
          if (x === cx && y >= cy - 3 && y <= cy + 3) {
            pixels[i] = 200; pixels[i+1] = 160; pixels[i+2] = 0; pixels[i+3] = 255;
          }
        } else {
          // Edge - darker gold
          pixels[i] = 200; pixels[i+1] = 160; pixels[i+2] = 0; pixels[i+3] = 255;
        }
      } else {
        pixels[i+3] = 0; // transparent
      }
    }
  }
  return pixels;
}

function enemySprite(w: number, h: number): Uint8Array {
  const pixels = new Uint8Array(w * h * 4);
  const cx = Math.floor(w / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      pixels[i+3] = 0; // default transparent

      // Mushroom cap (dome at top)
      const capCy = 10;
      const capR = 12;
      const dCap = Math.sqrt((x - cx) ** 2 + (y - capCy) ** 2);
      if (y <= capCy && dCap <= capR) {
        pixels[i] = 180; pixels[i+1] = 40; pixels[i+2] = 40; pixels[i+3] = 255; // red cap
        // White spots
        if (((x - cx + 4) ** 2 + (y - 6) ** 2 < 6) || ((x - cx - 4) ** 2 + (y - 6) ** 2 < 6)) {
          pixels[i] = 240; pixels[i+1] = 240; pixels[i+2] = 240; pixels[i+3] = 255;
        }
      }

      // Face area
      if (y > capCy && y <= capCy + 10 && x >= cx - 8 && x <= cx + 8) {
        pixels[i] = 240; pixels[i+1] = 210; pixels[i+2] = 170; pixels[i+3] = 255; // skin
        // Eyes
        if (y >= capCy + 3 && y <= capCy + 6 && (x === cx - 4 || x === cx + 4)) {
          pixels[i] = 20; pixels[i+1] = 20; pixels[i+2] = 20; pixels[i+3] = 255;
        }
        // Angry eyebrows
        if (y === capCy + 2 && ((x >= cx - 5 && x <= cx - 3) || (x >= cx + 3 && x <= cx + 5))) {
          pixels[i] = 60; pixels[i+1] = 30; pixels[i+2] = 30; pixels[i+3] = 255;
        }
      }

      // Feet
      if (y > capCy + 10 && y <= h - 1) {
        if ((x >= cx - 9 && x <= cx - 2) || (x >= cx + 2 && x <= cx + 9)) {
          pixels[i] = 100; pixels[i+1] = 60; pixels[i+2] = 30; pixels[i+3] = 255; // brown feet
        }
      }
    }
  }
  return pixels;
}

function gemSprite(w: number, h: number): Uint8Array {
  const pixels = new Uint8Array(w * h * 4);
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      pixels[i+3] = 0;

      // Diamond shape
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      if (dx / (w / 2 - 1) + dy / (h / 2 - 1) <= 1) {
        // Purple gradient
        const brightness = 1 - (dx + dy) / (w / 2 + h / 2);
        pixels[i] = Math.floor(140 + brightness * 80);
        pixels[i+1] = Math.floor(40 + brightness * 60);
        pixels[i+2] = Math.floor(200 + brightness * 55);
        pixels[i+3] = 255;
      }
    }
  }
  return pixels;
}

function heartSprite(w: number, h: number): Uint8Array {
  const pixels = new Uint8Array(w * h * 4);
  const cx = Math.floor(w / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      pixels[i+3] = 0;

      // Heart shape using parametric check
      const nx = (x - cx) / (w / 2);
      const ny = (y - h * 0.4) / (h / 2);
      const heart = (nx * nx + ny * ny - 1) ** 3 - nx * nx * ny * ny * ny;
      if (heart <= 0) {
        pixels[i] = 220; pixels[i+1] = 30; pixels[i+2] = 60; pixels[i+3] = 255;
      }
    }
  }
  return pixels;
}

// ─── Generate All Assets ──────────────────────────────────

function generateAssets() {
  // Global shared assets
  const assetsDir = join(rootDir, 'assets');
  mkdirSync(join(assetsDir, 'sprites'), { recursive: true });
  mkdirSync(join(assetsDir, 'tilesets'), { recursive: true });

  // Generate sprites
  const sprites: Record<string, { w: number; h: number; gen: (w: number, h: number) => Uint8Array }> = {
    'player.png': { w: 32, h: 48, gen: playerSprite },
    'platform.png': { w: 32, h: 32, gen: (w, h) => platformSprite(w, h) },
    'coin.png': { w: 16, h: 16, gen: coinSprite },
    'enemy.png': { w: 32, h: 32, gen: enemySprite },
    'gem.png': { w: 16, h: 16, gen: gemSprite },
    'heart.png': { w: 16, h: 16, gen: heartSprite },
  };

  for (const [name, { w, h, gen }] of Object.entries(sprites)) {
    const pixels = gen(w, h);
    const png = createPNG(w, h, pixels);
    writeFileSync(join(assetsDir, 'sprites', name), png);
    console.log(`  Created assets/sprites/${name} (${w}x${h})`);
  }

  // Tileset (a 128x128 tile sheet with 4x4 tiles of 32x32)
  const tileSize = 32;
  const sheetW = 128;
  const sheetH = 128;
  const tilePixels = new Uint8Array(sheetW * sheetH * 4);
  const tileColors = [
    [76, 153, 0],    // grass
    [160, 100, 50],  // brick
    [101, 67, 33],   // dark dirt
    [130, 130, 130], // stone
    [50, 120, 220],  // water
    [200, 160, 0],   // gold
    [80, 80, 80],    // dark stone
    [200, 200, 200], // light stone
    [120, 80, 40],   // wood
    [0, 100, 0],     // dark grass
    [180, 40, 40],   // lava
    [240, 200, 100], // sand
    [60, 60, 120],   // night brick
    [100, 180, 255], // sky
    [40, 40, 40],    // void
    [0, 0, 0, 0],    // transparent
  ];

  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const color = tileColors[ty * 4 + tx];
      for (let y = 0; y < tileSize; y++) {
        for (let x = 0; x < tileSize; x++) {
          const px = tx * tileSize + x;
          const py = ty * tileSize + y;
          const i = (py * sheetW + px) * 4;
          tilePixels[i] = color[0];
          tilePixels[i + 1] = color[1];
          tilePixels[i + 2] = color[2];
          tilePixels[i + 3] = color.length > 3 ? color[3] : 255;
          // Add subtle grid lines
          if (x === 0 || y === 0) {
            tilePixels[i] = Math.max(0, (color[0] ?? 0) - 30);
            tilePixels[i + 1] = Math.max(0, (color[1] ?? 0) - 30);
            tilePixels[i + 2] = Math.max(0, (color[2] ?? 0) - 30);
          }
        }
      }
    }
  }
  const tilesetPng = createPNG(sheetW, sheetH, tilePixels);
  writeFileSync(join(assetsDir, 'tilesets', 'platformer-tiles.png'), tilesetPng);
  console.log(`  Created assets/tilesets/platformer-tiles.png (${sheetW}x${sheetH})`);

  // Copy assets to each example directory
  const examples = ['simple-platformer', 'coin-collector', 'multi-level'];
  for (const example of examples) {
    const exDir = join(rootDir, 'examples', example, 'assets');
    mkdirSync(exDir, { recursive: true });
    // Copy all sprites
    for (const name of Object.keys(sprites)) {
      const src = join(assetsDir, 'sprites', name);
      const buf = readFileSync(src);
      writeFileSync(join(exDir, name), buf);
    }
    console.log(`  Copied sprites to examples/${example}/assets/`);
  }
}

generateAssets();
console.log('\nAsset generation complete.');
