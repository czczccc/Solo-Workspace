// Generates the PWA / iOS icons in public/icons with no image dependencies.
// Design: CZ accent (pine, #007c6e) tile with three white kanban columns.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const BG = [0x00, 0x7c, 0x6e];
const FG = [0xfd, 0xfe, 0xfe];
const OUT = path.join(process.cwd(), "public", "icons");

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (const b of buf) {
    c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const inRoundRect = (x, y, x0, y0, x1, y1, r) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};

/** Shape in unit coordinates; `safe` shrinks the glyph for maskable icons. */
function render(size, { rounded, safe }) {
  const s = safe ? 0.8 : 1;
  const off = (1 - s) / 2;
  const bars = [
    [0.25, 0.27, 0.38, 0.73],
    [0.435, 0.27, 0.565, 0.58],
    [0.62, 0.27, 0.75, 0.66],
  ].map(([a, b, c, d]) => [off + a * s, off + b * s, off + c * s, off + d * s]);
  const SS = 4;
  return png(size, (px, py) => {
    let bg = 0, fg = 0;
    for (let i = 0; i < SS; i++)
      for (let j = 0; j < SS; j++) {
        const x = (px + (i + 0.5) / SS) / size;
        const y = (py + (j + 0.5) / SS) / size;
        const inTile = rounded ? inRoundRect(x, y, 0, 0, 1, 1, 0.225) : true;
        if (!inTile) continue;
        bg++;
        if (bars.some(([x0, y0, x1, y1]) => inRoundRect(x, y, x0, y0, x1, y1, 0.035 * s))) fg++;
      }
    const n = SS * SS;
    if (bg === 0) return [0, 0, 0, 0];
    const t = fg / bg;
    const mix = (k) => Math.round(BG[k] * (1 - t) + FG[k] * t);
    return [mix(0), mix(1), mix(2), Math.round((bg / n) * 255)];
  });
}

fs.mkdirSync(OUT, { recursive: true });
const files = {
  "icon-192.png": render(192, { rounded: true }),
  "icon-512.png": render(512, { rounded: true }),
  "maskable-512.png": render(512, { rounded: false, safe: true }),
  "apple-touch-icon.png": render(180, { rounded: false }),
  "favicon-32.png": render(32, { rounded: true }),
};
for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), data);
console.log("icons written:", Object.keys(files).join(", "));
