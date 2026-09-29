'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const variants = {
    text: 'h-4 w-full rounded-lg',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={cn('skeleton', variants[variant], className)}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)] space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton variant="rectangular" className="h-8 w-8" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr>
      <td className="py-3.5 px-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </td>
      <td className="py-3.5 px-4">
        <Skeleton className="h-3 w-48" />
      </td>
      <td className="py-3.5 px-4 text-center">
        <Skeleton className="h-5 w-16 mx-auto" />
      </td>
      <td className="py-3.5 px-4 text-center">
        <Skeleton className="h-4 w-12 mx-auto" />
      </td>
      <td className="py-3.5 px-4">
        <div className="flex justify-end gap-1.5">
          <Skeleton variant="rectangular" className="h-7 w-7" />
          <Skeleton variant="rectangular" className="h-7 w-7" />
          <Skeleton variant="rectangular" className="h-7 w-7" />
        </div>
      </td>
    </tr>
  );
}

export function SkeletonLinkCard() {
  return (
    <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)] space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-48" />
      <Skeleton className="h-3 w-64" />
      <div className="flex gap-2 pt-1">
        <Skeleton variant="rectangular" className="h-8 w-20" />
        <Skeleton variant="rectangular" className="h-8 w-8" />
        <Skeleton variant="rectangular" className="h-8 w-8" />
      </div>
    </div>
  );
}
