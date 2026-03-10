'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Palette, Layers, Clock, Maximize } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PALETTE_INFO, type ColorPalette, type OutputSize } from '@/lib/types';

export function ParametersPanel() {
  const { params, setParams } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="border-2 overflow-hidden"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 transition-colors hover:brightness-110"
        style={{ backgroundColor: 'var(--secondary)' }}
      >
        <span 
          className="font-[family-name:Press_Start_2P,cursive] text-xs uppercase tracking-wider"
          style={{ color: 'var(--nes-light-gray)' }}
        >
          Parameters
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
        )}
      </button>
      
      {/* Collapsed quick view */}
      {!isExpanded && (
        <div className="flex flex-wrap gap-2 p-4 pt-3">
          <span 
            className="px-2 py-1 font-mono text-xs"
            style={{ backgroundColor: 'var(--secondary)', color: 'var(--muted-foreground)' }}
          >
            {PALETTE_INFO[params.palette]?.name}
          </span>
          <span 
            className="px-2 py-1 font-mono text-xs tabular-nums"
            style={{ backgroundColor: 'var(--secondary)', color: 'var(--muted-foreground)' }}
          >
            {params.frames} frames
          </span>
          <span 
            className="px-2 py-1 font-mono text-xs tabular-nums"
            style={{ backgroundColor: 'var(--secondary)', color: 'var(--muted-foreground)' }}
          >
            {params.delay} FPS
          </span>
          <span 
            className="px-2 py-1 font-mono text-xs tabular-nums"
            style={{ backgroundColor: 'var(--secondary)', color: 'var(--muted-foreground)' }}
          >
            {params.size}×{params.size}
          </span>
        </div>
      )}
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Color Palette */}
          <div className="space-y-2">
            <label 
              className="flex items-center gap-2 font-[family-name:VT323,monospace] text-base"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Palette className="w-4 h-4" />
              Color Palette
            </label>
            <select
              value={params.palette}
              onChange={(e) => setParams({ palette: e.target.value as ColorPalette })}
              className="w-full p-2 border-2 font-[family-name:VT323,monospace] text-base focus:outline-none"
              style={{ 
                backgroundColor: 'var(--secondary)', 
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
            >
              {Object.entries(PALETTE_INFO).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
            
            {/* Palette preview */}
            <div className="flex gap-1">
              {PALETTE_INFO[params.palette]?.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 border"
                  style={{ backgroundColor: color, borderColor: 'var(--border)' }}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          {/* Frame Count */}
          <div className="space-y-2">
            <label 
              className="flex items-center gap-2 font-[family-name:VT323,monospace] text-base"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Layers className="w-4 h-4" />
              Frames: <span style={{ color: 'var(--primary)' }}>{params.frames}</span>
            </label>
            <input
              type="range"
              min="2"
              max="8"
              value={params.frames}
              onChange={(e) => setParams({ frames: parseInt(e.target.value) })}
              className="w-full h-2 cursor-pointer accent-[var(--primary)]"
            />
            <div className="flex justify-between font-mono text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              <span>2</span>
              <span>8</span>
            </div>
          </div>
          
          {/* Frame Delay */}
          <div className="space-y-2">
            <label 
              className="flex items-center gap-2 font-[family-name:VT323,monospace] text-base"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Clock className="w-4 h-4" />
              Speed: <span style={{ color: 'var(--primary)' }}>{params.delay} FPS</span>
            </label>
            <input
              type="range"
              min="2"
              max="15"
              value={params.delay}
              onChange={(e) => setParams({ delay: parseInt(e.target.value) })}
              className="w-full h-2 cursor-pointer accent-[var(--primary)]"
            />
            <div className="flex justify-between font-mono text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              <span>2 FPS</span>
              <span>15 FPS</span>
            </div>
          </div>
          
          {/* Output Size */}
          <div className="space-y-2">
            <label 
              className="flex items-center gap-2 font-[family-name:VT323,monospace] text-base"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Maximize className="w-4 h-4" />
              Output Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['128', '256', '512'] as OutputSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setParams({ size })}
                  className={`py-2 font-mono text-sm border-2 transition-all tabular-nums ${
                    params.size === size ? 'border-[var(--primary)]' : 'border-[var(--border)]'
                  }`}
                  style={{ 
                    backgroundColor: params.size === size ? 'var(--primary)' : 'var(--secondary)',
                    color: params.size === size ? 'var(--primary-foreground)' : 'var(--foreground)',
                  }}
                >
                  {size}×{size}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
