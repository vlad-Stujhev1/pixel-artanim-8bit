import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GenerationParams, HistoryItem, GenerationMetadata } from './types';

interface AppState {
  uploadedImage: string | null;
  uploadedImageName: string | null;
  prompt: string;
  params: GenerationParams;
  isGenerating: boolean;
  progress: number;
  generatedGif: string | null;
  resultMetadata: GenerationMetadata | null;
  error: string | null;
  history: HistoryItem[];
  
  setUploadedImage: (image: string | null, name?: string) => void;
  setPrompt: (prompt: string) => void;
  setParams: (params: Partial<GenerationParams>) => void;
  startGeneration: () => void;
  setProgress: (progress: number) => void;
  setGenerationResult: (gif: string, metadata: GenerationMetadata) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  addToHistory: (item: HistoryItem) => void;
  removeFromHistory: (id: string) => void;
  loadFromHistory: (item: HistoryItem) => void;
}

const defaultParams: GenerationParams = {
  palette: 'nes',
  frames: 4,
  delay: 5,
  size: '256',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      uploadedImage: null,
      uploadedImageName: null,
      prompt: '',
      params: defaultParams,
      isGenerating: false,
      progress: 0,
      generatedGif: null,
      resultMetadata: null,
      error: null,
      history: [],
      
      setUploadedImage: (image, name) => set({ 
        uploadedImage: image, 
        uploadedImageName: name || null,
        generatedGif: null,
        resultMetadata: null,
        error: null,
      }),
      
      setPrompt: (prompt) => set({ prompt }),
      
      setParams: (newParams) => set((state) => ({
        params: { ...state.params, ...newParams },
      })),
      
      startGeneration: () => set({
        isGenerating: true,
        progress: 0,
        generatedGif: null,
        resultMetadata: null,
        error: null,
      }),
      
      setProgress: (progress) => set({ progress }),
      
      setGenerationResult: (gif, metadata) => set({
        isGenerating: false,
        progress: 100,
        generatedGif: gif,
        resultMetadata: metadata,
        error: null,
      }),
      
      setError: (error) => set({
        isGenerating: false,
        progress: 0,
        error,
      }),
      
      reset: () => set({
        uploadedImage: null,
        uploadedImageName: null,
        prompt: '',
        params: defaultParams,
        isGenerating: false,
        progress: 0,
        generatedGif: null,
        resultMetadata: null,
        error: null,
      }),
      
      addToHistory: (item) => set((state) => ({
        history: [item, ...state.history].slice(0, 5),
      })),
      
      removeFromHistory: (id) => set((state) => ({
        history: state.history.filter((item) => item.id !== id),
      })),
      
      loadFromHistory: (item) => set({
        uploadedImage: item.thumbnail,
        uploadedImageName: 'from-history.png',
        prompt: item.prompt,
        params: item.params,
        generatedGif: item.gifData,
        resultMetadata: item.metadata,
        error: null,
      }),
    }),
    {
      name: 'pixelanim8-storage',
      partialize: (state) => ({
        history: state.history,
        params: state.params,
      }),
    }
  )
);
