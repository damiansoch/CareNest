/**
 * CareNest icon generator
 * Uses @resvg/resvg-js (WASM, zero native deps) to render SVG → PNG,
 * then packs favicon.ico via png-to-ico.
 *
 * Usage (from frontend/):
 *   node scripts/generate-icons.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// ── Dynamic imports so missing packages give a nice error ─────────────────────
let Resvg;
let toIco;

try {
  ({ Resvg } = await import('@resvg/resvg-js'));
} catch {
  console.error('❌  @resvg/resvg-js not found. Run: npm install -D @resvg/resvg-js');
  process.exit(1);
}

try {
  ({ default: toIco } = await import('png-to-ico'));
} catch {
  console.error('❌  png-to-ico not found. Run: npm install -D png-to-ico');
  process.exit(1);
}

// ── Helper ────────────────────────────────────────────────────────────────────
function renderSvg(svgBuffer, size) {
  const resvg = new Resvg(svgBuffer, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false },
  });
  return resvg.render().asPng();
}

// ── Load SVGs ─────────────────────────────────────────────────────────────────
const svgBuf          = readFileSync(join(publicDir, 'icon.svg'));
const svgMaskableBuf  = readFileSync(join(publicDir, 'icon-maskable.svg'));

// ── Generate PNGs ─────────────────────────────────────────────────────────────
const jobs = [
  { file: 'favicon-16x16.png',      svg: svgBuf,         size: 16  },
  { file: 'favicon-32x32.png',      svg: svgBuf,         size: 32  },
  { file: 'apple-touch-icon.png',   svg: svgBuf,         size: 180 },
  { file: 'icon-192.png',           svg: svgBuf,         size: 192 },
  { file: 'icon-512.png',           svg: svgBuf,         size: 512 },
  { file: 'icon-maskable-512.png',  svg: svgMaskableBuf, size: 512 },
];

const pngBuffers = {};

for (const { file, svg, size } of jobs) {
  const png = renderSvg(svg, size);
  writeFileSync(join(publicDir, file), png);
  pngBuffers[file] = png;
  console.log(`✓  ${file}  (${size}×${size})`);
}

// ── favicon.ico (16 + 32 combined) ───────────────────────────────────────────
const icoBuffer = await toIco([pngBuffers['favicon-16x16.png'], pngBuffers['favicon-32x32.png']]);
writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer);
console.log('✓  favicon.ico  (16×16 + 32×32)');

console.log('\n✅  All icons generated in frontend/public/');
