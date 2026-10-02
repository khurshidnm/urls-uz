'use client';

import React, { useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/components/ui/toast';
import { copyToClipboard } from '@/lib/utils';
import type { ClientBioPage } from '@/lib/client-types';
import { AVATAR_PRESETS, THEMES, renderBioIcon, toBuilderButton, type BioLinkItem } from './bio-builder-constants';
import { SITE_URL } from '@/lib/site';

/** All state and actions of the bio builder; the tab components read what they need from it. */
export function useBioBuilder(initialBio: ClientBioPage | undefined, owner: { name: string; avatar: string }) {
  const { user, isSuperAdmin, demoEditMode } = useAuth();
  const { t, tr } = useLanguage();
  const { showToast } = useToast();

  const checkDemoRestricted = (actionName: string) => {
    if (isSuperAdmin && demoEditMode) {
      return false;
    }
    if (!user) {
      window.dispatchEvent(
        new CustomEvent('open-demo-restriction', { detail: { actionTitle: actionName } })
      );
      return true;
    }
    return false;
  };

  const parsedSocial: Record<string, string> = initialBio?.social_links ?? {};

  // Profile Fields
  const [handle, setHandle] = useState(initialBio?.handle ?? '');
  const [title, setTitle] = useState(initialBio?.title ?? owner.name);
  const [bio, setBio] = useState(initialBio?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialBio?.avatar_url || owner.avatar);
  // Custom Avatar Upload & Crop State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>('');
  const [avatarSizeKb, setAvatarSizeKb] = useState<number | null>(() => {
    if (initialBio?.avatar_url && initialBio.avatar_url.startsWith('data:image/')) {
      const base64Data = initialBio.avatar_url.split(',')[1] || '';
      return Math.round((base64Data.length * 3) / 4 / 1024);
    }
    return null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (checkDemoRestricted(tr('Profil rasmini almashtirish', 'Смена фото профиля', 'Changing the profile photo'))) {
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', tr('Iltimos, rasm formatidagi faylni tanlang (PNG, JPG, WebP)', 'Выберите изображение (PNG, JPG, WebP)', 'Please choose an image file (PNG, JPG, WebP)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawImageSrc(reader.result);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedDataUrl: string, fileSizeKb: number) => {
    setAvatarUrl(croppedDataUrl);
    setAvatarSizeKb(fileSizeKb);
  };

  const [theme, setTheme] = useState(initialBio?.theme || 'midnight');
  const buttonRadius = 'rounded-xl';

  // Social Links
  const [socialTelegram, setSocialTelegram] = useState(parsedSocial.telegram || '');
  const [socialInstagram, setSocialInstagram] = useState(parsedSocial.instagram || '');
  const [socialYoutube, setSocialYoutube] = useState(parsedSocial.youtube || '');
  const [socialTiktok, setSocialTiktok] = useState(parsedSocial.tiktok || '');
  const [socialGithub, setSocialGithub] = useState(parsedSocial.github || '');
  const [socialLinkedin, setSocialLinkedin] = useState(parsedSocial.linkedin || '');
  const [socialTwitter, setSocialTwitter] = useState(parsedSocial.twitter || '');
  const [socialWebsite, setSocialWebsite] = useState(parsedSocial.website || '');

  // Custom Links: Limited to 4 in Free Plan
  const BIO_LINKS_LIMIT = 4;
  // Existing buttons, or an empty page for a new user (no placeholder buttons pointing at someone else's site)
  const initialLinks: BioLinkItem[] = (initialBio?.links ?? []).slice(0, BIO_LINKS_LIMIT).map(toBuilderButton);

  const [links, setLinks] = useState<BioLinkItem[]>(initialLinks);

  // Active Editor Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'links' | 'social' | 'themes'>('profile');

  // Device Preview State: 'iphone' or 'ipad'
  const [deviceMode, setDeviceMode] = useState<'iphone' | 'ipad'>('iphone');
  const [deviceFinish, setDeviceFinish] = useState<'black' | 'natural' | 'desert'>('black');
  const [previewScale, setPreviewScale] = useState<number>(100);

  // Modals & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [proModalText, setProModalText] = useState('');

  const currentThemeObj = useMemo(() => {
    return THEMES.find((t) => t.id === theme) || THEMES[0];
  }, [theme]);

  const fullBioUrl = `${SITE_URL}/b/${handle}`;

  // Link Handlers
  const addLink = () => {
    if (checkDemoRestricted(tr('Yangi bio havola qo‘shish', 'Добавление кнопки', 'Adding a button'))) return;

    if (links.length >= BIO_LINKS_LIMIT) {
      setProModalText(tr(`Bepul tarifda faqat ${BIO_LINKS_LIMIT} ta tugma yaratish mumkin. Cheksiz tugmalar Pro tarifda tez kunda ishga tushadi!`, `На бесплатном тарифе — только ${BIO_LINKS_LIMIT} кнопок. Безлимит скоро появится на тарифе Pro!`, `The free plan allows only ${BIO_LINKS_LIMIT} buttons. Unlimited buttons are coming soon with Pro!`));
      setProModalOpen(true);
      return;
    }

    setLinks([
      ...links,
      {
        title: tr('Yangi havola', 'Новая ссылка', 'New link'),
        url: 'https://',
        icon: 'link',
        style: 'glass',
        animation: 'none',
        tag: '',
        enabled: true,
        click_count: 0,
      },
    ]);
  };

  const removeLink = (index: number) => {
    if (checkDemoRestricted(tr('Bio havolani o‘chirish', 'Удаление кнопки', 'Deleting a button'))) return;
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = <K extends keyof BioLinkItem>(index: number, field: K, value: BioLinkItem[K]) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === links.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...links];
    const item = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = item;
    setLinks(updated);
  };

  const handleCopyBioLink = async () => {
    const ok = await copyToClipboard(fullBioUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleThemeSelect = (th: typeof THEMES[0]) => {
    if (th.pro) {
      setProModalText(tr(`"${th.name}" mavzusi pullik Pro tarifda tez kunda ishga tushadi! Hozirda Midnight Obsidian, Uzbekistan Emerald va Minimal Light mavzulari barcha uchun to‘liq bepul.`, `Тема «${th.name}» скоро появится на платном тарифе Pro! Сейчас всем бесплатно доступны темы Midnight Obsidian, Uzbekistan Emerald и Minimal Light.`, `The "${th.name}" theme is coming soon with Pro! Midnight Obsidian, Uzbekistan Emerald and Minimal Light are free for everyone.`));
      setProModalOpen(true);
      return;
    }
    setTheme(th.id);
  };

  const handleSave = async () => {
    if (checkDemoRestricted(tr('Bio sahifani saqlash', 'Сохранение bio-страницы', 'Saving the bio page'))) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle,
          title,
          bio,
          avatar_url: avatarUrl,
          theme,
          social_links: {
            telegram: socialTelegram,
            instagram: socialInstagram,
            youtube: socialYoutube,
            tiktok: socialTiktok,
            github: socialGithub,
            linkedin: socialLinkedin,
            twitter: socialTwitter,
            website: socialWebsite,
          },
          links: links.slice(0, BIO_LINKS_LIMIT).map((l, i) => ({
            // Existing buttons keep their short link and statistics
            id: l.id,
            title: l.title,
            url: l.url,
            icon: l.icon || 'link',
            style: l.style,
            animation: 'none',
            sort_order: i,
          })),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        showToast('error', data.error || tr('Saqlashda xatolik yuz berdi', 'Ошибка сохранения', 'Couldn’t save'));
      } else {
        // Adopt server ids so the next save keeps each button's short link and statistics
        setLinks(data.bioPage.links.map(toBuilderButton));
        if (data.limitNotice) showToast('info', data.limitNotice);
        setSavedSuccess(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };


  const getDeviceFinishBorder = () => {
    if (deviceFinish === 'natural') return 'border-[#9a948d] bg-[#3a3734] shadow-[0_25px_60px_-15px_rgba(154,148,141,0.25)]';
    if (deviceFinish === 'desert') return 'border-[#b59e88] bg-[#42362c] shadow-[0_25px_60px_-15px_rgba(181,158,136,0.25)]';
    return 'border-zinc-700 bg-zinc-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]';
  };

  const renderIconComponent = renderBioIcon;

  return {
    checkDemoRestricted,
    /** The handle as saved; it stays valid even if it predates the current rules. */
    savedHandle: initialBio?.handle ?? '',
    handle,
    setHandle,
    title,
    setTitle,
    bio,
    setBio,
    avatarUrl,
    setAvatarUrl,
    cropModalOpen,
    setCropModalOpen,
    rawImageSrc,
    setRawImageSrc,
    avatarSizeKb,
    setAvatarSizeKb,
    fileInputRef,
    handleFileSelect,
    handleCropComplete,
    theme,
    setTheme,
    buttonRadius,
    socialTelegram,
    setSocialTelegram,
    socialInstagram,
    setSocialInstagram,
    socialYoutube,
    setSocialYoutube,
    socialTiktok,
    setSocialTiktok,
    socialGithub,
    setSocialGithub,
    socialLinkedin,
    setSocialLinkedin,
    socialTwitter,
    setSocialTwitter,
    socialWebsite,
    setSocialWebsite,
    BIO_LINKS_LIMIT,
    links,
    setLinks,
    activeTab,
    setActiveTab,
    deviceMode,
    setDeviceMode,
    deviceFinish,
    setDeviceFinish,
    previewScale,
    setPreviewScale,
    isSaving,
    setIsSaving,
    savedSuccess,
    setSavedSuccess,
    qrModalOpen,
    setQrModalOpen,
    copiedLink,
    setCopiedLink,
    proModalOpen,
    setProModalOpen,
    proModalText,
    setProModalText,
    currentThemeObj,
    fullBioUrl,
    addLink,
    removeLink,
    updateLink,
    moveLink,
    handleCopyBioLink,
    handleThemeSelect,
    handleSave,
    getDeviceFinishBorder,
    renderIconComponent,
    user,
    t,
  };
}

export type BioBuilder = ReturnType<typeof useBioBuilder>;
