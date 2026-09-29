'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, Check, RefreshCw } from 'lucide-react';

interface QrCanvasProps {
  url: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  centerLogo?: 'none' | 'telegram' | 'instagram' | 'youtube' | 'globe';
  frameText?: string;
  frameStyle?: 'bottom' | 'top' | 'badge' | 'none';
  showControls?: boolean;
}

export function QrCanvas({
  url,
  size = 280,
  fgColor = '#0f172a',
  bgColor = '#ffffff',
  centerLogo = 'none',
  frameText = 'SCAN ME',
  frameStyle = 'bottom',
  showControls = true,
}: QrCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const qrSize = frameStyle !== 'none' ? size - 48 : size;
    const padding = 16;
    const canvasWidth = size;
    const canvasHeight = frameStyle !== 'none' ? size + 36 : size;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Background
    ctx.fillStyle = bgColor;
    ctx.roundRect ? ctx.roundRect(0, 0, canvasWidth, canvasHeight, 16) : ctx.rect(0, 0, canvasWidth, canvasHeight);
    ctx.fill();

    // Generate temp QR onto offscreen canvas
    const tempCanvas = document.createElement('canvas');
    QRCode.toCanvas(tempCanvas, url || 'https://urls.uz', {
      width: qrSize - padding * 2,
      margin: 1,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: 'H', // High error correction to allow center logo
    }, (err) => {
      if (err) {
        console.error('QR generation error:', err);
        return;
      }

      const qrX = (canvasWidth - tempCanvas.width) / 2;
      const qrY = frameStyle === 'top' ? 44 : padding;

      // Draw QR code onto main canvas
      ctx.drawImage(tempCanvas, qrX, qrY);

      // Draw Center Logo if enabled
      if (centerLogo !== 'none') {
        const logoSize = Math.floor(tempCanvas.width * 0.22);
        const logoX = qrX + (tempCanvas.width - logoSize) / 2;
        const logoY = qrY + (tempCanvas.height - logoSize) / 2;

        // White background backing for logo
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw branded circle
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);

        if (centerLogo === 'telegram') {
          ctx.fillStyle = '#229ED9';
          ctx.fill();
          // Paper plane icon simplified
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.floor(logoSize * 0.55)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✈', logoX + logoSize / 2, logoY + logoSize / 2);
        } else if (centerLogo === 'instagram') {
          ctx.fillStyle = '#E1306C';
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.floor(logoSize * 0.55)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('📷', logoX + logoSize / 2, logoY + logoSize / 2);
        } else if (centerLogo === 'youtube') {
          ctx.fillStyle = '#FF0000';
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.floor(logoSize * 0.55)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('▶', logoX + logoSize / 2, logoY + logoSize / 2);
        } else {
          ctx.fillStyle = '#6366f1';
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.floor(logoSize * 0.55)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', logoX + logoSize / 2, logoY + logoSize / 2);
        }
      }

      // Draw Frame Text if enabled
      if (frameStyle !== 'none' && frameText) {
        ctx.fillStyle = fgColor;
        ctx.font = `bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textY = frameStyle === 'top' ? 22 : canvasHeight - 20;
        ctx.fillText(frameText.toUpperCase(), canvasWidth / 2, textY);
      }
    });
  }, [url, size, fgColor, bgColor, centerLogo, frameText, frameStyle]);

  const handleDownload = (format: 'png' | 'svg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `urls-uz-qr-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
        <canvas ref={canvasRef} className="rounded-xl shadow-lg" />
      </div>

      {showControls && (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleDownload('png')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-white/10"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Nusxalandi' : 'Ulashish'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
