'use client';

import { Github, Heart, ExternalLink } from 'lucide-react';
import { ImageUpload } from '@/components/pixelanim8/ImageUpload';
import { PromptInput } from '@/components/pixelanim8/PromptInput';
import { ParametersPanel } from '@/components/pixelanim8/ParametersPanel';
import { ResultDisplay } from '@/components/pixelanim8/ResultDisplay';
import { HistoryGallery } from '@/components/pixelanim8/HistoryGallery';
import { GenerateButton } from '@/components/pixelanim8/GenerateButton';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const { 
    uploadedImage, 
    prompt, 
    params, 
    startGeneration, 
    setProgress, 
    setGenerationResult, 
    setError, 
    addToHistory 
  } = useAppStore();

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

  return (
    <div className="min-h-screen flex flex-col pixel-grid-bg">
      {/* Header */}
      <header 
        className="border-b-2"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 
              className="font-[family-name:Press_Start_2P,cursive] text-base sm:text-lg"
              style={{ color: 'var(--primary)' }}
            >
              PIXELANIM8
            </h1>
            <span 
              className="hidden sm:block font-[family-name:VT323,monospace] text-lg"
              style={{ color: 'var(--muted-foreground)' }}
            >
              8-bit GIF Generator
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="flex items-center gap-2 px-3 py-2 border font-[family-name:VT323,monospace] text-sm transition-colors"
              style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">API</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-3 py-2 border font-[family-name:VT323,monospace] text-sm transition-colors"
              style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left column: Input controls */}
          <div className="space-y-5">
            <ImageUpload />
            <PromptInput />
            <ParametersPanel />
            <GenerateButton onGenerate={handleGenerate} />
          </div>

          {/* Right column: Result and history */}
          <div className="space-y-5">
            <ResultDisplay />
            <HistoryGallery />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="border-t-2 mt-auto"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div 
            className="flex items-center gap-2 font-[family-name:VT323,monospace] text-base"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <span>Made with</span>
            <Heart className="w-4 h-4" style={{ color: 'var(--destructive)' }} />
            <span>for retro gaming fans</span>
          </div>
          
          <div 
            className="flex items-center gap-4 font-[family-name:VT323,monospace] text-base"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <span>© 2024 PixelAnim8</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
