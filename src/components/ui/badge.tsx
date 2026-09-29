'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'indigo' | 'cyan' | 'purple' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<string, string> = {
  default: 'bg-white/5 text-slate-300 border-white/10',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  outline: 'bg-transparent text-slate-300 border-slate-700',
};

const dotColors: Record<string, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  info: 'bg-sky-400',
  indigo: 'bg-indigo-400',
  cyan: 'bg-cyan-400',
  purple: 'bg-purple-400',
  outline: 'bg-slate-400',
};

const sizeStyles: Record<string, string> = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({
  variant = 'default',
  size = 'sm',
  icon,
  children,
  className,
  dot,
  pulse,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant], pulse && 'animate-pulse')} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
