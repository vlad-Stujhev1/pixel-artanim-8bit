'use client';

import { Clock, Trash2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function HistoryGallery() {
  const { history, loadFromHistory, removeFromHistory } = useAppStore();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  if (history.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
        <label 
          className="font-[family-name:Press_Start_2P,cursive] text-xs uppercase tracking-wider"
          style={{ color: 'var(--nes-light-gray)' }}
        >
          History
        </label>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="group relative border-2 cursor-pointer transition-all hover:border-[var(--primary)] overflow-hidden"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div onClick={() => loadFromHistory(item)} className="aspect-square relative">
              <img
                src={item.gifData}
                alt={item.prompt}
                className="w-full h-full object-cover pixel-icon"
              />
              
              {/* Hover overlay */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
              >
                <Sparkles className="w-4 h-4 mb-1" style={{ color: 'var(--primary)' }} />
                <p 
                  className="font-[family-name:VT323,monospace] text-xs line-clamp-2"
                  style={{ color: 'var(--foreground)' }}
                >
                  {item.prompt}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span 
                    className="px-1 text-xs font-mono tabular-nums"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  >
                    {item.metadata.frameCount}f
                  </span>
                </div>
              </div>
            </div>
            
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFromHistory(item.id);
              }}
              className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'var(--destructive)', color: 'white' }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
            
            {/* Time badge */}
            <div 
              className="absolute bottom-1 left-1 px-1 font-mono text-xs"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'var(--muted-foreground)' }}
            >
              {formatTime(item.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
