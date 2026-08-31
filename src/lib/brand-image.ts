/**
 * Client-side branding image pipeline (canvas only, no external service).
 * Every helper returns a fresh PNG blob and never mutates the source asset.
 */
import { supabase } from "@/integrations/supabase/client";

export const BRAND_BUCKET = "song-resources";
export const BRAND_MAX_BYTES = 8 * 1024 * 1024;
export const BRAND_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

export function brandProxyUrl(path: string) {
  return `/api/public/media/${BRAND_BUCKET}/${path}`;
}

export async function uploadBrandAsset(data: Blob, slot: string, ext = "png"): Promise<string> {
  if (data.size > BRAND_MAX_BYTES) throw new Error("Brand asset must be 8MB or smaller");
  const path = `branding/${slot}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(BRAND_BUCKET)
    .upload(path, data, { upsert: false, contentType: data.type || "image/png" });
  if (error) throw error;
  return brandProxyUrl(path);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load that image"));
    img.src = src;
  });
}

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser");
  return { canvas, ctx };
}

export function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))), "image/png"),
  );
}

/** Draw the source inside a square canvas, letterboxed — never stretched. */
export function fitSquare(img: HTMLImageElement, size: number, padRatio = 0.08, background?: string) {
  const { canvas, ctx } = canvasOf(size, size);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
  }
  const pad = size * padRatio;
  const box = size - pad * 2;
  const scale = Math.min(box / img.naturalWidth, box / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  return canvas;
}

/** Knock out a near-uniform background (usually white) into transparency. */
export function removeFlatBackground(img: HTMLImageElement, tolerance = 26) {
  const { canvas, ctx } = canvasOf(img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, 0, 0);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = frame.data;
  const cornerIndexes = [
    0,
    (canvas.width - 1) * 4,
    (canvas.height - 1) * canvas.width * 4,
    ((canvas.height - 1) * canvas.width + canvas.width - 1) * 4,
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const i of cornerIndexes) {
    r += d[i] ?? 255;
    g += d[i + 1] ?? 255;
    b += d[i + 2] ?? 255;
  }
  r /= cornerIndexes.length;
  g /= cornerIndexes.length;
  b /= cornerIndexes.length;

  for (let i = 0; i < d.length; i += 4) {
    const dist = Math.hypot((d[i] ?? 0) - r, (d[i + 1] ?? 0) - g, (d[i + 2] ?? 0) - b);
    if (dist < tolerance) d[i + 3] = 0;
    else if (dist < tolerance * 2) d[i + 3] = Math.round(((dist - tolerance) / tolerance) * (d[i + 3] ?? 255));
  }
  ctx.putImageData(frame, 0, 0);
  return canvas;
}

/** Unsharp-style clarity pass, then optional upscale for print / 4K use. */
export function enhance(img: HTMLImageElement, scale = 2, amount = 0.55) {
  const width = Math.min(4096, Math.round(img.naturalWidth * scale));
  const height = Math.min(4096, Math.round(img.naturalHeight * scale));
  const { canvas, ctx } = canvasOf(width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const frame = ctx.getImageData(0, 0, width, height);
  const src = new Uint8ClampedArray(frame.data);
  const d = frame.data;
  const at = (x: number, y: number, c: number) => src[(y * width + x) * 4 + c] ?? 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c += 1) {
        const center = at(x, y, c);
        const blur =
          (at(x - 1, y, c) + at(x + 1, y, c) + at(x, y - 1, c) + at(x, y + 1, c) + center) / 5;
        d[i + c] = center + (center - blur) * (1 + amount) + (center - 128) * 0.04;
      }
    }
  }
  ctx.putImageData(frame, 0, 0);
  return canvas;
}

/** Trim transparent/flat margins so a mark reads well at 16-32px. */
export function trimAndCenter(img: HTMLImageElement, size = 512) {
  const { canvas, ctx } = canvasOf(img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if ((data[(y * canvas.width + x) * 4 + 3] ?? 0) > 12) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return fitSquare(img, size, 0.06);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = canvasOf(size, size);
  const box = size * 0.9;
  const scale = Math.min(box / w, box / h);
  out.ctx.imageSmoothingQuality = "high";
  out.ctx.drawImage(canvas, minX, minY, w, h, (size - w * scale) / 2, (size - h * scale) / 2, w * scale, h * scale);
  return out.canvas;
}

/** Contrast-safe variant for a specific background. */
export function backgroundVariant(img: HTMLImageElement, background: string, size = 1024) {
  return fitSquare(img, size, 0.12, background);
}
