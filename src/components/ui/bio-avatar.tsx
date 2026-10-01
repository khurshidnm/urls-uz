import React from 'react';

/** Profile picture, or the name's initials when there is none (never a stranger's stock photo). */
export function BioAvatar({ src, name, className }: { src?: string | null; name: string; className: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- user-supplied data: URLs and arbitrary hosts
    return <img src={src} alt={name} className={className} />;
  }
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?';
  return (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold`} aria-label={name}>
      {initials}
    </div>
  );
}
