/**
 * frameCanvas — a tiny, dependency-free RGBA canvas + 5x7 bitmap font + PNG
 * encoder, used to render deterministic title cards / caption slides.
 *
 * Why hand-rolled: the local static ffmpeg build has no `drawtext` (freetype),
 * and Phase 02 forbids external APIs. So we rasterize each scene to a PNG here,
 * in pure Node (node:zlib only), then let ffmpeg encode the PNGs into an MP4.
 * No native modules, no network, fully deterministic.
 */

import { deflateSync } from "node:zlib";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const GLYPH_W = 5;
export const GLYPH_H = 7;

// 5-wide, 7-tall glyphs. '#' = on. Lowercase is mapped to uppercase; unknown
// characters render as blank space. Readable, verifiable, and deterministic.
const FONT: Record<string, string[]> = {
  " ": ["     ", "     ", "     ", "     ", "     ", "     ", "     "],
  "0": [" ### ", "#   #", "#  ##", "# # #", "##  #", "#   #", " ### "],
  "1": ["  #  ", " ##  ", "  #  ", "  #  ", "  #  ", "  #  ", " ### "],
  "2": [" ### ", "#   #", "    #", "   # ", "  #  ", " #   ", "#####"],
  "3": ["#####", "   # ", "  #  ", "   # ", "    #", "#   #", " ### "],
  "4": ["   # ", "  ## ", " # # ", "#  # ", "#####", "   # ", "   # "],
  "5": ["#####", "#    ", "#### ", "    #", "    #", "#   #", " ### "],
  "6": ["  ## ", " #   ", "#    ", "#### ", "#   #", "#   #", " ### "],
  "7": ["#####", "    #", "   # ", "  #  ", " #   ", " #   ", " #   "],
  "8": [" ### ", "#   #", "#   #", " ### ", "#   #", "#   #", " ### "],
  "9": [" ### ", "#   #", "#   #", " ####", "    #", "   # ", " ##  "],
  A: [" ### ", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
  B: ["#### ", "#   #", "#   #", "#### ", "#   #", "#   #", "#### "],
  C: [" ### ", "#   #", "#    ", "#    ", "#    ", "#   #", " ### "],
  D: ["###  ", "#  # ", "#   #", "#   #", "#   #", "#  # ", "###  "],
  E: ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#####"],
  F: ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#    "],
  G: [" ### ", "#   #", "#    ", "# ###", "#   #", "#   #", " ### "],
  H: ["#   #", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
  I: [" ### ", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", " ### "],
  J: ["  ###", "   # ", "   # ", "   # ", "#  # ", "#  # ", " ##  "],
  K: ["#   #", "#  # ", "# #  ", "##   ", "# #  ", "#  # ", "#   #"],
  L: ["#    ", "#    ", "#    ", "#    ", "#    ", "#    ", "#####"],
  M: ["#   #", "## ##", "# # #", "# # #", "#   #", "#   #", "#   #"],
  N: ["#   #", "##  #", "# # #", "# # #", "#  ##", "#   #", "#   #"],
  O: [" ### ", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
  P: ["#### ", "#   #", "#   #", "#### ", "#    ", "#    ", "#    "],
  Q: [" ### ", "#   #", "#   #", "#   #", "# # #", "#  # ", " ## #"],
  R: ["#### ", "#   #", "#   #", "#### ", "# #  ", "#  # ", "#   #"],
  S: [" ####", "#    ", "#    ", " ### ", "    #", "    #", "#### "],
  T: ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "  #  "],
  U: ["#   #", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
  V: ["#   #", "#   #", "#   #", "#   #", "#   #", " # # ", "  #  "],
  W: ["#   #", "#   #", "#   #", "# # #", "# # #", "## ##", "#   #"],
  X: ["#   #", "#   #", " # # ", "  #  ", " # # ", "#   #", "#   #"],
  Y: ["#   #", "#   #", " # # ", "  #  ", "  #  ", "  #  ", "  #  "],
  Z: ["#####", "    #", "   # ", "  #  ", " #   ", "#    ", "#####"],
  ".": ["     ", "     ", "     ", "     ", "     ", " ##  ", " ##  "],
  ",": ["     ", "     ", "     ", "     ", "  ## ", "  ## ", " #   "],
  ":": ["     ", " ##  ", " ##  ", "     ", " ##  ", " ##  ", "     "],
  "!": ["  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "     ", "  #  "],
  "?": [" ### ", "#   #", "    #", "   # ", "  #  ", "     ", "  #  "],
  "'": ["  #  ", "  #  ", "  #  ", "     ", "     ", "     ", "     "],
  "-": ["     ", "     ", "     ", "#####", "     ", "     ", "     "],
  "/": ["    #", "    #", "   # ", "  #  ", " #   ", "#    ", "#    "],
  "(": ["   # ", "  #  ", " #   ", " #   ", " #   ", "  #  ", "   # "],
  ")": [" #   ", "  #  ", "   # ", "   # ", "   # ", "  #  ", " #   "],
  "&": [" ##  ", "#  # ", "#  # ", " ##  ", "#  # ", "#   #", " ## #"],
  "%": ["##  #", "##  #", "   # ", "  #  ", " #   ", "#  ##", "#  ##"],
  "+": ["     ", "  #  ", "  #  ", "#####", "  #  ", "  #  ", "     "],
};

function glyphFor(ch: string): string[] {
  return FONT[ch] ?? FONT[ch.toUpperCase()] ?? FONT[" "];
}

/** A simple RGBA raster you can fill, write text onto, and encode as PNG. */
export class Frame {
  readonly width: number;
  readonly height: number;
  readonly data: Buffer; // RGBA, row-major

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 4);
  }

  setPixel(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    this.data[i] = c.r;
    this.data[i + 1] = c.g;
    this.data[i + 2] = c.b;
    this.data[i + 3] = 255;
  }

  fill(c: RGB): void {
    this.fillRect(0, 0, this.width, this.height, c);
  }

  fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.setPixel(xx, yy, c);
    }
  }

  /** Vertical gradient background — a "simple background visual". */
  verticalGradient(top: RGB, bottom: RGB): void {
    for (let y = 0; y < this.height; y++) {
      const t = this.height === 1 ? 0 : y / (this.height - 1);
      const c: RGB = {
        r: Math.round(top.r + (bottom.r - top.r) * t),
        g: Math.round(top.g + (bottom.g - top.g) * t),
        b: Math.round(top.b + (bottom.b - top.b) * t),
      };
      this.fillRect(0, y, this.width, 1, c);
    }
  }

  /** Advance width (px) of one character at a given pixel scale. */
  static charAdvance(scale: number): number {
    return (GLYPH_W + 1) * scale;
  }

  textWidth(text: string, scale: number): number {
    if (text.length === 0) return 0;
    return text.length * Frame.charAdvance(scale) - scale; // trailing gap trimmed
  }

  drawGlyph(ch: string, x: number, y: number, scale: number, c: RGB): void {
    const rows = glyphFor(ch);
    for (let gy = 0; gy < GLYPH_H; gy++) {
      const row = rows[gy];
      for (let gx = 0; gx < GLYPH_W; gx++) {
        if (row[gx] === "#") {
          this.fillRect(x + gx * scale, y + gy * scale, scale, scale, c);
        }
      }
    }
  }

  drawText(text: string, x: number, y: number, scale: number, c: RGB): void {
    let cx = x;
    for (const ch of text) {
      this.drawGlyph(ch, cx, y, scale, c);
      cx += Frame.charAdvance(scale);
    }
  }

  drawTextCentered(text: string, centerX: number, y: number, scale: number, c: RGB): void {
    this.drawText(text, Math.round(centerX - this.textWidth(text, scale) / 2), y, scale, c);
  }

  /** Greedy word-wrap to a maximum pixel width. */
  wrapText(text: string, maxWidthPx: number, scale: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (this.textWidth(candidate, scale) > maxWidthPx && line) {
        lines.push(line);
        line = w;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  /** Encode the frame as a PNG (8-bit RGBA). */
  toPNG(): Buffer {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // colour type RGBA
    const stride = this.width * 4 + 1;
    const raw = Buffer.alloc(stride * this.height);
    for (let y = 0; y < this.height; y++) {
      raw[y * stride] = 0; // filter type 0 (none)
      this.data.copy(raw, y * stride + 1, y * this.width * 4, (y + 1) * this.width * 4);
    }
    const idat = deflateSync(raw, { level: 9 });
    return Buffer.concat([
      sig,
      pngChunk("IHDR", ihdr),
      pngChunk("IDAT", idat),
      pngChunk("IEND", Buffer.alloc(0)),
    ]);
  }
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (~c) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
