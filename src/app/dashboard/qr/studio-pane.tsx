import React from 'react';
import { Minus, Plus } from 'lucide-react';

/** Collapsible section of the QR studio. */
export default function StudioPane({
  icon,
  iconClass,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900/90 text-left transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg border ${iconClass}`}>{icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-[11px] text-zinc-400">{subtitle}</p>
          </div>
        </div>
        <div className="text-zinc-400">{open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</div>
      </button>
      {open && <div className="p-5 border-t border-zinc-800 space-y-5">{children}</div>}
    </div>
  );
}
