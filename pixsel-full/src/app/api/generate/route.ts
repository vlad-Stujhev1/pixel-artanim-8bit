import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import GIFEncoder from 'gif-encoder-2';

// Palette definitions
const PALETTES = {
  nes: [
    [15, 15, 15], [29, 43, 83], [126, 37, 83], [0, 135, 81],
    [171, 82, 54], [95, 87, 79], [194, 195, 199], [255, 241, 232]
  ],
  gameboy: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
  c64: [[0, 0, 0], [255, 255, 255], [136, 0, 0], [170, 255, 238], [204, 68, 204], [0, 204, 85], [0, 0, 170], [238, 238, 119]],
  mono: [[0, 0, 0], [255, 255, 255]],
};

interface GenerationParams {
  palette: keyof typeof PALETTES;
  frames: number;
  delay: number;
  size: string;
}

// Find closest palette color
function findClosestColor(r: number, g: number, b: number, palette: number[][]): number[] {
  let minDist = Infinity;
  let closest = palette[0];
  
  for (const color of palette) {
    const dist = Math.sqrt((r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closest = color;
    }
  }
  return closest;
}

// Quantize image
async function quantizeImage(buffer: Buffer, palette: number[][], size: number): Promise<{ data: Buffer; width: number; height: number }> {
  const img = sharp(buffer);
  const meta = await img.metadata();
  
  let width = size;
  let height = size;
  
  if (meta.width && meta.height) {
    if (meta.width > meta.height) {
      height = Math.round((meta.height / meta.width) * size);
    } else if (meta.height > meta.width) {
      width = Math.round((meta.width / meta.height) * size);
    }
  }
  
  width = Math.max(16, width);
  height = Math.max(16, height);
  
  const { data, info } = await img
    .resize(width, height, { fit: 'contain', background: { r: 15, g: 15, b: 15 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const quantized = Buffer.alloc(data.length);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    if (a < 128) {
      quantized[i] = 15;
      quantized[i + 1] = 15;
      quantized[i + 2] = 15;
      quantized[i + 3] = 0;
    } else {
      const closest = findClosestColor(r, g, b, palette);
      quantized[i] = closest[0];
      quantized[i + 1] = closest[1];
      quantized[i + 2] = closest[2];
      quantized[i + 3] = 255;
    }
  }
  
  return { data: quantized, width: info.width, height: info.height };
}

// Parse prompt for animation
function parseAnimation(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('blink') || p.includes('eye')) return 'blink';
  if (p.includes('pulse') || p.includes('glow')) return 'pulse';
  if (p.includes('bounce') || p.includes('jump')) return 'bounce';
  if (p.includes('shake') || p.includes('vibrate')) return 'shake';
  if (p.includes('spin') || p.includes('rotate')) return 'spin';
  if (p.includes('wave')) return 'wave';
  if (p.includes('zoom')) return 'zoom';
  if (p.includes('rainbow') || p.includes('color')) return 'rainbow';
  if (p.includes('walk') || p.includes('run')) return 'walk';
  return 'default';
}

// RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l];
}

// HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Create animation frames
function createFrames(baseData: Buffer, width: number, height: number, animationType: string, frameCount: number): Buffer[] {
  const frames: Buffer[] = [];
  const centerX = width / 2;
  const centerY = height / 2;
  
  for (let i = 0; i < frameCount; i++) {
    const progress = i / frameCount;
    const frame = Buffer.from(baseData);
    
    switch (animationType) {
      case 'blink':
        if (progress > 0.3 && progress < 0.6) {
          for (let j = 0; j < frame.length; j += 4) {
            frame[j] = Math.floor(frame[j] * 0.3);
            frame[j + 1] = Math.floor(frame[j + 1] * 0.3);
            frame[j + 2] = Math.floor(frame[j + 2] * 0.3);
          }
        }
        break;
        
      case 'pulse': {
        const brightness = 0.7 + Math.sin(progress * Math.PI * 2) * 0.3;
        for (let j = 0; j < frame.length; j += 4) {
          frame[j] = Math.min(255, Math.floor(frame[j] * brightness));
          frame[j + 1] = Math.min(255, Math.floor(frame[j + 1] * brightness));
          frame[j + 2] = Math.min(255, Math.floor(frame[j + 2] * brightness));
        }
        break;
      }
        
      case 'shake': {
        const shakeX = Math.round((Math.random() - 0.5) * 4);
        const shakeY = Math.round((Math.random() - 0.5) * 4);
        const shaken = Buffer.alloc(frame.length);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const srcX = Math.max(0, Math.min(width - 1, x - shakeX));
            const srcY = Math.max(0, Math.min(height - 1, y - shakeY));
            const srcIdx = (srcY * width + srcX) * 4;
            const dstIdx = (y * width + x) * 4;
            shaken[dstIdx] = baseData[srcIdx];
            shaken[dstIdx + 1] = baseData[srcIdx + 1];
            shaken[dstIdx + 2] = baseData[srcIdx + 2];
            shaken[dstIdx + 3] = baseData[srcIdx + 3];
          }
        }
        frames.push(shaken);
        continue;
      }
        
      case 'spin': {
        const angle = progress * Math.PI * 2;
        const spun = Buffer.alloc(frame.length);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const srcX = Math.round(centerX + dx * Math.cos(angle) - dy * Math.sin(angle));
            const srcY = Math.round(centerY + dx * Math.sin(angle) + dy * Math.cos(angle));
            const dstIdx = (y * width + x) * 4;
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
              const srcIdx = (srcY * width + srcX) * 4;
              spun[dstIdx] = baseData[srcIdx];
              spun[dstIdx + 1] = baseData[srcIdx + 1];
              spun[dstIdx + 2] = baseData[srcIdx + 2];
              spun[dstIdx + 3] = baseData[srcIdx + 3];
            }
          }
        }
        frames.push(spun);
        continue;
      }
        
      case 'bounce': {
        const offset = Math.floor(Math.abs(Math.sin(progress * Math.PI * 2)) * 8);
        const bounced = Buffer.alloc(frame.length);
        for (let y = 0; y < height; y++) {
          const newY = y + offset;
          if (newY < height) {
            for (let x = 0; x < width; x++) {
              const srcIdx = (y * width + x) * 4;
              const dstIdx = (newY * width + x) * 4;
              bounced[dstIdx] = baseData[srcIdx];
              bounced[dstIdx + 1] = baseData[srcIdx + 1];
              bounced[dstIdx + 2] = baseData[srcIdx + 2];
              bounced[dstIdx + 3] = baseData[srcIdx + 3];
            }
          }
        }
        frames.push(bounced);
        continue;
      }
        
      case 'wave': {
        const waved = Buffer.alloc(frame.length);
        for (let y = 0; y < height; y++) {
          const waveOffset = Math.sin((y / height) * Math.PI * 4 + progress * Math.PI * 2) * 4;
          for (let x = 0; x < width; x++) {
            const srcX = Math.max(0, Math.min(width - 1, x - Math.round(waveOffset)));
            const srcIdx = (y * width + srcX) * 4;
            const dstIdx = (y * width + x) * 4;
            waved[dstIdx] = baseData[srcIdx];
            waved[dstIdx + 1] = baseData[srcIdx + 1];
            waved[dstIdx + 2] = baseData[srcIdx + 2];
            waved[dstIdx + 3] = baseData[srcIdx + 3];
          }
        }
        frames.push(waved);
        continue;
      }
        
      case 'zoom': {
        const scale = 0.8 + Math.sin(progress * Math.PI * 2) * 0.2;
        const zoomed = Buffer.alloc(frame.length);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const srcX = Math.round((x - centerX) / scale + centerX);
            const srcY = Math.round((y - centerY) / scale + centerY);
            const dstIdx = (y * width + x) * 4;
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
              const srcIdx = (srcY * width + srcX) * 4;
              zoomed[dstIdx] = baseData[srcIdx];
              zoomed[dstIdx + 1] = baseData[srcIdx + 1];
              zoomed[dstIdx + 2] = baseData[srcIdx + 2];
              zoomed[dstIdx + 3] = baseData[srcIdx + 3];
            }
          }
        }
        frames.push(zoomed);
        continue;
      }
        
      case 'rainbow': {
        const hueShift = (progress * 360 * 3) % 360;
        for (let j = 0; j < frame.length; j += 4) {
          const [h, s, l] = rgbToHsl(frame[j], frame[j + 1], frame[j + 2]);
          const [r, g, b] = hslToRgb((h + hueShift) % 360, Math.min(1, s + 0.3), l);
          frame[j] = r;
          frame[j + 1] = g;
          frame[j + 2] = b;
        }
        break;
      }
        
      default: {
        const brightness = 0.9 + Math.sin(progress * Math.PI * 2) * 0.1;
        for (let j = 0; j < frame.length; j += 4) {
          frame[j] = Math.min(255, Math.floor(frame[j] * brightness));
          frame[j + 1] = Math.min(255, Math.floor(frame[j + 1] * brightness));
          frame[j + 2] = Math.min(255, Math.floor(frame[j + 2] * brightness));
        }
      }
    }
    
    frames.push(frame);
  }
  
  return frames;
}

// Create GIF
function createGif(frames: Buffer[], width: number, height: number, delayMs: number): Buffer {
  const encoder = new GIFEncoder(width, height);
  encoder.setDelay(delayMs);
  encoder.start();
  
  for (const frame of frames) {
    encoder.addFrame(frame);
  }
  
  encoder.finish();
  return encoder.out.getData();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, prompt, params } = body as {
      image: string;
      prompt: string;
      params: GenerationParams;
    };
    
    if (!image || !prompt) {
      return NextResponse.json({ success: false, error: 'Image and prompt are required' }, { status: 400 });
    }
    
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    const palette = PALETTES[params.palette] || PALETTES.nes;
    const size = parseInt(params.size) || 256;
    
    const { data: quantizedData, width, height } = await quantizeImage(imageBuffer, palette, size);
    const animationType = parseAnimation(prompt);
    const frames = createFrames(quantizedData, width, height, animationType, params.frames);
    const delayMs = Math.round(1000 / params.delay);
    const gifBuffer = createGif(frames, width, height, delayMs);
    
    return NextResponse.json({
      success: true,
      gifData: `data:image/gif;base64,${gifBuffer.toString('base64')}`,
      metadata: {
        frameCount: params.frames,
        palette: params.palette.toUpperCase(),
        fileSize: gifBuffer.length,
        dimensions: { width, height },
      },
    });
  } catch (error) {
    console.error('GIF generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate GIF',
    }, { status: 500 });
  }
}
