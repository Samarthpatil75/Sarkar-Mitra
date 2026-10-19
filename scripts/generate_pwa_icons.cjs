const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, pixelFn) {
  // PNG signature
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0 (None)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // filter byte: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcTarget = Buffer.concat([typeBuf, data]);
  const crcVal = zlib.crc32(crcTarget);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal >>> 0, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Function to draw a vibrant saffron icon with civic circular emblem & mic/sound motif
function iconPixelRenderer(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Outer rounded square / circle background
  const maxR = w * 0.46;
  const cornerR = w * 0.22;

  // Saffron gradient: from #F97316 (orange-500) to #EA580C (saffron-600) to #C2410C (dark saffron)
  const gradT = (y / h);
  const bgR = Math.round(249 - gradT * 45); // 249 -> 204
  const bgG = Math.round(115 - gradT * 50); // 115 -> 65
  const bgB = Math.round(22 - gradT * 12);  // 22 -> 10

  // Rounded rectangle SDF
  const rx = Math.max(0, Math.abs(dx) - (cx - cornerR));
  const ry = Math.max(0, Math.abs(dy) - (cy - cornerR));
  const dRect = Math.sqrt(rx * rx + ry * ry);
  const inRect = (Math.abs(dx) <= cx - cornerR) || (Math.abs(dy) <= cy - cornerR) || (dRect <= cornerR);

  if (!inRect) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Inner decorative ring (pure white subtle accent)
  const ringR = w * 0.38;
  const ringThick = w * 0.02;
  if (Math.abs(dist - ringR) < ringThick) {
    return [255, 255, 255, 180];
  }

  // Center emblem: Microphone & speech waves
  // Mic head: centered at cx, cy - h*0.06
  const micW = w * 0.13;
  const micTop = cy - h * 0.22;
  const micBottom = cy + h * 0.05;

  // Mic capsule
  if (Math.abs(dx) <= micW && y >= micTop && y <= micBottom) {
    // Check capsule rounded top and bottom
    const topDy = y - (micTop + micW);
    const btmDy = y - (micBottom - micW);
    if (topDy < 0 && Math.sqrt(dx * dx + topDy * topDy) > micW) {
      // outside top curve
    } else if (btmDy > 0 && Math.sqrt(dx * dx + btmDy * btmDy) > micW) {
      // outside bottom curve
    } else {
      return [255, 255, 255, 255]; // Pure white mic
    }
  }

  // Mic cradle (U shape)
  const cradleR = w * 0.20;
  const cradleThick = w * 0.032;
  if (dist >= cradleR - cradleThick && dist <= cradleR + cradleThick && y >= cy - h * 0.03 && y <= cy + h * 0.16) {
    return [255, 255, 255, 255];
  }

  // Mic stem & base
  if (Math.abs(dx) <= w * 0.025 && y >= cy + h * 0.15 && y <= cy + h * 0.25) {
    return [255, 255, 255, 255];
  }
  if (Math.abs(dx) <= w * 0.14 && y >= cy + h * 0.23 && y <= cy + h * 0.27) {
    return [255, 255, 255, 255];
  }

  // Sound / civic radiating waves
  const wave1R = w * 0.30;
  const wave2R = w * 0.36;
  const waveThick = w * 0.022;
  const inAngle = (Math.abs(dx) > Math.abs(dy) * 0.6) && (Math.abs(dy) < h * 0.25);

  if (inAngle && (Math.abs(dist - wave1R) < waveThick || Math.abs(dist - wave2R) < waveThick)) {
    return [255, 255, 255, 220];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.join(__dirname, '..', 'public');

const icon192 = createPNG(192, 192, iconPixelRenderer);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
console.log('Created public/pwa-192x192.png (' + icon192.length + ' bytes)');

const icon512 = createPNG(512, 512, iconPixelRenderer);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
console.log('Created public/pwa-512x512.png (' + icon512.length + ' bytes)');

fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), icon192);
console.log('Created public/apple-touch-icon.png');

fs.writeFileSync(path.join(publicDir, 'maskable-icon-512x512.png'), icon512);
console.log('Created public/maskable-icon-512x512.png');
