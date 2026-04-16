// Generates icon-192.png, icon-512.png, apple-touch-icon.png in public/
// Uses only Node.js built-ins (zlib, fs) — no external dependencies.
import { deflateRawSync } from 'zlib'
import { writeFileSync } from 'fs'

// ── CRC32 ──────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (~c) >>> 0
}

// ── PNG chunk ──────────────────────────────────────────────────────────────────
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data)
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(d.length)
  const crcBuf = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, d])))
  return Buffer.concat([len, t, d, crcBuf])
}

// ── PNG encoder ────────────────────────────────────────────────────────────────
function makePNG(size, getPixel) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  const raw = Buffer.allocUnsafe(size * (1 + size * 3))
  let pos = 0
  for (let y = 0; y < size; y++) {
    raw[pos++] = 0 // filter byte
    for (let x = 0; x < size; x++) {
      const [r, g, b] = getPixel(x, y, size)
      raw[pos++] = r; raw[pos++] = g; raw[pos++] = b
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateRawSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Icon draw function ─────────────────────────────────────────────────────────
// Dark navy background + purple lightning bolt (Beamstrike logo shape)
const BG = [15, 23, 42]      // #0f172a
const BOLT = [134, 59, 255]   // #863bff
const GLOW = [173, 128, 255]  // lighter purple highlight

function iconPixel(x, y, size) {
  const nx = x / size   // 0..1
  const ny = y / size   // 0..1

  // Rounded corners
  const cr = 0.16
  const cornerCenters = [[cr, cr], [1 - cr, cr], [cr, 1 - cr], [1 - cr, 1 - cr]]
  for (const [cx, cy] of cornerCenters) {
    if (nx < cr * 2 && ny < cr * 2 || nx > 1 - cr * 2 && ny < cr * 2 ||
        nx < cr * 2 && ny > 1 - cr * 2 || nx > 1 - cr * 2 && ny > 1 - cr * 2) {
      const dx = nx - cx, dy = ny - cy
      if (Math.sqrt(dx * dx + dy * dy) > cr) return BG
    }
  }

  // Lightning bolt — mirrors the SVG path (48×46 viewbox, normalized)
  // Simplified as a filled polygon check via two slanted bands
  const pad = 0.14
  const mid = 0.50
  const thick = 0.22

  // Upper band: sweeps from (1-pad, pad) down-left to (0.38, mid)
  if (ny >= pad && ny < mid + 0.04) {
    const t = (ny - pad) / (mid - pad)
    // left edge of top half
    const leftX  = (1 - pad) - t * ((1 - pad) - 0.38) - thick * 0.5
    const rightX = (1 - pad) - t * ((1 - pad) - 0.38) + thick * 0.5
    // top horizontal cap
    if (ny < pad + (mid - pad) * 0.28 && nx >= pad + 0.04 && nx <= 1 - pad) return BOLT
    if (nx >= leftX && nx <= rightX) return ny < mid * 0.6 ? GLOW : BOLT
  }

  // Lower band: sweeps from (0.62, mid) down-left to (pad, 1-pad)
  if (ny >= mid - 0.04 && ny <= 1 - pad) {
    const t = (ny - (mid - 0.04)) / ((1 - pad) - (mid - 0.04))
    const leftX  = 0.62 - t * (0.62 - pad) - thick * 0.5
    const rightX = 0.62 - t * (0.62 - pad) + thick * 0.5
    // bottom horizontal cap
    if (ny > 1 - pad - (1 - pad - mid) * 0.28 && nx >= pad && nx <= 1 - pad - 0.04) return BOLT
    if (nx >= leftX && nx <= rightX) return BOLT
  }

  return BG
}

// ── Generate ───────────────────────────────────────────────────────────────────
const targets = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of targets) {
  const png = makePNG(size, iconPixel)
  writeFileSync(`public/${name}`, png)
  console.log(`✓ public/${name}  (${(png.length / 1024).toFixed(1)} KB)`)
}
