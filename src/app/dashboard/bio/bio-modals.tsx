'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ExternalLink, Check, Copy } from 'lucide-react';
import { QrCanvas } from '@/components/ui/qr-canvas';
import { Modal } from '@/components/ui/modal';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import type { BioBuilder } from './use-bio-builder';

/** QR code, Pro upsell and avatar crop dialogs. */
export default function BioModals({ b }: { b: BioBuilder }) {
  const { handle, cropModalOpen, setCropModalOpen, rawImageSrc, handleCropComplete, qrModalOpen, setQrModalOpen, copiedLink, proModalOpen, setProModalOpen, proModalText, fullBioUrl, handleCopyBioLink } = b;
  return (
    <>
      {/* QR CODE MODAL FOR BIO PAGE */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Link-in-Bio QR Kodi"
      >
        <div className="space-y-4 text-center py-2">
          <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-xl">
            <QrCanvas
              url={fullBioUrl}
              size={200}
              fgColor="#09090b"
              bgColor="#ffffff"
              bodyShape="rounded"
              eyeFrameShape="rounded"
              eyeBallShape="circle"
              showControls={false}
            />
          </div>

          <div>
            <h4 className="text-base font-bold text-white mb-1">
              urls.uz/b/{handle}
            </h4>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Smartfon kamerasi orqali skanerlab, sahifani bevosita ochish yoki chop etish uchun QR kod
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleCopyBioLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-white transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              <span>{copiedLink ? 'Nusxalandi!' : 'Havolani nusxalash'}</span>
            </button>

            <Link
              href={`/b/${handle}`}
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Sahifani ochish</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Modal>

      {/* PRO FEATURE COMING SOON MODAL */}
      <Modal
        isOpen={proModalOpen}
        onClose={() => setProModalOpen(false)}
        title="Pro Xususiyat (Tez Kunda)"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>

          <div>
            <h4 className="text-base font-bold text-white mb-1.5">
              Pullik Pro imkoniyat
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              {proModalText || 'Ushbu imkoniyat pullik Pro tarifda tez kunda taqdim etiladi.'}
            </p>
          </div>

          <button
            onClick={() => setProModalOpen(false)}
            className="w-full py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Tushundim
          </button>
        </div>
      </Modal>

      {/* IMAGE CROP & COMPRESSION MODAL (STRICTLY <= 100 KB) */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
        maxSizeKb={100}
      />
    </>
  );
}
