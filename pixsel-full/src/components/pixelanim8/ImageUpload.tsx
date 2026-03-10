'use client';

import { useCallback, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MAX_FILE_SIZE, SUPPORTED_FORMATS } from '@/lib/types';

export function ImageUpload() {
  const { uploadedImage, uploadedImageName, setUploadedImage } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      setError('Invalid format! Use PNG, JPEG, GIF, or BMP.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large! Maximum size is 5MB.');
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string, file.name);
    };
    reader.readAsDataURL(file);
  }, [validateFile, setUploadedImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setUploadedImage(null);
    setError(null);
  }, [setUploadedImage]);

  return (
    <div className="space-y-3">
      <label 
        className="block font-[family-name:'Press Start 2P',cursive] text-xs uppercase tracking-wider"
        style={{ color: 'var(--nes-light-gray)' }}
      >
        Source Image
      </label>
      
      {!uploadedImage ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed transition-all cursor-pointer
            min-h-[200px] flex flex-col items-center justify-center gap-4 p-6
            ${isDragging 
              ? 'border-[var(--primary)] bg-[var(--primary)]/10' 
              : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--card)]'
            }
          `}
          style={{ backgroundColor: 'var(--card)' }}
        >
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.bmp"
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          
          <div className={`p-4 border-2 ${isDragging ? 'border-[var(--primary)]' : 'border-[var(--border)]'}`}>
            {isDragging ? (
              <ImageIcon className="w-12 h-12 text-[var(--primary)]" />
            ) : (
              <Upload className="w-12 h-12 text-[var(--muted-foreground)]" />
            )}
          </div>
          
          <div className="text-center">
            <p className="font-[family-name:'VT323',monospace] text-lg">
              {isDragging ? 'Drop it!' : 'Drop image or click'}
            </p>
            <p className="font-[family-name:'VT323',monospace] text-sm text-[var(--muted-foreground)] mt-1">
              PNG, JPEG, GIF, BMP (max 5MB)
            </p>
          </div>
        </div>
      ) : (
        <div 
          className="relative border-2 border-[var(--border)] overflow-hidden"
          style={{ backgroundColor: 'var(--card)' }}
        >
          <img
            src={uploadedImage}
            alt="Uploaded preview"
            className="w-full h-auto max-h-[300px] object-contain pixel-icon"
          />
          
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 text-white hover:brightness-110 transition-all"
            style={{ backgroundColor: 'var(--destructive)' }}
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="font-mono text-xs text-[var(--nes-light-gray)] truncate tabular-nums">
              {uploadedImageName}
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <div 
          className="flex items-center gap-2 p-3 border"
          style={{ backgroundColor: 'rgba(255,77,77,0.1)', borderColor: 'var(--destructive)' }}
        >
          <X className="w-4 h-4 text-[var(--destructive)] flex-shrink-0" />
          <p className="font-[family-name:'VT323',monospace] text-sm text-[var(--destructive)]">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
