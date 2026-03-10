'use client';

import { Zap, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface GenerateButtonProps {
  onGenerate: () => Promise<void>;
}

export function GenerateButton({ onGenerate }: GenerateButtonProps) {
  const { uploadedImage, prompt, isGenerating, error } = useAppStore();
  
  const isDisabled = !uploadedImage || !prompt.trim() || isGenerating;

  return (
    <div className="space-y-3">
      <button
        onClick={onGenerate}
        disabled={isDisabled}
        className="pixel-btn w-full flex items-center justify-center gap-3"
      >
        <Zap className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
        {isGenerating ? 'GENERATING...' : 'GENERATE 8-BIT GIF'}
      </button>
      
      {error && (
        <div 
          className="flex items-center gap-2 p-3 border-2"
          style={{ backgroundColor: 'rgba(255,77,77,0.1)', borderColor: 'var(--destructive)' }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--destructive)' }} />
          <p 
            className="font-[family-name:VT323,monospace] text-sm"
            style={{ color: 'var(--destructive)' }}
          >
            {error}
          </p>
        </div>
      )}
      
      {!uploadedImage && (
        <p 
          className="text-center font-[family-name:VT323,monospace] text-base"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Upload an image to get started
        </p>
      )}
      
      {uploadedImage && !prompt.trim() && (
        <p 
          className="text-center font-[family-name:VT323,monospace] text-base"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Describe your animation above
        </p>
      )}
    </div>
  );
}
