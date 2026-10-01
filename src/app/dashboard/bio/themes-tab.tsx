'use client';

import React from 'react';
import { Check, Lock } from 'lucide-react';
import { THEMES } from './bio-builder-constants';
import type { BioBuilder } from './use-bio-builder';

/** Page theme picker (Pro themes are locked). */
export default function ThemesTab({ b }: { b: BioBuilder }) {
  const { theme, handleThemeSelect } = b;
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
            Dizayn Mavzulari
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Bepul versiyada 3 ta asosiy mavzu ochiq. Kengaytirilgan mavzular Pro tarifda tez kunda chiqadi.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((th) => {
            const isSelected = theme === th.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => handleThemeSelect(th)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 ${
                  isSelected
                    ? 'bg-zinc-850 border-white shadow-md ring-1 ring-white'
                    : th.pro
                    ? 'bg-zinc-950/40 border-zinc-850 opacity-75 hover:opacity-100 hover:border-zinc-700'
                    : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white">{th.name}</span>
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : th.pro ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                      <Lock className="w-2.5 h-2.5" /> PRO
                    </span>
                  ) : null}
                </div>

                {/* Swatches preview */}
                <div className="flex items-center gap-1.5 mt-2">
                  {th.swatches.map((sw, i) => (
                    <span
                      key={i}
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: sw }}
                    />
                  ))}
                  <span className="text-[10px] font-mono text-zinc-500 ml-auto">
                    {th.pro ? 'Tez kunda' : 'Faol'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
