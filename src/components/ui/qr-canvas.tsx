'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

interface QrCanvasProps {
  url?: string;
  value?: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  centerLogo?: 'none' | 'telegram' | 'instagram' | 'youtube' | 'globe';
  logo?: 'none' | 'telegram' | 'instagram' | 'youtube' | 'globe';
  frameText?: string;
  frameStyle?: 'bottom' | 'top' | 'badge' | 'none';
  showControls?: boolean;
  errorLevel?: 'L' | 'M' | 'Q' | 'H';
}

// Authentic, high-precision official SVG brand assets
const BRAND_SVGS = {
  telegram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="50" fill="#229ED9"/>
    <path fill="#ffffff" d="M22 48.5c15.2-6.6 25.4-11 30.5-13.1 14.5-6 17.5-7.1 19.5-7.1 0.4 0 1.4 0.1 2 0.7 0.5 0.5 0.7 1.2 0.7 1.7 0 0.7-0.1 1.9-0.4 3.7l-7.3 34.3c-0.5 2.2-1.8 2.8-3.7 1.7l-11.2-8.3-5.4 5.2c-0.6 0.6-1.1 1.1-2.3 1.1l0.8-11.4 20.7-18.7c0.9-0.8-0.2-1.3-1.4-0.5l-25.6 16.1-11-3.4c-2.4-0.7-2.4-2.4 0.5-3.5z"/>
  </svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fdf497"/>
        <stop offset="25%" stop-color="#fd5949"/>
        <stop offset="50%" stop-color="#d6249f"/>
        <stop offset="100%" stop-color="#285AEB"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="100" height="100" rx="26" fill="url(#igGrad)"/>
    <rect x="18" y="18" width="64" height="64" rx="18" fill="none" stroke="#ffffff" stroke-width="7"/>
    <circle cx="50" cy="50" r="16" fill="none" stroke="#ffffff" stroke-width="7"/>
    <circle cx="67" cy="33" r="4.5" fill="#ffffff"/>
  </svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect x="4" y="16" width="92" height="68" rx="22" fill="#FF0000"/>
    <polygon points="40,32 70,50 40,68" fill="#ffffff"/>
  </svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="50" fill="#4f46e5"/>
    <circle cx="50" cy="50" r="32" fill="none" stroke="#ffffff" stroke-width="6"/>
    <ellipse cx="50" cy="50" rx="16" ry="32" fill="none" stroke="#ffffff" stroke-width="6"/>
    <line x1="18" y1="50" x2="82" y2="50" stroke="#ffffff" stroke-width="6"/>
  </svg>`,
};

export function QrCanvas({
  url,
  value,
  size = 280,
  fgColor = '#09090b',
  bgColor = '#ffffff',
  centerLogo,
  logo = 'none',
  frameText = 'SCAN ME',
  frameStyle = 'bottom',
  showControls = true,
  errorLevel = 'H',
}: QrCanvasProps) {
  const finalUrl = url || value || 'https://urls.uz';
  const finalLogo = centerLogo || logo || 'none';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina High-DPI Scaling for crystal-clear render
    const dpr = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 2, 2) : 2;
    const canvasWidth = size;
    const canvasHeight = frameStyle !== 'none' && frameText ? size + 44 : size;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Rounded background card
    ctx.fillStyle = bgColor;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(0, 0, canvasWidth, canvasHeight, 20);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    const padding = 16;
    const qrInnerSize = canvasWidth - padding * 2;
    const qrX = padding;
    const qrY = frameStyle === 'top' && frameText ? 44 : padding;

    // Offscreen canvas at High-DPI for razor-sharp QR modules
    const tempCanvas = document.createElement('canvas');
    QRCode.toCanvas(
      tempCanvas,
      finalUrl,
      {
        width: qrInnerSize * dpr,
        margin: 1,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorLevel, // configurable error correction
      },
      (err) => {
        if (err || isCancelled) return;

        // Draw crisp QR code onto main canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(tempCanvas, qrX, qrY, qrInnerSize, qrInnerSize);

        // Draw Frame Text (Call to Action)
        if (frameStyle !== 'none' && frameText) {
          ctx.fillStyle = fgColor;
          ctx.font = `800 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const textY = frameStyle === 'top' ? 22 : canvasHeight - 20;

          // Draw subtle stylish letter-spaced text
          const upperText = frameText.toUpperCase();
          ctx.letterSpacing = '1.5px';
          ctx.fillText(upperText, canvasWidth / 2, textY);
          ctx.letterSpacing = '0px';
        }

        // Draw Center Logo with official vector SVG
        if (finalLogo !== 'none' && BRAND_SVGS[finalLogo]) {
          const logoSize = Math.floor(qrInnerSize * 0.24);
          const logoX = qrX + (qrInnerSize - logoSize) / 2;
          const logoY = qrY + (qrInnerSize - logoSize) / 2;

          // White protective background with subtle shadow
          ctx.save();
          ctx.fillStyle = bgColor;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 2;
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Render Real Official SVG Vector to Canvas
          const svgStr = BRAND_SVGS[finalLogo];
          const img = new Image();
          img.onload = () => {
            if (isCancelled) return;
            ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
            ctx.restore();
          };
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
        } else {
          ctx.restore();
        }
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [finalUrl, size, fgColor, bgColor, finalLogo, frameText, frameStyle, errorLevel]);

  // High-Resolution Export Handlers
  const handleDownload = async (format: 'png' | 'svg' | 'pdf') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `urls-uz-qr-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } else if (format === 'svg') {
      try {
        QRCode.toString(
          finalUrl,
          {
            type: 'svg',
            color: { dark: fgColor, light: bgColor },
            errorCorrectionLevel: errorLevel,
            margin: 1,
          },
          (err, svgString) => {
            if (!err && svgString) {
              let finalSvg = svgString;

              // Embed Center Logo vector directly in the SVG file
              if (finalLogo !== 'none' && BRAND_SVGS[finalLogo]) {
                const logoSvg = BRAND_SVGS[finalLogo];
                const insertIndex = finalSvg.lastIndexOf('</svg>');
                if (insertIndex !== -1) {
                  const logoLayer = `
                    <g transform="translate(38, 38) scale(0.24)">
                      <circle cx="50" cy="50" r="56" fill="${bgColor}"/>
                      ${logoSvg.replace(/<svg[^>]*>|<\/svg>/g, '')}
                    </g>
                  `;
                  finalSvg = finalSvg.slice(0, insertIndex) + logoLayer + finalSvg.slice(insertIndex);
                }
              }

              const blob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `urls-uz-qr-vector-${Date.now()}.svg`;
              link.click();
            }
          }
        );
      } catch {}
    } else if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>urls.uz QR Code Print</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #09090b; }
                .card { border: 1px solid #27272a; border-radius: 12px; padding: 32px; text-align: center; background: #121215; max-width: 380px; width: 100%; box-sizing: border-box; }
                img { width: 260px; height: auto; border-radius: 8px; }
                h2 { margin: 20px 0 6px 0; font-size: 16px; color: #f4f4f5; font-weight: 600; letter-spacing: -0.01em; }
                p { margin: 0; color: #a1a1aa; font-family: monospace; font-size: 12px; word-break: break-all; }
                .badge { display: inline-block; margin-top: 14px; padding: 4px 10px; background: #27272a; color: #f4f4f5; border-radius: 4px; font-size: 11px; font-weight: 500; font-family: monospace; }
                @media print {
                  body { background: white; }
                  .card { border: none; padding: 0; background: white; }
                  h2 { color: #000; }
                  p { color: #333; }
                }
              </style>
            </head>
            <body>
              <div class="card">
                <img src="${dataUrl}" alt="urls.uz QR Code" />
                <h2>urls.uz Engine QR</h2>
                <p>${finalUrl}</p>
                <div class="badge">SPEC // OPTICAL_REDIRECT</div>
              </div>
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (typeof window !== 'undefined' && navigator.clipboard && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            await copyToClipboard(finalUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            return;
          }
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            await copyToClipboard(finalUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        });
      } else {
        await copyToClipboard(finalUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await copyToClipboard(finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Precision Frame Container */}
      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 shadow-sm">
        <canvas ref={canvasRef} className="rounded-lg transition-transform" />
      </div>

      {showControls && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 font-mono text-xs">
          <button
            onClick={() => handleDownload('png')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-zinc-950 bg-white hover:bg-zinc-200 active:scale-95 rounded-md transition-colors"
            title="PNG formatda yuklab olish (High-Res)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
          <button
            onClick={() => handleDownload('svg')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-800 rounded-md transition-colors"
            title="Vektor SVG formatda yuklab olish"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>SVG</span>
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-800 rounded-md transition-colors"
            title="Chop etish yoki PDF"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-800 rounded-md transition-colors"
            title="Rasmni vaqtinchalik xotiraga nusxalash"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
