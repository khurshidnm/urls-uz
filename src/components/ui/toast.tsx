'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, X, AlertCircle, Info, Copy } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'copied';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  isExiting?: boolean;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto-dismiss after 3s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 250);
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <Check className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
    copied: <Copy className="w-4 h-4" />,
  };

  const colors: Record<ToastType, string> = {
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    error: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    info: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
    copied: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
  };

  const iconBg: Record<ToastType, string> = {
    success: 'bg-emerald-500/20 text-emerald-400',
    error: 'bg-rose-500/20 text-rose-400',
    info: 'bg-indigo-500/20 text-indigo-400',
    copied: 'bg-indigo-500/20 text-indigo-400',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg max-w-sm ${
              colors[toast.type]
            } ${
              toast.isExiting ? 'animate-toast-out' : 'animate-toast-in'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBg[toast.type]}`}>
              {icons[toast.type]}
            </div>
            <span className="text-xs font-medium text-white flex-1">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
