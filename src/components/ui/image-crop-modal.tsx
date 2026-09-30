'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  RefreshCw,
  FlipHorizontal,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string, fileSizeKb: number) => void;
  maxSizeKb?: number; // Default 100 KB
}

export function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  maxSizeKb = 100,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Viewport sizes
  const VIEW_SIZE = 280; // Size of outer container
  const APERTURE_SIZE = 220; // Diameter of circular crop aperture

  // Reset transforms when new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Load natural dimensions of the image
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth || 400, height: img.naturalHeight || 400 });
  };

  // Base display dimension so image fills aperture nicely
  const nw = naturalSize.width || 400;
  const nh = naturalSize.height || 400;
  const minDim = Math.min(nw, nh);
  const baseScale = minDim > 0 ? APERTURE_SIZE / minDim : 1;
  const displayW = nw * baseScale;
  const displayH = nh * baseScale;

  // Drag Handlers (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch Handlers (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Rotate by 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Apply Crop and enforce strict <= 100 KB limit
  const handleApplyCrop = async () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    try {
      // 1. Create Target Canvas (400x400 for crisp high-DPI avatar)
      const targetDim = 400;
      const canvas = document.createElement('canvas');
      canvas.width = targetDim;
      canvas.height = targetDim;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Exact ratio from visual aperture to target canvas
      const canvasScale = targetDim / APERTURE_SIZE;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Center of canvas
      ctx.translate(targetDim / 2, targetDim / 2);

      // 2. Pan in canvas coordinates
      ctx.translate(pan.x * canvasScale, pan.y * canvasScale);

      // 3. Rotate around center
      ctx.rotate((rotation * Math.PI) / 180);

      // 4. Zoom
      ctx.scale(zoom, zoom);

      // 5. Draw image centered
      const drawW = displayW * canvasScale;
      const drawH = displayH * canvasScale;
      ctx.drawImage(imageRef.current, -drawW / 2, -drawH / 2, drawW, drawH);

      // 2. Compress image strictly under maxSizeKb (100 KB = 102,400 bytes)
      const MAX_BYTES = maxSizeKb * 1024;
      let quality = 0.88;
      let mimeType = 'image/webp';
      let dataUrl = canvas.toDataURL(mimeType, quality);

      const getByteSize = (url: string) => {
        const base64Data = url.split(',')[1] || '';
        return Math.round((base64Data.length * 3) / 4);
      };

      let currentBytes = getByteSize(dataUrl);

      // If browser doesn't output webp, fallback to jpeg
      if (!dataUrl.startsWith('data:image/webp')) {
        mimeType = 'image/jpeg';
        dataUrl = canvas.toDataURL(mimeType, quality);
        currentBytes = getByteSize(dataUrl);
      }

      // Step-down quality loop to strictly respect 100 KB limit
      while (currentBytes > MAX_BYTES && quality > 0.25) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL(mimeType, quality);
        currentBytes = getByteSize(dataUrl);
      }

      // If still above 100 KB, resize canvas to 320x320 and re-compress
      if (currentBytes > MAX_BYTES) {
        let currentDim = 320;
        const resizedCanvas = document.createElement('canvas');
        resizedCanvas.width = currentDim;
        resizedCanvas.height = currentDim;
        const rCtx = resizedCanvas.getContext('2d');
        if (rCtx) {
          rCtx.imageSmoothingEnabled = true;
          rCtx.imageSmoothingQuality = 'high';
          rCtx.drawImage(canvas, 0, 0, currentDim, currentDim);
          quality = 0.75;
          dataUrl = resizedCanvas.toDataURL(mimeType, quality);
          currentBytes = getByteSize(dataUrl);

          while (currentBytes > MAX_BYTES && quality > 0.2) {
            quality -= 0.08;
            dataUrl = resizedCanvas.toDataURL(mimeType, quality);
            currentBytes = getByteSize(dataUrl);
          }
        }
      }

      const finalKb = Math.max(1, Math.round(currentBytes / 1024));
      onCropComplete(dataUrl, finalKb);
      onClose();
    } catch (err) {
      console.error('Crop error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-4 px-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Rasmni Qirqish & Sozlash
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Avtomatik siqish: &lt; 100 KB
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Canvas / Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-zinc-950">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative w-[280px] h-[280px] rounded-2xl bg-zinc-900 overflow-hidden border-2 border-zinc-800 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* The Image being transformed */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={handleImageLoad}
                className="max-w-none pointer-events-none select-none"
                style={{
                  width: `${displayW}px`,
                  height: `${displayH}px`,
                }}
              />
            </div>

            {/* Circular Mask Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Darkened outer frame with clear circular aperture */}
              <div className="w-[220px] h-[220px] rounded-full border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] ring-1 ring-black/40" />
            </div>

            {/* Guide hint */}
            <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
              <span className="text-[10px] font-mono text-white/80 bg-black/75 px-2.5 py-1 rounded-full border border-white/10">
                Surish uchun torting
              </span>
            </div>
          </div>

          {/* Controls: Zoom & Rotate */}
          <div className="w-[280px] mt-4 space-y-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3 bg-zinc-900/70 p-2 px-3 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
                className="text-zinc-400 hover:text-white"
              >
                <ZoomOut className="w-3.5 h-3.5 shrink-0" />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3, prev + 0.1))}
                className="text-zinc-400 hover:text-white"
              >
                <ZoomIn className="w-3.5 h-3.5 shrink-0" />
              </button>
              <span className="text-[10px] font-mono text-zinc-400 w-8 text-right">
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Rotation and Reset Actions */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>90° Burish</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setPan({ x: 0, y: 0 });
                }}
                className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tiklash</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-5 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <Check className="w-3.5 h-3.5" />
            <span>&le; 100 KB avto-siqish</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Bekor qilish
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <span>Qirqilmoqda...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Qirqish va Saqlash</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
