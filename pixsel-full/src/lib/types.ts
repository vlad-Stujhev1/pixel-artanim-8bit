// PixelAnim8 Types

export interface GenerationParams {
  palette: ColorPalette;
  frames: number;
  delay: number;
  size: OutputSize;
}

export type ColorPalette = 'nes' | 'gameboy' | 'c64' | 'mono';

export type OutputSize = '128' | '256' | '512';

export interface HistoryItem {
  id: string;
  thumbnail: string;
  prompt: string;
  params: GenerationParams;
  gifData: string;
  createdAt: number;
  metadata: GenerationMetadata;
}

export interface GenerationMetadata {
  frameCount: number;
  palette: string;
  fileSize: number;
  dimensions: { width: number; height: number };
}

export interface GenerationResult {
  success: boolean;
  gifData?: string;
  metadata?: GenerationMetadata;
  error?: string;
}

export const PALETTE_INFO: Record<ColorPalette, { name: string; colors: string[] }> = {
  nes: {
    name: 'NES',
    colors: ['#0f0f0f', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8'],
  },
  gameboy: {
    name: 'Game Boy',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  },
  c64: {
    name: 'Commodore 64',
    colors: ['#000000', '#ffffff', '#880000', '#aaffee', '#cc44cc', '#00cc55', '#0000aa', '#eeee77'],
  },
  mono: {
    name: 'Monochrome',
    colors: ['#000000', '#ffffff'],
  },
};

export const SUGGESTED_PROMPTS = [
  'make it pulse and glow',
  'create a bounce animation',
  'add blinking effect',
  'make it wave',
  'create a spin effect',
  'add rainbow colors',
  'make it shake',
  'create zoom effect',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp'];
