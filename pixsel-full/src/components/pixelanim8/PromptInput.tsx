'use client';

import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { SUGGESTED_PROMPTS } from '@/lib/types';

export function PromptInput() {
  const { prompt, setPrompt } = useAppStore();
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const maxChars = 200;
  const charCount = prompt.length;

  return (
    <div className="space-y-3">
      <label 
        className="block font-[family-name:Press_Start_2P,cursive] text-xs uppercase tracking-wider"
        style={{ color: 'var(--nes-light-gray)' }}
      >
        Animation Prompt
      </label>
      
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, maxChars))}
          placeholder="Describe the animation… (e.g., 'make it pulse', 'add rainbow colors')"
          className="w-full min-h-[100px] p-4 border-2 resize-none font-[family-name:VT323,monospace] text-lg focus:outline-none transition-colors"
          style={{ 
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
            boxShadow: 'inset 2px 2px 0 0 rgba(0,0,0,0.3), inset -2px -2px 0 0 rgba(255,255,255,0.1)',
          }}
        />
        
        <div 
          className="absolute bottom-2 right-2 font-mono text-xs tabular-nums"
          style={{ color: charCount >= maxChars ? 'var(--destructive)' : 'var(--muted-foreground)' }}
        >
          {charCount}/{maxChars}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="flex items-center gap-2 px-3 py-1.5 border font-[family-name:VT323,monospace] text-sm transition-colors"
          style={{ 
            color: 'var(--accent)',
            borderColor: 'var(--border)',
          }}
        >
          <Lightbulb className="w-4 h-4" />
          Suggestions
        </button>
        
        {prompt && (
          <button
            onClick={() => setPrompt('')}
            className="flex items-center gap-1 px-3 py-1.5 border font-[family-name:VT323,monospace] text-sm transition-colors"
            style={{ 
              color: 'var(--muted-foreground)',
              borderColor: 'var(--border)',
            }}
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
      
      {showSuggestions && (
        <div 
          className="border-2 p-3 space-y-2"
          style={{ 
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)',
          }}
        >
          <p 
            className="font-[family-name:Press_Start_2P,cursive] text-xs uppercase"
            style={{ color: 'var(--primary)' }}
          >
            Try these:
          </p>
          
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setPrompt(suggestion);
                  setShowSuggestions(false);
                }}
                className="px-3 py-1.5 border font-[family-name:VT323,monospace] text-sm transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  borderColor: 'var(--border)',
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
