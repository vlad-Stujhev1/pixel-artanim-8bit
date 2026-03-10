/**
 * PixelAnim8 - Browser-based 8-bit GIF Generator
 * Works entirely in the browser - no server needed!
 */

// ============================================
// PALETTES
// ============================================
const PALETTES = {
  nes: {
    name: 'NES',
    colors: [
      [15, 15, 15], [29, 43, 83], [126, 37, 83], [0, 135, 81],
      [171, 82, 54], [95, 87, 79], [194, 195, 199], [255, 241, 232]
    ],
    hex: ['#0f0f0f', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8']
  },
  gameboy: {
    name: 'Game Boy',
    colors: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
    hex: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
  },
  c64: {
    name: 'C64',
    colors: [[0, 0, 0], [255, 255, 255], [136, 0, 0], [170, 255, 238], 
             [204, 68, 204], [0, 204, 85], [0, 0, 170], [238, 238, 119]],
    hex: ['#000000', '#ffffff', '#880000', '#aaffee', '#cc44cc', '#00cc55', '#0000aa', '#eeee77']
  },
  mono: {
    name: 'Mono',
    colors: [[0, 0, 0], [255, 255, 255]],
    hex: ['#000000', '#ffffff']
  }
};

// ============================================
// STATE
// ============================================
let state = {
  imageData: null,
  originalImage: null,
  width: 0,
  height: 0,
  fileName: '',
  params: {
    palette: 'nes',
    frames: 4,
    fps: 5,
    size: 128
  },
  generating: false
};

// ============================================
// DOM ELEMENTS
// ============================================
const $ = id => document.getElementById(id);

const dom = {
  // Upload
  uploadArea: $('uploadArea'),
  fileInput: $('fileInput'),
  previewContainer: $('previewContainer'),
  previewCanvas: $('previewCanvas'),
  removeBtn: $('removeBtn'),
  fileName: $('fileName'),
  
  // Prompt
  promptInput: $('promptInput'),
  effectTags: document.querySelectorAll('.effect-tag'),
  
  // Parameters
  paletteSelect: $('paletteSelect'),
  palettePreview: $('palettePreview'),
  framesSlider: $('framesSlider'),
  framesValue: $('framesValue'),
  fpsSlider: $('fpsSlider'),
  fpsValue: $('fpsValue'),
  sizeButtons: document.querySelectorAll('.size-btn'),
  
  // Generate
  generateBtn: $('generateBtn'),
  errorBox: $('errorBox'),
  
  // Result
  emptyState: $('emptyState'),
  loadingState: $('loadingState'),
  resultState: $('resultState'),
  resultGif: $('resultGif'),
  progressFill: $('progressFill'),
  progressText: $('progressText'),
  metadataBox: $('metadataBox'),
  metaFrames: $('metaFrames'),
  metaPalette: $('metaPalette'),
  metaSize: $('metaSize'),
  metaEffect: $('metaEffect'),
  actionButtons: $('actionButtons'),
  downloadBtn: $('downloadBtn'),
  regenerateBtn: $('regenerateBtn'),
  
  // Work canvas
  workCanvas: $('workCanvas')
};

// ============================================
// INITIALIZATION
// ============================================
function init() {
  updatePalettePreview();
  bindEvents();
}

function bindEvents() {
  // Upload events
  dom.uploadArea.addEventListener('click', () => dom.fileInput.click());
  dom.uploadArea.addEventListener('dragover', handleDragOver);
  dom.uploadArea.addEventListener('dragleave', handleDragLeave);
  dom.uploadArea.addEventListener('drop', handleDrop);
  dom.fileInput.addEventListener('change', handleFileSelect);
  dom.removeBtn.addEventListener('click', removeImage);
  
  // Effect tags
  dom.effectTags.forEach(tag => {
    tag.addEventListener('click', () => {
      dom.promptInput.value = tag.dataset.effect;
      updateGenerateButton();
    });
  });
  
  // Parameters
  dom.paletteSelect.addEventListener('change', (e) => {
    state.params.palette = e.target.value;
    updatePalettePreview();
  });
  
  dom.framesSlider.addEventListener('input', (e) => {
    state.params.frames = parseInt(e.target.value);
    dom.framesValue.textContent = state.params.frames;
  });
  
  dom.fpsSlider.addEventListener('input', (e) => {
    state.params.fps = parseInt(e.target.value);
    dom.fpsValue.textContent = state.params.fps + ' FPS';
  });
  
  dom.sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.sizeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.params.size = parseInt(btn.dataset.size);
    });
  });
  
  // Generate
  dom.generateBtn.addEventListener('click', generateGif);
  dom.promptInput.addEventListener('input', updateGenerateButton);
  
  // Actions
  dom.downloadBtn.addEventListener('click', downloadGif);
  dom.regenerateBtn.addEventListener('click', generateGif);
}

// ============================================
// FILE HANDLING
// ============================================
function handleDragOver(e) {
  e.preventDefault();
  dom.uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  dom.uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  dom.uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  // Validate
  const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp'];
  if (!validTypes.includes(file.type)) {
    showError('Invalid format! Use PNG, JPEG, GIF, or BMP.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showError('File too large! Maximum size is 5MB.');
    return;
  }
  
  hideError();
  state.fileName = file.name;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.originalImage = img;
      processImage(img);
      showPreview();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function processImage(img) {
  const size = state.params.size;
  let width = size;
  let height = size;
  
  // Maintain aspect ratio
  if (img.width > img.height) {
    height = Math.round((img.height / img.width) * size);
  } else if (img.height > img.width) {
    width = Math.round((img.width / img.height) * size);
  }
  
  width = Math.max(16, width);
  height = Math.max(16, height);
  
  state.width = width;
  state.height = height;
  
  // Draw to work canvas
  const canvas = dom.workCanvas;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  
  state.imageData = ctx.getImageData(0, 0, width, height);
  
  // Apply quantization
  quantizeImage();
}

function quantizeImage() {
  const palette = PALETTES[state.params.palette].colors;
  const data = state.imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    if (a < 128) {
      data[i] = 15;
      data[i + 1] = 15;
      data[i + 2] = 15;
      data[i + 3] = 0;
    } else {
      const closest = findClosestColor(r, g, b, palette);
      data[i] = closest[0];
      data[i + 1] = closest[1];
      data[i + 2] = closest[2];
      data[i + 3] = 255;
    }
  }
  
  // Update canvas
  const ctx = dom.workCanvas.getContext('2d');
  ctx.putImageData(state.imageData, 0, 0);
}

function findClosestColor(r, g, b, palette) {
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

function showPreview() {
  // Draw to preview canvas
  const canvas = dom.previewCanvas;
  const ctx = canvas.getContext('2d');
  
  // Scale for display
  const maxSize = 200;
  const scale = Math.min(maxSize / state.width, maxSize / state.height, 1);
  canvas.width = state.width * scale;
  canvas.height = state.height * scale;
  
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(dom.workCanvas, 0, 0, canvas.width, canvas.height);
  
  dom.uploadArea.classList.add('hidden');
  dom.previewContainer.classList.remove('hidden');
  dom.fileName.textContent = state.fileName;
  
  updateGenerateButton();
}

function removeImage() {
  state.imageData = null;
  state.originalImage = null;
  state.fileName = '';
  
  dom.uploadArea.classList.remove('hidden');
  dom.previewContainer.classList.add('hidden');
  dom.fileInput.value = '';
  
  updateGenerateButton();
}

// ============================================
// UI HELPERS
// ============================================
function updatePalettePreview() {
  const hexColors = PALETTES[state.params.palette].hex;
  dom.palettePreview.innerHTML = hexColors.map(c => 
    `<div class="palette-color" style="background-color: ${c}"></div>`
  ).join('');
}

function updateGenerateButton() {
  const hasImage = state.imageData !== null;
  const hasPrompt = dom.promptInput.value.trim().length > 0;
  dom.generateBtn.disabled = !hasImage || !hasPrompt;
}

function showError(msg) {
  dom.errorBox.textContent = msg;
  dom.errorBox.classList.remove('hidden');
}

function hideError() {
  dom.errorBox.classList.add('hidden');
}

function updateProgress(percent) {
  dom.progressFill.style.width = percent + '%';
  dom.progressText.textContent = percent + '%';
}

// ============================================
// COLOR UTILS
// ============================================
function rgbToHsl(r, g, b) {
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

function hslToRgb(h, s, l) {
  h /= 360;
  const hue2rgb = (p, q, t) => {
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

// ============================================
// ANIMATION EFFECTS
// ============================================
function parseEffect(prompt) {
  const p = prompt.toLowerCase();
  
  if (p.includes('rainbow') || p.includes('hue')) return 'rainbow';
  if (p.includes('wave')) return 'wave';
  if (p.includes('shake') || p.includes('vibrat')) return 'shake';
  if (p.includes('spin') || p.includes('rotate')) return 'spin';
  if (p.includes('zoom')) return 'zoom';
  if (p.includes('glitch')) return 'glitch';
  if (p.includes('reveal') || p.includes('draw')) return 'reveal';
  if (p.includes('ripple') || p.includes('water')) return 'ripple';
  if (p.includes('vortex') || p.includes('spiral')) return 'vortex';
  if (p.includes('pulse') || p.includes('breath')) return 'pulse';
  
  return 'pulse';
}

const Effects = {
  // 1. Pulse / Breathing
  pulse: (baseData, width, height, frameCount) => {
    const frames = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let f = 0; f < frameCount; f++) {
      const progress = f / frameCount;
      const scale = 0.9 + Math.sin(progress * Math.PI * 2) * 0.1;
      const frame = new Uint8ClampedArray(baseData.length);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcX = Math.floor((x - centerX) / scale + centerX);
          const srcY = Math.floor((y - centerY) / scale + centerY);
          const dstIdx = (y * width + x) * 4;
          
          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            const srcIdx = (srcY * width + srcX) * 4;
            frame[dstIdx] = baseData[srcIdx];
            frame[dstIdx + 1] = baseData[srcIdx + 1];
            frame[dstIdx + 2] = baseData[srcIdx + 2];
            frame[dstIdx + 3] = baseData[srcIdx + 3];
          } else {
            frame[dstIdx] = 15;
            frame[dstIdx + 1] = 15;
            frame[dstIdx + 2] = 15;
            frame[dstIdx + 3] = 255;
          }
        }
      }
      frames.push(new ImageData(frame, width, height));
    }
    return frames;
  },
  
  // 2. Rainbow
  rainbow: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const hueShift = (f / frameCount) * 360;
      const frame = new Uint8ClampedArray(baseData);
      
      for (let i = 0; i < frame.length; i += 4) {
        const [h, s, l] = rgbToHsl(frame[i], frame[i + 1], frame[i + 2]);
        const [r, g, b] = hslToRgb((h + hueShift) % 360, Math.min(1, s + 0.2), l);
        frame[i] = r;
        frame[i + 1] = g;
        frame[i + 2] = b;
      }
      frames.push(new ImageData(frame, width, height));
    }
    return frames;
  },
  
  // 3. Wave
  wave: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const progress = f / frameCount;
      const frame = new Uint8ClampedArray(baseData.length);
      
      for (let y = 0; y < height; y++) {
        const waveOffset = Math.sin((y / height) * Math.PI * 4 + progress * Math.PI * 2) * 4;
        for (let x = 0; x < width; x++) {
          const srcX = Math.max(0, Math.min(width - 1, x - Math.round(waveOffset)));
          const srcIdx = (y * width + srcX) * 4;
          const dstIdx = (y * width + x) * 4;
          frame[dstIdx] = baseData[srcIdx];
          frame[dstIdx + 1] = baseData[srcIdx + 1];
          frame[dstIdx + 2] = baseData[srcIdx + 2];
          frame[dstIdx + 3] = baseData[srcIdx + 3];
        }
      }
      frames.push(new ImageData(frame, width, height));
    }
    return frames;
  },
  
  // 4. Shake
  shake: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const shakeX = Math.round((Math.random() - 0.5) * 4);
      const shakeY = Math.round((Math.random() - 0.5) * 4);
      const frame = new Uint8ClampedArray(baseData.length);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcX = Math.max(0, Math.min(width - 1, x - shakeX));
          const srcY = Math.max(0, Math.min(height - 1, y - shakeY));
          const srcIdx = (srcY * width + srcX) * 4;
          const dstIdx = (y * width + x) * 4;
          frame[dstIdx] = baseData[srcIdx];
          frame[dstIdx + 1] = baseData[srcIdx + 1];
          frame[dstIdx + 2] = baseData[srcIdx + 2];
          frame[dstIdx + 3] = baseData[srcIdx + 3];
        }
      }
      frames.push(new ImageData(frame, width, height));
    }
    return frames;
  },
  
  // 5. Spin
  spin: (baseData, width, height, frameCount) => {
    const frames = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let f = 0; f < frameCount; f++) {
      const angle = (f / frameCount) * Math.PI * 2;
      const frame = new Uint8ClampedArray(baseData.length);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const srcX = Math.round(centerX + dx * Math.cos(angle) - dy * Math.sin(angle));
          const srcY = Math.round(centerY + dx * Math.sin(angle) + dy * Math.cos(angle));
          const dstIdx = (y * width + x) * 4;
          
          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            const srcIdx = (srcY * width + srcX) * 4;
            frame[dstIdx] = baseData[srcIdx];
            frame[dstIdx + 1] = baseData[srcIdx + 1];
            frame[dstIdx + 2] = baseData[srcIdx + 2];
            frame[dstIdx + 3] = baseData[srcIdx + 3];
          } else {
            frame[dstIdx] = 15;
            frame[dstIdx + 1] = 15;
            frame[dstIdx + 2] = 15;
            frame[dstIdx + 3] = 255;
          }
        }
      }
      frames.push(new ImageData(frame, width, height));
    }
    return frames;
  },
  
  // 6. Zoom
  zoom: (baseData, width, height, frameCount) => {
    const frames = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let f = 0; f < frameCount; f++) {
      const progress = f / frameCount;
      const scale = 0.8 + Math.sin(progress * Math.PI * 2) * 0.2;
      const frame = new Uint8ClampedArray(baseData.length);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcX = Math.round((x - centerX) / scale + centerX);
          const srcY = Math.round((y - centerY) / scale + centerY);
          const dstIdx = (y * width + x) * 4;
          
          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            const srcIdx = (srcY * width + srcX) * 4;
            frame[dstIdx] = baseData[srcIdx];
            frame[dstIdx + 1] = baseData[srcIdx + 1];
            frame[dstIdx + 2] = baseData[srcIdx + 2];
            frame[dstIdx + 3] = baseData[srcIdx + 3];
          } else {
            frame[dstIdx] = 15;
            frame[dstIdx + 1] = 15;
            frame[dstIdx + 2] = 15;
            frame[dstIdx + 3] = 255;
          }
        }
      }
      frames.push(new ImageData(frame, width, height));
    }
    return frames;
  },
  
  // 7. Glitch
  glitch: (baseData, width, height, frameCount) => {
    const frames = [];
    
    for (let f = 0; f < frameCount; f++) {
      const frame = new Uint8ClampedArray(baseData);
      const intensity = Math.sin((f / frameCount) * Math.PI * 2) * 0.5 + 0.5;
      const numGlitches = Math.floor(intensity * 8);
      
      for (let g = 0; g < numGlitches; g++) {
        const y = Math.floor(Math.random() * height);
        const lineHeight = Math.floor(Math.random() * 8) + 1;
        const shift = Math.floor((Math.random() - 0.5) * 15 * intensity);
        
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
      frames.push(new ImageData(frame, width, height));
    }
    return frames;
  },
  
  // 8. Reveal
  reveal: (baseData, width, height, frameCount) => {
    const frames = [];
    const totalPixels = width * height;
    const pixelsPerFrame = Math.ceil(totalPixels / frameCount);
    
    for (let f = 0; f < frameCount; f++) {
      const frame = new Uint8ClampedArray(baseData.length);
      const revealCount = (f + 1) * pixelsPerFrame;
      
      for (let i = 0; i < Math.min(revealCount, totalPixels); i++) {
        const idx = i * 4;
        frame[idx] = baseData[idx];
        frame[idx + 1] = baseData[idx + 1];
        frame[idx + 2] = baseData[idx + 2];
        frame[idx + 3] = baseData[idx + 3];
      }
      frames.push(new ImageData(frame, width, height));
    }
    return frames;
  },
  
  // 9. Ripple
  ripple: (baseData, width, height, frameCount) => {
    const frames = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let f = 0; f < frameCount; f++) {
      const progress = f / frameCount;
      const frame = new Uint8ClampedArray(baseData.length);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          const ripple = Math.sin(distance * 0.15 - progress * Math.PI * 4) * 4;
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
      frames.push(new ImageData(frame, width, height));
    }
    return frames;
  },
  
  // 10. Vortex
  vortex: (baseData, width, height, frameCount) => {
    const frames = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    
    for (let f = 0; f < frameCount; f++) {
      const progress = f / frameCount;
      const frame = new Uint8ClampedArray(baseData.length);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const twist = (1 - distance / maxDist) * progress * Math.PI * 4;
          const cosT = Math.cos(twist);
          const sinT = Math.sin(twist);
          
          const srcX = Math.floor(cosT * dx - sinT * dy + centerX);
          const srcY = Math.floor(sinT * dx + cosT * dy + centerY);
          
          const dstIdx = (y * width + x) * 4;
          
          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            const srcIdx = (srcY * width + srcX) * 4;
            frame[dstIdx] = baseData[srcIdx];
            frame[dstIdx + 1] = baseData[srcIdx + 1];
            frame[dstIdx + 2] = baseData[srcIdx + 2];
            frame[dstIdx + 3] = baseData[srcIdx + 3];
          } else {
            frame[dstIdx] = 15;
            frame[dstIdx + 1] = 15;
            frame[dstIdx + 2] = 15;
            frame[dstIdx + 3] = 255;
          }
        }
      }
      frames.push(new ImageData(frame, width, height));
    }
    return frames;
  }
};

// ============================================
// GIF GENERATION
// ============================================
async function generateGif() {
  if (state.generating || !state.imageData) return;
  
  state.generating = true;
  hideError();
  
  // Show loading state
  dom.emptyState.classList.add('hidden');
  dom.resultState.classList.add('hidden');
  dom.loadingState.classList.remove('hidden');
  dom.actionButtons.classList.add('hidden');
  dom.metadataBox.classList.add('hidden');
  dom.generateBtn.disabled = true;
  
  try {
    // Get parameters
    const effectName = parseEffect(dom.promptInput.value);
    const frameCount = state.params.frames;
    const fps = state.params.fps;
    const width = state.width;
    const height = state.height;
    
    // Generate frames
    updateProgress(10);
    
    const baseData = new Uint8ClampedArray(state.imageData.data);
    const effect = Effects[effectName] || Effects.pulse;
    
    updateProgress(20);
    
    // Use setTimeout to allow UI updates
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const frames = effect(baseData, width, height, frameCount);
    
    updateProgress(50);
    
    // Create GIF
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: width,
      height: height,
      workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
    });
    
    // Create temp canvas for frames
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    for (const frame of frames) {
      tempCtx.putImageData(frame, 0, 0);
      gif.addFrame(tempCanvas, { delay: Math.round(1000 / fps), copy: true });
    }
    
    updateProgress(70);
    
    // Render GIF
    gif.render();
    
    gif.on('progress', (p) => {
      updateProgress(70 + Math.round(p * 30));
    });
    
    gif.on('finished', (blob) => {
      const url = URL.createObjectURL(blob);
      dom.resultGif.src = url;
      dom.resultGif.dataset.blob = url;
      
      // Update metadata
      dom.metaFrames.textContent = frameCount;
      dom.metaPalette.textContent = PALETTES[state.params.palette].name;
      dom.metaSize.textContent = `${width}×${height}`;
      dom.metaEffect.textContent = effectName;
      
      // Show result
      dom.loadingState.classList.add('hidden');
      dom.resultState.classList.remove('hidden');
      dom.metadataBox.classList.remove('hidden');
      dom.actionButtons.classList.remove('hidden');
      
      updateProgress(100);
      state.generating = false;
      dom.generateBtn.disabled = false;
    });
    
    gif.on('error', (err) => {
      throw err;
    });
    
  } catch (err) {
    console.error('GIF generation error:', err);
    showError('Failed to generate GIF: ' + err.message);
    dom.loadingState.classList.add('hidden');
    dom.emptyState.classList.remove('hidden');
    state.generating = false;
    updateGenerateButton();
  }
}

// ============================================
// DOWNLOAD
// ============================================
function downloadGif() {
  const src = dom.resultGif.src;
  if (!src) return;
  
  const link = document.createElement('a');
  link.href = src;
  link.download = `pixelanim8-${Date.now()}.gif`;
  link.click();
}

// ============================================
// START
// ============================================
document.addEventListener('DOMContentLoaded', init);
