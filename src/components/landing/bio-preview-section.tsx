'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Lock,
  Smartphone,
  Tablet,
  Flame,
  MessageCircle,
  Briefcase,
  BarChart3,
  Palette,
  ShieldCheck,
  TrendingUp,
  Share2,
} from 'lucide-react';
import { TelegramIcon, InstagramIcon, YouTubeIcon } from '@/components/ui/icons';

// Bulletproof fallback avatar vector in case external CDN fails
const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%236366f1'/><stop offset='50%' stop-color='%23a855f7'/><stop offset='100%' stop-color='%23ec4899'/></linearGradient></defs><circle cx='50' cy='50' r='50' fill='url(%23g)'/><circle cx='50' cy='38' r='18' fill='%23ffffff'/><path d='M18 86c0-17.7 14.3-32 32-32s32 14.3 32 32' fill='%23ffffff' opacity='0.95'/></svg>";

export default function BioPreviewSection() {
  const { locale, t } = useLanguage();
  const [device, setDevice] = useState<'phone' | 'tablet'>('phone');
  const [theme, setTheme] = useState<'midnight' | 'emerald' | 'neon'>('midnight');
  const [avatarSrc, setAvatarSrc] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80'
  );

  // Direct DOM Refs for ultra-high-performance 60-120fps physics loop without React re-renders
  const sectionRef = useRef<HTMLElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const deviceContainerRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  // Physical motion tracking references (Lerp engine)
  const motion = useRef({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    targetScroll: 0,
    currentScroll: 0,
    isHovering: false,
    rafId: 0,
  });

  // Keep a ref of current device so RAF loop uses the latest state
  const deviceRef = useRef<'phone' | 'tablet'>(device);
  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  // High-performance Scroll & Pointer Physics Loop
  useEffect(() => {
    const handleScroll = () => {
      if (!showcaseRef.current) return;
      const rect = showcaseRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // -1 when scrolled past top, 0 at viewport center, +1 when entering from bottom
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2);
      motion.current.targetScroll = Math.max(-1.5, Math.min(1.5, progress));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 60-120fps Animation Loop with Spring Lerp & Idle Breathing
    let startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - startTime) * 0.001; // in seconds
      const m = motion.current;

      // Smooth damping lerp factor (0.075 gives a buttery weighted feel)
      const lerpFactor = 0.075;
      m.currentX += (m.targetX - m.currentX) * lerpFactor;
      m.currentY += (m.targetY - m.currentY) * lerpFactor;
      m.currentScroll += (m.targetScroll - m.currentScroll) * lerpFactor;

      // Delicate idle breathing oscillation (keeps 3D model alive even when pointer is still)
      const idleRotY = Math.sin(elapsed * 1.2) * 1.8;
      const idleRotX = Math.cos(elapsed * 0.9) * 1.4;
      const idleFloatY = Math.sin(elapsed * 1.4) * 3.5;

      const mx = m.currentX;
      const my = m.currentY;
      const sp = m.currentScroll;
      const curDevice = deviceRef.current;

      if (curDevice === 'phone') {
        // Phone 3D Physics
        const rotY = mx * 20 + idleRotY;
        const rotX = -my * 18 - sp * 12 + idleRotX;
        const rotZ = mx * -3.0 + sp * 1.6;
        const transY = my * 10 - sp * 28 + idleFloatY;
        const transX = mx * 8;
        const scale = m.isHovering ? 1.02 : 1.0;

        if (deviceContainerRef.current) {
          deviceContainerRef.current.style.transform = `translate3d(${transX}px, ${transY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale3d(${scale}, ${scale}, 1)`;
        }
        if (glareRef.current) {
          const glareX = 50 + mx * 45;
          const glareY = 25 + my * 45;
          glareRef.current.style.background = `radial-gradient(circle 350px at ${glareX}% ${glareY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;
          glareRef.current.style.opacity = m.isHovering ? '0.2' : '0.06';
        }
        if (shadowRef.current) {
          const shadowX = -mx * 26;
          const shadowScale = Math.max(0.7, 1 - Math.abs(sp) * 0.15);
          shadowRef.current.style.transform = `translateX(${shadowX}px) scale(${shadowScale})`;
          shadowRef.current.style.opacity = `${Math.max(0.35, 0.8 - Math.abs(sp) * 0.25)}`;
        }
      } else {
        // iPad Pro 13" (Tablet/Desktop) 3D Physics
        const rotY = mx * 15 + idleRotY * 0.8;
        const rotX = 5 - my * 12 - sp * 9 + idleRotX * 0.7;
        const rotZ = mx * -2.0 + sp * 1.3;
        const transY = my * 8 - sp * 22 + idleFloatY * 0.8;
        const transX = mx * 7;
        const scale = m.isHovering ? 1.015 : 1.0;

        if (deviceContainerRef.current) {
          deviceContainerRef.current.style.transform = `translate3d(${transX}px, ${transY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale3d(${scale}, ${scale}, 1)`;
        }
        if (glareRef.current) {
          const glareX = 50 + mx * 40;
          const glareY = 25 + my * 40;
          glareRef.current.style.background = `radial-gradient(circle 400px at ${glareX}% ${glareY}%, rgba(255,255,255,0.1) 0%, transparent 60%)`;
          glareRef.current.style.opacity = m.isHovering ? '0.18' : '0.05';
        }
        if (shadowRef.current) {
          const shadowX = -mx * 22;
          const shadowScale = Math.max(0.75, 1 - Math.abs(sp) * 0.12);
          shadowRef.current.style.transform = `translateX(${shadowX}px) scale(${shadowScale})`;
          shadowRef.current.style.opacity = `${Math.max(0.4, 0.85 - Math.abs(sp) * 0.25)}`;
        }
      }

      m.rafId = requestAnimationFrame(animate);
    };

    motion.current.rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(motion.current.rafId);
    };
  }, []);

  // Pointer tracking across the showcase section
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showcaseRef.current) return;
    const rect = showcaseRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to +1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to +1
    motion.current.targetX = Math.max(-1.1, Math.min(1.1, x));
    motion.current.targetY = Math.max(-1.1, Math.min(1.1, y));
    motion.current.isHovering = true;
  };

  const handleMouseLeave = () => {
    motion.current.targetX = 0;
    motion.current.targetY = 0;
    motion.current.isHovering = false;
  };

  const themeStyles = {
    midnight: {
      bg: 'bg-[#090d16]',
      border: 'border-white/5',
      primaryBtn: 'bg-white text-zinc-950 font-semibold shadow-sm',
      secondaryBtn: 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700',
      badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      accentText: 'text-zinc-400',
    },
    emerald: {
      bg: 'bg-[#06140e]',
      border: 'border-emerald-500/15',
      primaryBtn: 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm',
      secondaryBtn: 'bg-emerald-950/60 border-emerald-800/40 text-emerald-100 hover:border-emerald-700',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      accentText: 'text-emerald-400',
    },
    neon: {
      bg: 'bg-[#120a1a]',
      border: 'border-purple-500/20',
      primaryBtn: 'bg-fuchsia-500 text-zinc-950 font-semibold shadow-sm',
      secondaryBtn: 'bg-purple-950/50 border-purple-800/40 text-purple-100 hover:border-purple-700',
      badge: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
      accentText: 'text-pink-400',
    },
  };

  const currentTheme = themeStyles[theme];

  return (
    <section
      id="bio-builder"
      ref={sectionRef}
      className="py-20 md:py-28 relative overflow-hidden bg-zinc-950 border-b border-zinc-800/80 select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Device Mockup Showcase */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center order-2 lg:order-1">
            
            {/* Device Switcher Selector Bar (Phone vs Tablet/Desktop) */}
            <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg mb-7 shadow-sm text-xs font-mono">
              <button
                type="button"
                onClick={() => setDevice('phone')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                  device === 'phone'
                    ? 'bg-zinc-800 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone</span>
              </button>
              <button
                type="button"
                onClick={() => setDevice('tablet')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                  device === 'tablet'
                    ? 'bg-zinc-800 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tablet/Desktop</span>
              </button>
            </div>

            {/* 3D Interactive Stage with 1400px Perspective */}
            <div
              ref={showcaseRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full flex flex-col items-center justify-center py-4 cursor-grab active:cursor-grabbing"
              style={{ perspective: 1400 }}
            >
              {/* THE 3D HARDWARE MODEL CONTAINER (Controlled directly by RAF physics engine) */}
              <div
                ref={deviceContainerRef}
                className="relative transition-transform duration-75 ease-out"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {device === 'phone' ? (
                  /* ================= REAL 3D PHONE (Clean Symmetrical Corners + Parallax Z-Layers) ================= */
                  <div
                    className="relative mx-auto w-[324px] sm:w-[335px] h-[700px] sm:h-[720px] rounded-[54px] p-[4.5px] bg-gradient-to-b from-[#3a3c42] via-[#212226] to-[#121316] ring-1 ring-white/20 flex flex-col justify-between"
                    style={{
                      transformStyle: 'preserve-3d',
                      boxShadow: `
                        0 0 0 1px rgba(255, 255, 255, 0.12),
                        1px 1px 0px #38393e,
                        2px 2px 0px #2f3034,
                        3px 3px 0px #242528,
                        4px 4px 0px #1a1b1d,
                        5px 5px 1px rgba(0, 0, 0, 0.5),
                        0 35px 80px -15px rgba(0, 0, 0, 0.95),
                        0 0 40px -10px rgba(0, 0, 0, 0.5)
                      `,
                    }}
                  >
                    {/* Subtle Glass Edge Sheen (No screen fogging) */}
                    <div
                      ref={glareRef}
                      className="absolute inset-0 z-50 pointer-events-none rounded-[50px] mix-blend-overlay transition-opacity duration-300"
                      style={{ transform: 'translateZ(46px)' }}
                    />

                    {/* Physical Buttons on Dark Titanium Chassis */}
                    <div
                      className="absolute -left-[7px] top-[95px] w-[3.5px] h-[26px] bg-gradient-to-r from-[#5a5c64] to-[#26272b] rounded-l-sm shadow-sm"
                      title="Action Button"
                      style={{ transform: 'translateZ(4px)' }}
                    />
                    <div
                      className="absolute -left-[7px] top-[135px] w-[3.5px] h-[50px] bg-gradient-to-r from-[#5a5c64] to-[#26272b] rounded-l-sm shadow-sm"
                      title="Volume Up"
                      style={{ transform: 'translateZ(4px)' }}
                    />
                    <div
                      className="absolute -left-[7px] top-[195px] w-[3.5px] h-[50px] bg-gradient-to-r from-[#5a5c64] to-[#26272b] rounded-l-sm shadow-sm"
                      title="Volume Down"
                      style={{ transform: 'translateZ(4px)' }}
                    />
                    <div
                      className="absolute -right-[7px] top-[150px] w-[3.5px] h-[72px] bg-gradient-to-l from-[#5a5c64] to-[#26272b] rounded-r-sm shadow-sm"
                      title="Side Power Button"
                      style={{ transform: 'translateZ(4px)' }}
                    />

                    {/* OLED Display Screen Glass (Elevated in 3D space with layered translateZ) */}
                    <div
                      className={`relative w-full h-full rounded-[48px] overflow-hidden ${currentTheme.bg} border ${currentTheme.border} pt-3 pb-3 px-4 text-center transition-colors duration-500 flex flex-col justify-between`}
                      style={{ transform: 'translateZ(8px)', transformStyle: 'preserve-3d' }}
                    >
                      {/* Top Bar: Status Bar + Dynamic Island */}
                      <div className="relative z-30" style={{ transform: 'translateZ(18px)' }}>
                        <div className="flex items-center justify-between px-3 text-[11px] font-semibold text-white/90 select-none">
                          <span className="font-mono">9:41</span>
                          <div className="flex items-center gap-1.5 text-white/90">
                            <span className="text-[10px] font-mono">5G</span>
                            {/* Battery Capsule */}
                            <div className="w-5 h-2.5 rounded-[4px] border border-white/90 p-[1.5px] flex items-center">
                              <div className="w-full h-full bg-emerald-400 rounded-[1.5px]" />
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Island */}
                        <div className="relative mx-auto w-[118px] h-[28px] bg-black rounded-full flex items-center justify-between px-3 mt-1 shadow-lg border border-white/5">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a0f] border border-white/10 flex items-center justify-center">
                            <span className="w-1 h-1 rounded-full bg-blue-500/80" />
                          </div>
                          {/* Live Activity indicator pulse */}
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse delay-75" />
                            <span className="w-1 h-1.5 bg-emerald-400 rounded-full animate-pulse delay-150" />
                          </div>
                          <div className="w-2 h-2 rounded-full bg-[#1c1c1e]" />
                        </div>
                      </div>

                      {/* Main Scrollable Content Layers */}
                      <div className="py-2 px-1 space-y-3.5 my-auto" style={{ transformStyle: 'preserve-3d' }}>
                        {/* Creator Avatar with AI 3D Portrait & Parallax Depth */}
                        <div
                          className="relative mx-auto w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-zinc-700 via-zinc-600 to-zinc-800 shadow-md"
                          style={{ transform: 'translateZ(26px)' }}
                        >
                          <img
                            src={avatarSrc}
                            alt="AI Creator Avatar"
                            onError={() => setAvatarSrc(FALLBACK_AVATAR)}
                            className="w-full h-full rounded-full object-cover shadow-inner"
                          />
                          <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#090d16] flex items-center justify-center shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          </span>
                        </div>

                        {/* Name & Verified Badge */}
                        <div style={{ transform: 'translateZ(24px)' }}>
                          <div className="flex items-center justify-center gap-1.5">
                            <h4 className="font-bold text-white text-base tracking-tight font-sans">Khurshid Nurmukhamedov</h4>
                            <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0" />
                          </div>
                          <p className={`text-xs ${currentTheme.accentText} font-mono mt-0.5`}>
                            @khurshid · urls.uz/b/khurshid
                          </p>
                        </div>

                        <p
                          className="text-[11px] text-zinc-400 px-2 leading-relaxed"
                          style={{ transform: 'translateZ(20px)' }}
                        >
                          Tadbirkor & Veb Dasturchi. Toshkent shahrida startaplar va raqamli marketing loyihalari 🚀
                        </p>

                        {/* Social Channel Links with 3D Elevation */}
                        <div
                          className="flex justify-center gap-2.5"
                          style={{ transform: 'translateZ(30px)' }}
                        >
                          <span className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-[#229ED9] shadow-sm transition-transform active:scale-95 cursor-pointer">
                            <TelegramIcon className="w-4 h-4" />
                          </span>
                          <span className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-[#E1306C] shadow-sm transition-transform active:scale-95 cursor-pointer">
                            <InstagramIcon className="w-4 h-4" />
                          </span>
                          <span className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-[#FF0000] shadow-sm transition-transform active:scale-95 cursor-pointer">
                            <YouTubeIcon className="w-4 h-4" />
                          </span>
                        </div>

                        {/* High-Elevation 3D Link Action Buttons */}
                        <div className="space-y-2 text-xs font-semibold" style={{ transformStyle: 'preserve-3d' }}>
                          <div
                            className={`p-3 rounded-xl ${currentTheme.primaryBtn} flex items-center justify-between shadow-md active:scale-[0.98] transition-all cursor-pointer`}
                            style={{
                              transform: 'translateZ(36px)',
                              boxShadow: '0 8px 18px -4px rgba(0, 0, 0, 0.5)',
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <Flame className="w-3.5 h-3.5 text-amber-500" />
                              <span>🔥 Yangi Kurs & Loyihalarim</span>
                            </span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </div>

                          <div
                            className={`p-3 rounded-xl ${currentTheme.secondaryBtn} border flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer`}
                            style={{
                              transform: 'translateZ(32px)',
                              boxShadow: '0 6px 14px -4px rgba(0, 0, 0, 0.4)',
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <MessageCircle className="w-3.5 h-3.5 text-[#229ED9]" />
                              <span>📱 Telegram Kanalga Qo‘shilish</span>
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                          </div>

                          <div
                            className={`p-3 rounded-xl ${currentTheme.secondaryBtn} border flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer`}
                            style={{
                              transform: 'translateZ(28px)',
                              boxShadow: '0 6px 12px -4px rgba(0, 0, 0, 0.35)',
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <Briefcase className="w-3.5 h-3.5 text-zinc-300" />
                              <span>💼 Portfolio & Aloqa</span>
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                          </div>
                        </div>
                      </div>

                      {/* Phone Home Indicator Bar */}
                      <div className="pt-1" style={{ transform: 'translateZ(14px)' }}>
                        <div className="w-32 h-1 bg-white/40 rounded-full mx-auto" />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= REAL 3D IPAD PRO 13-INCH (Ultra-Thin 5.1mm Unibody + Tandem OLED + Center Stage) ================= */
                  <div
                    className="relative mx-auto w-[92vw] max-w-[580px] sm:max-w-[610px] aspect-[4/3] rounded-[36px] p-[10px] bg-gradient-to-b from-[#3a3c42] via-[#212226] to-[#121316] ring-1 ring-white/20 flex flex-col justify-between"
                    style={{
                      transformStyle: 'preserve-3d',
                      boxShadow: `
                        0 0 0 1px rgba(255, 255, 255, 0.12),
                        1px 1px 0px #38393e,
                        2px 2px 0px #2f3034,
                        3px 3px 0px #242528,
                        4px 4px 0px #1a1b1d,
                        5px 5px 1px rgba(0, 0, 0, 0.5),
                        0 35px 80px -15px rgba(0, 0, 0, 0.95),
                        0 0 40px -10px rgba(0, 0, 0, 0.5)
                      `,
                    }}
                  >
                    {/* Top Edge: Apple Pencil Pro Magnetic Charging Strip */}
                    <div
                      className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-48 h-[3px] bg-[#3a3b40] rounded-t-sm border-t border-white/20"
                      title="Apple Pencil Pro Magnetic Connector"
                    />

                    {/* Top Edge: Volume Buttons */}
                    <div
                      className="absolute -top-[5px] right-[48px] w-14 h-[3px] bg-[#3a3b40] rounded-t-sm"
                      title="Volume Controls"
                    />

                    {/* Left Edge: Power/Sleep Button + Speaker Grille */}
                    <div
                      className="absolute -left-[5px] top-[32px] w-[3px] h-[28px] bg-[#3a3b40] rounded-l-sm"
                      title="Top Sleep / Wake Button"
                    />
                    <div className="absolute -left-[4px] top-[120px] w-[2px] h-[34px] flex flex-col justify-between opacity-50">
                      <span className="w-1 h-0.5 bg-white/40 rounded-full" />
                      <span className="w-1 h-0.5 bg-white/40 rounded-full" />
                      <span className="w-1 h-0.5 bg-white/40 rounded-full" />
                      <span className="w-1 h-0.5 bg-white/40 rounded-full" />
                    </div>

                    {/* Right Edge: USB-C Thunderbolt Port + Speaker Grille */}
                    <div
                      className="absolute -right-[4px] top-1/2 -translate-y-1/2 w-[2.5px] h-9 bg-[#111215] rounded-r-sm border-r border-white/10"
                      title="Thunderbolt / USB-C Port"
                    />
                    <div className="absolute -right-[4px] top-[120px] w-[2px] h-[34px] flex flex-col justify-between opacity-50">
                      <span className="w-1 h-0.5 bg-white/40 rounded-full" />
                      <span className="w-1 h-0.5 bg-white/40 rounded-full" />
                      <span className="w-1 h-0.5 bg-white/40 rounded-full" />
                      <span className="w-1 h-0.5 bg-white/40 rounded-full" />
                    </div>

                    {/* Top Horizontal Bezel: Landscape Center Stage Camera & FaceID Sensors */}
                    <div className="absolute top-[3px] left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-40 pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-[#0d0d12] border border-blue-500/50 shadow-inner flex items-center justify-center">
                        <span className="w-0.5 h-0.5 rounded-full bg-blue-400" />
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#1c1c1e]" />
                    </div>

                    {/* Subtle Glass Edge Sheen (No screen fogging) */}
                    <div
                      ref={glareRef}
                      className="absolute inset-0 z-50 pointer-events-none rounded-[28px] mix-blend-overlay transition-opacity duration-300"
                      style={{ transform: 'translateZ(42px)' }}
                    />

                    {/* Ultra Retina XDR Tandem OLED Display Glass (True 4:3 Display) */}
                    <div
                      className={`relative w-full h-full rounded-[26px] overflow-hidden ${currentTheme.bg} border border-white/10 p-3 sm:p-4 text-center transition-colors duration-500 flex flex-col justify-between`}
                      style={{ transform: 'translateZ(6px)', transformStyle: 'preserve-3d' }}
                    >
                      {/* iPadOS Top Bar: Status Bar + Multitasking ··· Menu */}
                      <div
                        className="relative flex items-center justify-between px-3 text-[11px] font-semibold text-white/90 select-none pb-1"
                        style={{ transform: 'translateZ(14px)' }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono">9:41</span>
                          <span className="text-[10px] text-zinc-400 font-normal">Seshanba, 14-Okt</span>
                        </div>

                        {/* iPadOS Multitasking 3 Dots Menu Button */}
                        <div className="mx-auto px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center gap-1 cursor-pointer transition-all">
                          <span className="w-1 h-1 rounded-full bg-white/80" />
                          <span className="w-1 h-1 rounded-full bg-white/80" />
                          <span className="w-1 h-1 rounded-full bg-white/80" />
                        </div>

                        {/* Wi-Fi & Battery Capsule */}
                        <div className="flex items-center gap-1.5 text-white/90">
                          <span className="text-[10px] font-mono">100%</span>
                          <div className="w-5 h-2.5 rounded-[4px] border border-white/90 p-[1.5px] flex items-center">
                            <div className="w-full h-full bg-emerald-400 rounded-[1.5px]" />
                          </div>
                        </div>
                      </div>

                      {/* iPadOS Safari Browser Header Bar */}
                      <div
                        className="relative bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center justify-between border border-zinc-800 mb-2 shrink-0"
                        style={{ transform: 'translateZ(14px)' }}
                      >
                        {/* Traffic light navigation & back/forward */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                            <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                            <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                          </div>
                          <div className="hidden sm:flex items-center gap-1 text-zinc-500 pl-2 border-l border-zinc-800 text-xs">
                            <span>‹</span>
                            <span>›</span>
                          </div>
                        </div>

                        {/* Safari Unified Address Pill */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-950 text-[11px] font-mono text-zinc-300 border border-zinc-800">
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                          <span>urls.uz/b/khurshid</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                          <Share2 className="w-3 h-3 hover:text-white cursor-pointer" />
                        </div>
                      </div>

                      {/* True Desktop / Tablet 2-Column Responsive Layout */}
                      <div
                        className="p-2 sm:p-3 grid grid-cols-12 gap-4 items-center my-auto"
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {/* Left Profile Column (5 cols) */}
                        <div
                          className="col-span-5 text-center p-3 rounded-xl bg-white/[0.02] border border-zinc-800/80 space-y-2"
                          style={{
                            transform: 'translateZ(20px)',
                            boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.4)',
                          }}
                        >
                          <div className="relative mx-auto w-16 h-16 rounded-full p-1 bg-zinc-800 border border-zinc-700 shadow-sm">
                            <img
                              src={avatarSrc}
                              alt="Creator Avatar"
                              onError={() => setAvatarSrc(FALLBACK_AVATAR)}
                              className="w-full h-full rounded-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#090d16] flex items-center justify-center">
                              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center justify-center gap-1">
                              <h4 className="font-bold text-white text-xs font-sans">Khurshid N.</h4>
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                            </div>
                            <p className={`text-[10px] ${currentTheme.accentText} font-mono`}>
                              urls.uz/b/khurshid
                            </p>
                          </div>

                          <p className="text-[10px] text-zinc-400 leading-tight">
                            Tadbirkor & Veb Dasturchi. Toshkent shahrida startaplar 🚀
                          </p>

                          {/* Social Icons */}
                          <div className="flex justify-center gap-2 pt-1">
                            <span className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-[#229ED9] border border-zinc-700">
                              <TelegramIcon className="w-3 h-3" />
                            </span>
                            <span className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-[#E1306C] border border-zinc-700">
                              <InstagramIcon className="w-3 h-3" />
                            </span>
                            <span className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-[#FF0000] border border-zinc-700">
                              <YouTubeIcon className="w-3 h-3" />
                            </span>
                          </div>
                        </div>

                        {/* Right Link Cards Column (7 cols) */}
                        <div className="col-span-7 space-y-2 text-left" style={{ transformStyle: 'preserve-3d' }}>
                          <div
                            className={`p-2.5 rounded-lg ${currentTheme.primaryBtn} flex items-center justify-between text-xs font-medium shadow-sm cursor-pointer transition-all active:scale-[0.98]`}
                            style={{
                              transform: 'translateZ(28px)',
                              boxShadow: '0 6px 14px -3px rgba(0, 0, 0, 0.4)',
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <Flame className="w-3.5 h-3.5 text-amber-500" />
                              <span>🔥 Yangi Kurs & Loyihalarim</span>
                            </span>
                            <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded font-mono">1.2k</span>
                          </div>

                          <div
                            className={`p-2.5 rounded-lg ${currentTheme.secondaryBtn} border flex items-center justify-between text-xs font-medium cursor-pointer transition-all active:scale-[0.98]`}
                            style={{
                              transform: 'translateZ(24px)',
                              boxShadow: '0 6px 12px -3px rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <MessageCircle className="w-3.5 h-3.5 text-[#229ED9]" />
                              <span>📱 Telegram Kanalga Qo‘shilish</span>
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">850</span>
                          </div>

                          <div
                            className={`p-2.5 rounded-lg ${currentTheme.secondaryBtn} border flex items-center justify-between text-xs font-medium cursor-pointer transition-all active:scale-[0.98]`}
                            style={{
                              transform: 'translateZ(20px)',
                              boxShadow: '0 4px 10px -3px rgba(0, 0, 0, 0.25)',
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                              <span>💼 Portfolio & Aloqa</span>
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                          </div>

                          {/* Stats Bar */}
                          <div
                            className="pt-1 flex items-center justify-between text-[10px] text-zinc-400 px-1 border-t border-zinc-800"
                            style={{ transform: 'translateZ(16px)' }}
                          >
                            <span className="flex items-center gap-1 text-emerald-400 font-mono">
                              <TrendingUp className="w-3 h-3" />
                              <span>+34% konversiya</span>
                            </span>
                            <span className="font-mono">2,840 jami bosishlar</span>
                          </div>
                        </div>
                      </div>

                      {/* iPadOS Home Indicator Bar */}
                      <div className="pt-1" style={{ transform: 'translateZ(14px)' }}>
                        <div className="w-40 h-1 bg-white/40 rounded-full mx-auto" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic 3D Cast Floor Shadow */}
              <div
                ref={shadowRef}
                className="w-[75%] max-w-[480px] h-7 bg-black/90 rounded-full blur-2xl transition-all duration-75 pointer-events-none mt-4"
              />
            </div>

            {/* Quick Live Theme Switcher */}
            <div className="flex items-center gap-2 mt-4 font-mono text-xs">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Palette className="w-3 h-3 text-zinc-400" />
                <span>MAVZU:</span>
              </span>
              {[
                { id: 'midnight' as const, label: 'Obsidian', color: 'bg-zinc-900' },
                { id: 'emerald' as const, label: 'Emerald', color: 'bg-emerald-600' },
                { id: 'neon' as const, label: 'Neon Glow', color: 'bg-fuchsia-600' },
              ].map((tItem) => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setTheme(tItem.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border transition-all ${
                    theme === tItem.id
                      ? 'bg-zinc-800 text-white border-zinc-600 font-medium'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${tItem.color}`} />
                  <span>{tItem.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Description & Action */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-3">
                <span>SPEC-PORTAL · RESPONSIVE BIO ENGINE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3">
                {locale === 'uz'
                  ? 'Barcha havolalaringiz uchun bitta mukammal portal'
                  : locale === 'ru'
                  ? 'Единая страница для всех ваших соцсетей и ссылок'
                  : 'High-converting responsive bio portal'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                {locale === 'uz'
                  ? 'Instagram yoki TikTok profilida bitta havola bilan cheklanmang. urls.uz/b/@nomingiz orqali kanallaringiz, xizmatlaringiz va kontaktlaringizni mobil va planshetda mukammal ko‘rsating.'
                  : locale === 'ru'
                  ? 'Объедините все важные ссылки с удобной аналитикой и адаптивным отображением на телефонах и планшетах.'
                  : 'Convert profile traffic into direct channel subscribers and sales with custom branding and real-time conversion telemetry.'}
              </p>
            </div>

            {/* Feature Bullet Points (Linear Standard) */}
            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-200" />
                </div>
                <div>
                  <strong className="text-zinc-200 font-medium block">Shaxsiy brend domeni</strong>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    urls.uz/b/@username formati
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-3.5 h-3.5 text-zinc-200" />
                </div>
                <div>
                  <strong className="text-zinc-200 font-medium block">Alohida havola tahlillari</strong>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Har bir havola bo‘yicha aniq CTR va konversiya
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <Palette className="w-3.5 h-3.5 text-zinc-200" />
                </div>
                <div>
                  <strong className="text-zinc-200 font-medium block">Moslashuvchan mavzular</strong>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Obsidian, Emerald va Neon kontrast ranglar
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                href="/dashboard/bio"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <span>{t.createBioPage}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
