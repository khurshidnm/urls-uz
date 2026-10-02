'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/lib/language-context';
import { Sparkles, Check, ArrowRight, Lock, Eye, ShieldCheck } from 'lucide-react';

interface DemoRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle?: string;
  onStartFree: () => void;
}

export function DemoRestrictionModal({
  isOpen,
  onClose,
  actionTitle,
  onStartFree,
}: DemoRestrictionModalProps) {
  const { tr } = useLanguage();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={tr('Demo Rejimi (Faqat ko‘rish)', 'Демо-режим (только просмотр)', 'Demo mode (view only)')}
      subtitle={tr('Namunaviy ma\'lumotlar ustida ishlamoqdasiz', 'Вы работаете с демонстрационными данными', 'You’re looking at sample data')}
    >
      <div className="space-y-5 py-1 text-center">
        {/* Animated Badge Icon */}
        <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-indigo-500/10 to-purple-500/20 border border-amber-500/30 text-amber-400 mx-auto shadow-inner">
          <Sparkles className="w-7 h-7 animate-pulse text-amber-400" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">
            !
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {actionTitle ? tr(`${actionTitle} — Demo rejimida cheklangan`, `${actionTitle} — недоступно в демо-режиме`, `${actionTitle} isn’t available in demo mode`) : tr('O‘z havolalaringizni yaratishni xohlaysizmi?', 'Хотите создавать свои ссылки?', 'Want to create your own links?')}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
            {tr('Hozir siz namunaviy kompaniya ma’lumotlarini ko‘rmoqdasiz:', 'Сейчас вы видите данные демо-компании', 'You’re viewing the sample company')}{' '}
            <span className="text-zinc-200 font-semibold font-mono">«ApexTech Solutions»</span>.{' '}
            {tr(
              'Demo rejimida barcha sahifalar va analitika ochiq, biroq yangi havola yaratish yoki o‘zgartirish cheklangan.',
              'В демо-режиме открыты все страницы и аналитика, но создавать и менять ссылки нельзя.',
              'In demo mode every page and the analytics are open, but creating or changing links is disabled.'
            )}
          </p>
        </div>

        {/* Free Plan Features Card */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{tr('Bepul Tarif Bilan Nimalarga Ega Bo‘lasiz:', 'Что даёт бесплатный тариф:', 'What the free plan gives you:')}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              100% Bepul
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-zinc-300 font-mono">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{tr('10 ta faol qisqa havola', '10 активных коротких ссылок', '10 active short links')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{tr('1 ta Smart Deep Link', '1 Smart Deep Link', '1 Smart Deep Link')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>iOS, Android, HarmonyOS</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{tr('Brendlangan Link-in-Bio', 'Брендированная Link-in-Bio', 'Branded Link-in-Bio')}</span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{tr('14 viloyat bo‘yicha to‘liq jonli analitika', 'Живая аналитика по 14 регионам', 'Live analytics for all 14 regions')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onStartFree}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
          >
            <span>{tr('Bepul versiyani boshlash (Ro‘yxatdan o‘tish)', 'Начать бесплатно (регистрация)', 'Start free (sign up)')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-3 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            {tr('Demoni ko‘rishda davom etish', 'Продолжить просмотр демо', 'Keep exploring the demo')}
          </button>
        </div>

        <p className="text-[10px] text-zinc-500 font-mono">
          {tr('Kredit karta talab qilinmaydi · Email, Google yoki Telegram orqali 10 soniyada kiring', 'Карта не нужна · Вход через email, Google или Telegram за 10 секунд', 'No card needed · Sign in with email, Google or Telegram in 10 seconds')}
        </p>
      </div>
    </Modal>
  );
}
