'use client';

import { useState } from 'react';
import { Download, RefreshCw, Copy, Check, Gamepad2, HardDrive, Palette, Layers } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function ResultDisplay() {
  const { 
    generatedGif, 
    resultMetadata, 
    isGenerating, 
    progress,
    params,
    prompt,
    uploadedImage,
    startGeneration,
    setProgress,
    setGenerationResult,
    setError,
    addToHistory,
  } = useAppStore();
  
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleGenerate = async () => {
    if (!uploadedImage || !prompt.trim()) return;
    
    startGeneration();
    
    const progressInterval = setInterval(() => {
      const currentProgress = useAppStore.getState().progress;
      setProgress(Math.min(90, currentProgress + 10));
    }, 500);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          prompt: prompt.trim(),
          params,
        }),
      });
      
      clearInterval(progressInterval);
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }
      
      setProgress(100);
      setGenerationResult(data.gifData, data.metadata);
      
      addToHistory({
        id: Date.now().toString(),
        thumbnail: uploadedImage,
        prompt: prompt.trim(),
        params,
        gifData: data.gifData,
        createdAt: Date.now(),
        metadata: data.metadata,
      });
    } catch (error) {
      clearInterval(progressInterval);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await handleGenerate();
    setIsRegenerating(false);
  };

  const handleDownload = () => {
    if (!generatedGif) return;
    
    const link = document.createElement('a');
    link.href = generatedGif;
    link.download = `pixelanim8-${Date.now()}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    if (!generatedGif) return;
    
    try {
      const response = await fetch(generatedGif);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/gif': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(generatedGif);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <label 
        className="block font-[family-name:Press_Start_2P,cursive] text-xs uppercase tracking-wider"
        style={{ color: 'var(--nes-light-gray)' }}
      >
        Generated GIF
      </label>
      
      {/* Monitor frame */}
      <div className="monitor-frame">
        <div className="monitor-screen p-2 min-h-[280px] flex items-center justify-center">
          {isGenerating ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="pixel-loading">
                  <Gamepad2 className="w-16 h-16" style={{ color: 'var(--primary)' }} />
                </div>
              </div>
              
              <div className="w-48 mx-auto">
                <div 
                  className="h-4 border-2 relative overflow-hidden"
                  style={{ backgroundColor: 'var(--nes-dark-blue)', borderColor: 'var(--border)' }}
                >
                  <div 
                    className="absolute inset-y-0 left-0 transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: 'var(--primary)' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--foreground)' }}>
                      {progress}%
                    </span>
                  </div>
                </div>
                <p 
                  className="font-[family-name:VT323,monospace] text-sm mt-2"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Generating...
                </p>
              </div>
            </div>
          ) : generatedGif ? (
            <div className="relative group w-full">
              <img
                src={generatedGif}
                alt="Generated 8-bit GIF"
                className="w-full h-auto max-h-[400px] object-contain pixel-icon"
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="p-3 transition-all hover:scale-110"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  title="Download GIF"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-3 transition-all hover:scale-110"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="p-3 transition-all hover:scale-110 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
                  title="Regenerate"
                >
                  <RefreshCw className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 py-8">
              <Gamepad2 className="w-16 h-16 mx-auto" style={{ color: 'var(--muted-foreground)' }} />
              <div>
                <p 
                  className="font-[family-name:Press_Start_2P,cursive] text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  NO GIF YET
                </p>
                <p 
                  className="font-[family-name:VT323,monospace] text-base mt-1"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Upload an image and describe the animation!
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Monitor controls */}
        <div className="flex justify-between items-center mt-2 px-2">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--retro-success)' }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
          </div>
          <div className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
            PIXELANIM8
          </div>
        </div>
      </div>
      
      {/* Metadata */}
      {resultMetadata && (
        <div 
          className="border-2 p-4"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Frames</p>
                <p className="font-mono text-sm tabular-nums">{resultMetadata.frameCount}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Palette</p>
                <p className="font-[family-name:VT323,monospace] text-sm">{resultMetadata.palette}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>File Size</p>
                <p className="font-mono text-sm tabular-nums">{formatFileSize(resultMetadata.fileSize)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Dimensions</p>
                <p className="font-mono text-sm tabular-nums">
                  {resultMetadata.dimensions.width}×{resultMetadata.dimensions.height}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      {generatedGif && (
        <div className="flex gap-3">
          <button onClick={handleDownload} className="flex-1 pixel-btn flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download
          </button>
          <button 
            onClick={handleRegenerate} 
            disabled={isRegenerating} 
            className="flex-1 pixel-btn flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
