const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gif-encoder-2');

// ============================================
// PALETTES
// ============================================
const PALETTES = {
  nes: [
    [15, 15, 15], [29, 43, 83], [126, 37, 83], [0, 135, 81],
    [171, 82, 54], [95, 87, 79], [194, 195, 199], [255, 241, 232]
  ],
  gameboy: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
  c64: [[0, 0, 0], [255, 255, 255], [136, 0, 0], [170, 255, 238], [204, 68, 204], [0, 204, 85], [0, 0, 170], [238, 238, 119]],
  mono: [[0, 0, 0], [255, 255, 255]],
  sepia: [[44, 33, 23], [90, 67, 45], [135, 100, 67], [180, 133, 89], [225, 167, 112], [255, 200, 150]],
  gamegear: [[0, 0, 0], [0, 85, 170], [170, 170, 170], [255, 255, 255]],
  vga: [[0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170], [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170], [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255], [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]],
};

// ============================================
// MATHEMATICAL FUNCTIONS
// ============================================

// Perlin-like noise for organic effects
function noise2D(x, y, seed = 0) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// Smooth noise interpolation
function smoothNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  
  const v00 = noise2D(x0, y0, seed);
  const v10 = noise2D(x0 + 1, y0, seed);
  const v01 = noise2D(x0, y0 + 1, seed);
  const v11 = noise2D(x0 + 1, y0 + 1, seed);
  
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  
  return v00 * (1 - sx) * (1 - sy) + v10 * sx * (1 - sy) + v01 * (1 - sx) * sy + v11 * sx * sy;
}

// Fractal brownian motion
function fbm(x, y, octaves = 4, seed = 0) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency, seed + i * 100);
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return value;
}

// Easing functions
const easings = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInElastic: t => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3)),
  easeOutElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  easeOutBounce: t => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

// Color distance in Lab color space approximation
function colorDistance(r1, g1, b1, r2, g2, b2) {
  const rmean = (r1 + r2) / 2;
  const r = r1 - r2;
  const g = g1 - g2;
  const b = b1 - b2;
  return Math.sqrt(2 * r * r + 4 * g * g + 3 * b * b + rmean * (r * r - b * b) / 256);
}

// Find color boundaries (edges between different colors)
function findColorBoundaries(imageData, width, height) {
  const boundaries = [];
  const data = imageData.data;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Check 4 neighbors
      const neighbors = [
        [(y - 1) * width + x, 'top'],
        [(y + 1) * width + x, 'bottom'],
        [y * width + (x - 1), 'left'],
        [y * width + (x + 1), 'right']
      ];
      
      let maxDiff = 0;
      let dominantDir = '';
      
      for (const [nIdx, dir] of neighbors) {
        const nIdx4 = nIdx * 4;
        const diff = colorDistance(r, g, b, data[nIdx4], data[nIdx4 + 1], data[nIdx4 + 2]);
        if (diff > maxDiff && diff > 30) {
          maxDiff = diff;
          dominantDir = dir;
        }
      }
      
      if (maxDiff > 30) {
        boundaries.push({ x, y, strength: maxDiff, direction: dominantDir });
      }
    }
  }
  
  return boundaries;
}

// Sort pixels by color (HSL)
function sortPixelsByHue(imageData, width, height) {
  const pixels = [];
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    
    if (max !== min) {
      const d = max - min;
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    pixels.push({
      idx: i / 4,
      x: (i / 4) % width,
      y: Math.floor((i / 4) / width),
      hue: h * 360,
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3]
    });
  }
  
  return pixels.sort((a, b) => a.hue - b.hue);
}

// ============================================
// ANIMATION EFFECTS (15+ effects)
// ============================================

const EFFECTS = {
  // 1. Pixel Reveal - Progressive pixel reveal
  pixelReveal: (baseData, width, height, frameCount) => {
    const frames = [];
    const totalPixels = width * height;
    const pixelsPerFrame = Math.ceil(totalPixels / frameCount);
    
    for (let f = 0; f < frameCount; f++) {
      const frame = new Uint8ClampedArray(width * height * 4);
      const revealCount = (f + 1) * pixelsPerFrame;
      
      // Create diagonal reveal pattern
      for (let i = 0; i < revealCount && i < totalPixels; i++) {
        const srcIdx = i * 4;
        const dstIdx = i * 4;
        frame[dstIdx] = baseData[srcIdx];
        frame[dstIdx + 1] = baseData[srcIdx + 1];
        frame[dstIdx + 2] = baseData[srcIdx + 2];
        frame[dstIdx + 3] = baseData[srcIdx + 3];
      }
      
      frames.push(Buffer.from(frame.buffer));
    }
    return frames;
  },

  // 2. Color Wave - Wave propagation through colors
  colorWave: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const frame = Buffer.from(baseData);
      const progress = f / frameCount;
      const waveX = progress * width * 1.5;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const dist = Math.abs(x - waveX);
          const wave = Math.sin((x - waveX) * 0.1) * 50;
          
          if (dist < 30) {
            const intensity = 1 + (30 - dist) / 30 * 0.5;
            frame[idx] = Math.min(255, Math.floor(baseData[idx] * intensity));
            frame[idx + 1] = Math.min(255, Math.floor(baseData[idx + 1] * intensity));
            frame[idx + 2] = Math.min(255, Math.floor(baseData[idx + 2] * intensity));
          }
        }
      }
      
      frames.push(frame);
    }
    return frames;
  },

  // 3. Edge Flow - Animation along color boundaries
  edgeFlow: (baseData, width, height, frameCount) => {
    const frames = [];
    const boundaries = findColorBoundaries({ data: baseData, width, height }, width, height);
    
    for (let f = 0; f < frameCount; f++) {
      const frame = Buffer.from(baseData);
      const progress = f / frameCount;
      
      // Highlight flowing boundaries
      boundaries.forEach((b, i) => {
        const wave = Math.sin(progress * Math.PI * 2 + i * 0.01) * 0.5 + 0.5;
        const idx = (b.y * width + b.x) * 4;
        
        if (wave > 0.7) {
          frame[idx] = Math.min(255, frame[idx] + 100);
          frame[idx + 1] = Math.min(255, frame[idx + 1] + 100);
          frame[idx + 2] = Math.min(255, frame[idx + 2] + 100);
        }
      });
      
      frames.push(frame);
    }
    return frames;
  },

  // 4. Hue Cycle - Rainbow color cycling
  hueCycle: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const frame = Buffer.from(baseData);
      const hueShift = (f / frameCount) * 360;
      
      for (let i = 0; i < frame.length; i += 4) {
        const r = frame[i] / 255;
        const g = frame[i + 1] / 255;
        const b = frame[i + 2] / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
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
        
        const newH = (h + hueShift / 360) % 1;
        
        // HSL to RGB
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        frame[i] = Math.round(hue2rgb(p, q, newH + 1/3) * 255);
        frame[i + 1] = Math.round(hue2rgb(p, q, newH) * 255);
        frame[i + 2] = Math.round(hue2rgb(p, q, newH - 1/3) * 255);
      }
      
      frames.push(frame);
    }
    return frames;
  },

  // 5. Pixel Dissolve - Random pixel reveal
  pixelDissolve: (baseData, width, height, frameCount) => {
    const frames = [];
    const totalPixels = width * height;
    const indices = Array.from({ length: totalPixels }, (_, i) => i);
    
    // Shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    for (let f = 0; f < frameCount; f++) {
      const frame = new Uint8ClampedArray(width * height * 4);
      const revealCount = Math.floor((f + 1) / frameCount * totalPixels);
      
      for (let i = 0; i < revealCount; i++) {
        const srcIdx = indices[i] * 4;
        frame[srcIdx] = baseData[srcIdx];
        frame[srcIdx + 1] = baseData[srcIdx + 1];
        frame[srcIdx + 2] = baseData[srcIdx + 2];
        frame[srcIdx + 3] = baseData[srcIdx + 3];
      }
      
      frames.push(Buffer.from(frame.buffer));
    }
    return frames;
  },

  // 6. Ripple - Water ripple effect
  ripple: (baseData, width, height, frameCount) => {
    const frames = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let f = 0; f < frameCount; f++) {
      const frame = new Uint8ClampedArray(width * height * 4);
      const progress = f / frameCount;
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          const ripple = Math.sin(distance * 0.2 - progress * Math.PI * 4) * 5;
          const srcX = Math.round(x + Math.cos(angle) * ripple);
          const srcY = Math.round(y + Math.sin(angle) * ripple);
          
          const clampedX = Math.max(0, Math.min(width - 1, srcX));
          const clampedY = Math.max(0, Math.min(height - 1, srcY));
          
          const srcIdx = (clampedY * width + clampedX) * 4;
          const dstIdx = (y * width + x) * 4;
          
          frame[dstIdx] = baseData[srcIdx];
          frame[dstIdx + 1] = baseData[srcIdx + 1];
          frame[dstIdx + 2] = baseData[srcIdx + 2];
          frame[dstIdx + 3] = baseData[srcIdx + 3];
        }
      }
      
      frames.push(Buffer.from(frame.buffer));
    }
    return frames;
  },

  // 7. Glitch - Digital glitch effect
  glitch: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const frame = Buffer.from(baseData);
      const glitchIntensity = Math.sin(f / frameCount * Math.PI * 2) * 0.5 + 0.5;
      
      // Random horizontal shifts
      const numGlitches = Math.floor(glitchIntensity * 10);
      for (let g = 0; g < numGlitches; g++) {
        const y = Math.floor(Math.random() * height);
        const lineHeight = Math.floor(Math.random() * 10) + 1;
        const shift = Math.floor((Math.random() - 0.5) * 20 * glitchIntensity);
        
        for (let ly = y; ly < Math.min(height, y + lineHeight); ly++) {
          for (let x = 0; x < width; x++) {
            const srcX = (x + shift + width) % width;
            const srcIdx = (ly * width + srcX) * 4;
            const dstIdx = (ly * width + x) * 4;
            
            frame[dstIdx] = baseData[srcIdx];
            frame[dstIdx + 1] = baseData[srcIdx + 1];
            frame[dstIdx + 2] = baseData[srcIdx + 2];
          }
        }
      }
      
      // RGB shift
      if (glitchIntensity > 0.5) {
        const rgbShift = Math.floor(glitchIntensity * 5);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width - rgbShift; x++) {
            const idx = (y * width + x) * 4;
            const rIdx = (y * width + x + rgbShift) * 4;
            frame[idx] = baseData[rIdx]; // Shift red channel
          }
        }
      }
      
      frames.push(frame);
    }
    return frames;
  },

  // 8. Pixel Sort - Sort pixels by luminance
  pixelSort: (baseData, width, height, frameCount) => {
    const frames = [];
    
    const getLuminance = (idx) => {
      return 0.299 * baseData[idx] + 0.587 * baseData[idx + 1] + 0.114 * baseData[idx + 2];
    };
    
    // Pre-sort each row
    const sortedRows = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        row.push({
          x, 
          lum: getLuminance(idx),
          r: baseData[idx],
          g: baseData[idx + 1],
          b: baseData[idx + 2],
          a: baseData[idx + 3]
        });
      }
      row.sort((a, b) => a.lum - b.lum);
      sortedRows.push(row);
    }
    
    for (let f = 0; f < frameCount; f++) {
      const frame = Buffer.from(baseData);
      const sortProgress = (f + 1) / frameCount;
      
      for (let y = 0; y < height; y++) {
        const sortCount = Math.floor(width * sortProgress);
        for (let x = 0; x < sortCount; x++) {
          const sorted = sortedRows[y][x];
          const idx = (y * width + x) * 4;
          frame[idx] = sorted.r;
          frame[idx + 1] = sorted.g;
          frame[idx + 2] = sorted.b;
          frame[idx + 3] = sorted.a;
        }
      }
      
      frames.push(frame);
    }
    return frames;
  },

  // 9. Mosaic Zoom - Zoom with mosaic effect
  mosaicZoom: (baseData, width, height, frameCount) => {
    const frames = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let f = 0; f < frameCount; f++) {
      const frame = new Uint8ClampedArray(width * height * 4);
      const progress = f / frameCount;
      const zoom = 1 + Math.sin(progress * Math.PI) * 0.3;
      const mosaicSize = Math.floor(1 + progress * 4);
      
      for (let y = 0; y < height; y += mosaicSize) {
        for (let x = 0; x < width; x += mosaicSize) {
          const dx = (x - centerX) / zoom + centerX;
          const dy = (y - centerY) / zoom + centerY;
          const srcX = Math.floor(dx);
          const srcY = Math.floor(dy);
          
          const clampedX = Math.max(0, Math.min(width - 1, srcX));
          const clampedY = Math.max(0, Math.min(height - 1, srcY));
          const srcIdx = (clampedY * width + clampedX) * 4;
          
          // Fill mosaic block
          for (let my = 0; my < mosaicSize && y + my < height; my++) {
            for (let mx = 0; mx < mosaicSize && x + mx < width; mx++) {
              const dstIdx = ((y + my) * width + (x + mx)) * 4;
              frame[dstIdx] = baseData[srcIdx];
              frame[dstIdx + 1] = baseData[srcIdx + 1];
              frame[dstIdx + 2] = baseData[srcIdx + 2];
              frame[dstIdx + 3] = baseData[srcIdx + 3];
            }
          }
        }
      }
      
      frames.push(Buffer.from(frame.buffer));
    }
    return frames;
  },

  // 10. Noise Warp - Perlin noise distortion
  noiseWarp: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const frame = new Uint8ClampedArray(width * height * 4);
      const progress = f / frameCount;
      const time = progress * Math.PI * 2;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const noiseX = fbm(x * 0.02, y * 0.02, 4, Math.floor(progress * 100)) * 20;
          const noiseY = fbm(x * 0.02 + 100, y * 0.02, 4, Math.floor(progress * 100)) * 20;
          
          const srcX = Math.floor(x + noiseX * Math.sin(time));
          const srcY = Math.floor(y + noiseY * Math.cos(time));
          
          const clampedX = Math.max(0, Math.min(width - 1, srcX));
          const clampedY = Math.max(0, Math.min(height - 1, srcY));
          
          const srcIdx = (clampedY * width + clampedX) * 4;
          const dstIdx = (y * width + x) * 4;
          
          frame[dstIdx] = baseData[srcIdx];
          frame[dstIdx + 1] = baseData[srcIdx + 1];
          frame[dstIdx + 2] = baseData[srcIdx + 2];
          frame[dstIdx + 3] = baseData[srcIdx + 3];
        }
      }
      
      frames.push(Buffer.from(frame.buffer));
    }
    return frames;
  },

  // 11. Scanline Wave - Moving scanlines with wave
  scanlineWave: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const frame = Buffer.from(baseData);
      const progress = f / frameCount;
      
      for (let y = 0; y < height; y++) {
        const wave = Math.sin(y * 0.1 + progress * Math.PI * 4) * 0.3 + 0.7;
        const scanEffect = Math.sin(y * 0.5 + progress * height * 2) > 0 ? 1 : 0.8;
        
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          frame[idx] = Math.floor(frame[idx] * wave * scanEffect);
          frame[idx + 1] = Math.floor(frame[idx + 1] * wave * scanEffect);
          frame[idx + 2] = Math.floor(frame[idx + 2] * wave * scanEffect);
        }
      }
      
      frames.push(frame);
    }
    return frames;
  },

  // 12. Color Separation - CMYK separation animation
  colorSeparation: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const frame = new Uint8ClampedArray(width * height * 4);
      const progress = f / frameCount;
      const offset = Math.sin(progress * Math.PI * 2) * 10;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // Red channel shifted left
          const redX = Math.max(0, x + Math.floor(offset));
          const redIdx = (y * width + redX) * 4;
          
          // Blue channel shifted right  
          const blueX = Math.min(width - 1, x - Math.floor(offset));
          const blueIdx = (y * width + blueX) * 4;
          
          frame[idx] = baseData[redIdx]; // Red from left
          frame[idx + 1] = baseData[idx + 1]; // Green stays
          frame[idx + 2] = baseData[blueIdx + 2]; // Blue from right
          frame[idx + 3] = baseData[idx + 3];
        }
      }
      
      frames.push(Buffer.from(frame.buffer));
    }
    return frames;
  },

  // 13. Pixelate Progressive - Increasing pixelation
  pixelateProgressive: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const frame = new Uint8ClampedArray(width * height * 4);
      const progress = f / frameCount;
      const blockSize = Math.max(1, Math.floor(1 + progress * 8));
      
      for (let by = 0; by < height; by += blockSize) {
        for (let bx = 0; bx < width; bx += blockSize) {
          // Average color in block
          let r = 0, g = 0, b = 0, a = 0, count = 0;
          
          for (let y = by; y < Math.min(height, by + blockSize); y++) {
            for (let x = bx; x < Math.min(width, bx + blockSize); x++) {
              const idx = (y * width + x) * 4;
              r += baseData[idx];
              g += baseData[idx + 1];
              b += baseData[idx + 2];
              a += baseData[idx + 3];
              count++;
            }
          }
          
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);
          a = Math.floor(a / count);
          
          // Fill block with average color
          for (let y = by; y < Math.min(height, by + blockSize); y++) {
            for (let x = bx; x < Math.min(width, bx + blockSize); x++) {
              const idx = (y * width + x) * 4;
              frame[idx] = r;
              frame[idx + 1] = g;
              frame[idx + 2] = b;
              frame[idx + 3] = a;
            }
          }
        }
      }
      
      frames.push(Buffer.from(frame.buffer));
    }
    return frames;
  },

  // 14. Vortex - Spiral distortion
  vortex: (baseData, width, height, frameCount) => {
    const frames = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let f = 0; f < frameCount; f++) {
      const frame = new Uint8ClampedArray(width * height * 4);
      const progress = f / frameCount;
      const angle = progress * Math.PI * 4;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
          
          const twist = (1 - distance / maxDist) * angle;
          const cosT = Math.cos(twist);
          const sinT = Math.sin(twist);
          
          const srcX = Math.floor(cosT * dx - sinT * dy + centerX);
          const srcY = Math.floor(sinT * dx + cosT * dy + centerY);
          
          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            const srcIdx = (srcY * width + srcX) * 4;
            const dstIdx = (y * width + x) * 4;
            frame[dstIdx] = baseData[srcIdx];
            frame[dstIdx + 1] = baseData[srcIdx + 1];
            frame[dstIdx + 2] = baseData[srcIdx + 2];
            frame[dstIdx + 3] = baseData[srcIdx + 3];
          }
        }
      }
      
      frames.push(Buffer.from(frame.buffer));
    }
    return frames;
  },

  // 15. Breathing - Scale pulse effect
  breathing: (baseData, width, height, frameCount) => {
    const frames = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let f = 0; f < frameCount; f++) {
      const frame = new Uint8ClampedArray(width * height * 4);
      const progress = f / frameCount;
      const scale = 0.9 + Math.sin(progress * Math.PI * 2) * 0.1;
      const ease = easings.easeInOutQuad(Math.sin(progress * Math.PI) + 0.5);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = (x - centerX) / scale + centerX;
          const dy = (y - centerY) / scale + centerY;
          
          const srcX = Math.floor(dx);
          const srcY = Math.floor(dy);
          
          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            const srcIdx = (srcY * width + srcX) * 4;
            const dstIdx = (y * width + x) * 4;
            frame[dstIdx] = baseData[srcIdx];
            frame[dstIdx + 1] = baseData[srcIdx + 1];
            frame[dstIdx + 2] = baseData[srcIdx + 2];
            frame[dstIdx + 3] = baseData[srcIdx + 3];
          } else {
            // Background color
            const idx = (y * width + x) * 4;
            frame[idx] = 15;
            frame[idx + 1] = 15;
            frame[idx + 2] = 15;
            frame[idx + 3] = 255;
          }
        }
      }
      
      frames.push(Buffer.from(frame.buffer));
    }
    return frames;
  },

  // 16. Interlace - Old TV interlace effect
  interlace: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const frame = Buffer.from(baseData);
      const progress = f / frameCount;
      const offset = f % 2;
      
      for (let y = offset; y < height; y += 2) {
        const brightness = 0.7 + Math.sin(y * 0.1 + progress * Math.PI * 2) * 0.3;
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          frame[idx] = Math.floor(frame[idx] * brightness);
          frame[idx + 1] = Math.floor(frame[idx + 1] * brightness);
          frame[idx + 2] = Math.floor(frame[idx + 2] * brightness);
        }
      }
      
      frames.push(frame);
    }
    return frames;
  }
};

// ============================================
// MAIN HANDLER
// ============================================

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ success: false, error: 'Method not allowed' }) 
    };
  }
  
  try {
    const { image, prompt, params } = JSON.parse(event.body);
    
    if (!image || !prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Image and prompt are required' })
      };
    }
    
    // Parse base64 image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Load image with canvas
    const img = await loadImage(imageBuffer);
    const size = parseInt(params.size) || 256;
    
    // Calculate dimensions maintaining aspect ratio
    let width = size;
    let height = size;
    if (img.width > img.height) {
      height = Math.round((img.height / img.width) * size);
    } else if (img.height > img.width) {
      width = Math.round((img.width / img.height) * size);
    }
    
    width = Math.max(16, width);
    height = Math.max(16, height);
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw image
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    // Get image data
    let imageData = ctx.getImageData(0, 0, width, height);
    
    // Apply palette quantization
    const palette = PALETTES[params.palette] || PALETTES.nes;
    const quantizedData = new Uint8ClampedArray(imageData.data.length);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      
      if (a < 128) {
        quantizedData[i] = 15;
        quantizedData[i + 1] = 15;
        quantizedData[i + 2] = 15;
        quantizedData[i + 3] = 0;
      } else {
        // Find closest palette color
        let minDist = Infinity;
        let closest = palette[0];
        for (const color of palette) {
          const dist = Math.sqrt((r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2);
          if (dist < minDist) {
            minDist = dist;
            closest = color;
          }
        }
        quantizedData[i] = closest[0];
        quantizedData[i + 1] = closest[1];
        quantizedData[i + 2] = closest[2];
        quantizedData[i + 3] = 255;
      }
    }
    
    // Determine effect from prompt
    const effectMap = {
      'pixel reveal': 'pixelReveal',
      'color wave': 'colorWave',
      'edge flow': 'edgeFlow',
      'rainbow': 'hueCycle',
      'hue cycle': 'hueCycle',
      'dissolve': 'pixelDissolve',
      'ripple': 'ripple',
      'water': 'ripple',
      'glitch': 'glitch',
      'pixel sort': 'pixelSort',
      'mosaic': 'mosaicZoom',
      'noise': 'noiseWarp',
      'warp': 'noiseWarp',
      'scanline': 'scanlineWave',
      'crt': 'scanlineWave',
      'color separation': 'colorSeparation',
      'pixelate': 'pixelateProgressive',
      'vortex': 'vortex',
      'spiral': 'vortex',
      'breathing': 'breathing',
      'pulse': 'breathing',
      'interlace': 'interlace',
      'tv': 'interlace'
    };
    
    let effectName = 'breathing'; // default
    const lowerPrompt = prompt.toLowerCase();
    
    for (const [keyword, effect] of Object.entries(effectMap)) {
      if (lowerPrompt.includes(keyword)) {
        effectName = effect;
        break;
      }
    }
    
    // Generate frames
    const frameCount = params.frames || 4;
    const frames = EFFECTS[effectName](quantizedData, width, height, frameCount);
    
    // Create GIF
    const encoder = new GIFEncoder(width, height);
    encoder.setDelay(Math.round(1000 / (params.delay || 5)));
    encoder.start();
    
    for (const frame of frames) {
      // Create ImageData from frame
      const frameImageData = new ImageData(new Uint8ClampedArray(frame), width, height);
      
      // Create temporary canvas for frame
      const frameCanvas = createCanvas(width, height);
      const frameCtx = frameCanvas.getContext('2d');
      frameCtx.putImageData(frameImageData, 0, 0);
      
      encoder.addFrame(frameCtx);
    }
    
    encoder.finish();
    
    const gifBuffer = encoder.out.getData();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        gifData: `data:image/gif;base64,${gifBuffer.toString('base64')}`,
        metadata: {
          frameCount,
          palette: params.palette?.toUpperCase() || 'NES',
          fileSize: gifBuffer.length,
          dimensions: { width, height },
          effect: effectName
        }
      })
    };
    
  } catch (error) {
    console.error('Generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate GIF'
      })
    };
  }
};
