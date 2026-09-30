'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/language-context';
import {
  QrCanvas,
  BodyShape,
  EyeFrameShape,
  EyeBallShape,
  ColorMode,
  GradientType,
  BUILTIN_LOGOS,
  PHONE_EMOJI_CATEGORIES,
} from '@/components/ui/qr-canvas';
import {
  Link2,
  FileText,
  UserCheck,
  MapPin,
  Wifi,
  Calendar,
  Paintbrush,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  RotateCcw,
  Plus,
  Minus,
  Upload,
  Compass,
  Ban,
  Smile,
  Trash2,
} from 'lucide-react';
import {
  QrDataType,
  VCardPayload,
  WifiPayload,
  LocationPayload,
  EventPayload,
  generateVCardString,
  generateWifiString,
  generateLocationString,
  generateEventString,
  QR_SAMPLE_DATA,
} from '@/lib/qr-payloads';

export default function QrPreviewSection() {
  const { locale } = useLanguage();

  // Active Type Tabs
  const [activeType, setActiveType] = useState<QrDataType>('vcard');

  // Accordion active pane: 'content' | 'colors' | 'logo' | 'design'
  const [activePane, setActivePane] = useState<'content' | 'colors' | 'logo' | 'design'>('content');

  // Quality resolution slider
  const [resolution, setResolution] = useState<number>(1000);

  // Content State: vCard (All QRCode Monkey standard fields)
  const [vcard, setVcard] = useState<VCardPayload>(QR_SAMPLE_DATA.vcard);

  // Content State: URL
  const [customUrl, setCustomUrl] = useState('https://urls.uz/sherzod');

  // Content State: Text
  const [textContent, setTextContent] = useState<string>(QR_SAMPLE_DATA.text);

  // Content State: WiFi
  const [wifi, setWifi] = useState<WifiPayload>(QR_SAMPLE_DATA.wifi);

  // Content State: Location
  const [location, setLocation] = useState<LocationPayload>(QR_SAMPLE_DATA.location);

  // Content State: Event
  const [eventData, setEventData] = useState<EventPayload>(QR_SAMPLE_DATA.event);

  // Styling States
  const [colorMode, setColorMode] = useState<ColorMode>('single');
  const [fgColor, setFgColor] = useState('#09090b');
  const [gradientColor2, setGradientColor2] = useState('#4f46e5');
  const [gradientType, setGradientType] = useState<GradientType>('linear');
  const [customEyeColor, setCustomEyeColor] = useState(false);
  const [eyeFrameColor, setEyeFrameColor] = useState('#09090b');
  const [eyeBallColor, setEyeBallColor] = useState('#09090b');
  const [bgColor, setBgColor] = useState('#ffffff');

  // Logo & Phone Emojis
  const [centerLogo, setCenterLogo] = useState<string>('vcard');
  const [centerEmoji, setCenterEmoji] = useState<string | null>(null);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [removeBgBehindLogo, setRemoveBgBehindLogo] = useState(true);
  const [logoTab, setLogoTab] = useState<'brands' | 'emojis' | 'upload'>('brands');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('popular');

  // Design
  const [bodyShape, setBodyShape] = useState<BodyShape>('square');
  const [eyeFrameShape, setEyeFrameShape] = useState<EyeFrameShape>('square');
  const [eyeBallShape, setEyeBallShape] = useState<EyeBallShape>('square');

  // Frame Text
  const [frameText, setFrameText] = useState('SAVE CONTACT');
  const [frameStyle, setFrameStyle] = useState<'bottom' | 'top' | 'none'>('bottom');

  const [nonce, setNonce] = useState(0);

  const handleTypeSelect = (type: QrDataType) => {
    setActiveType(type);
    setActivePane('content');
    setCenterEmoji(null);
    setCustomEmojiInput('');
    if (type === 'vcard') {
      setCenterLogo('vcard');
      if (frameStyle !== 'none' && frameText) setFrameText('SAVE CONTACT');
    } else if (type === 'wifi') {
      setCenterLogo('wifi');
      if (frameStyle !== 'none' && frameText) setFrameText('CONNECT WI-FI');
    } else if (type === 'location') {
      setCenterLogo('location');
      if (frameStyle !== 'none' && frameText) setFrameText('NAVIGATE');
    } else if (type === 'event') {
      setCenterLogo('event');
      if (frameStyle !== 'none' && frameText) setFrameText('ADD EVENT');
    } else if (type === 'text') {
      setCenterLogo('none');
      if (frameStyle !== 'none' && frameText) setFrameText('READ ME');
    } else {
      setCenterLogo('globe');
      if (frameStyle !== 'none' && frameText) setFrameText('VISIT LINK');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setCustomLogoUrl(uploadEvent.target?.result as string);
      setCenterLogo('custom');
      setCenterEmoji(null);
    };
    reader.readAsDataURL(file);
  };

  const activePayload = useMemo(() => {
    switch (activeType) {
      case 'url':
        return customUrl || 'https://urls.uz';
      case 'vcard':
        return generateVCardString(vcard);
      case 'wifi':
        return generateWifiString(wifi);
      case 'location':
        return generateLocationString(location);
      case 'event':
        return generateEventString(eventData);
      case 'text':
        return textContent || 'urls.uz';
      default:
        return 'https://urls.uz';
    }
  }, [activeType, customUrl, vcard, wifi, location, eventData, textContent, nonce]);

  return (
    <section id="qr-studio" className="py-20 md:py-28 bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-10 text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>QRCODE MONKEY COMPATIBLE · HIGH FIDELITY ENGINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3">
            {locale === 'uz'
              ? 'Professional vCard va Ko‘p Formatli QR Kod Generator'
              : locale === 'ru'
              ? 'Профессиональный генератор vCard и QR-кодов'
              : 'Professional vCard & Multi-Format QR Code Generator'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
            {locale === 'uz'
              ? 'vCard 2.1/3.0 kontaktlari, Wi-Fi parollari, xarita geolokatsiyasi va veb-havolalar uchun 2000px gacha yuqori aniqlikdagi vektor SVG va PNG generatori.'
              : locale === 'ru'
              ? 'Создание визиток vCard 2.1/3.0, подключение к Wi-Fi, геолокация и векторный экспорт SVG/PNG до 2000px.'
              : 'Enterprise-grade generator for vCard 2.1/3.0 contact cards, Wi-Fi access, geo locations, and vector print-ready exports.'}
          </p>
        </div>

        {/* Top Format Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mb-6 overflow-x-auto scrollbar-none">
          {[
            { id: 'url' as const, label: 'URL', icon: Link2 },
            { id: 'text' as const, label: 'Text', icon: FileText },
            { id: 'vcard' as const, label: 'vCard', icon: UserCheck },
            { id: 'location' as const, label: 'Location', icon: MapPin },
            { id: 'wifi' as const, label: 'WIFI', icon: Wifi },
            { id: 'event' as const, label: 'Event', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTypeSelect(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSel
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: 4 Accordions (8 cols) */}
          <div className="lg:col-span-8 space-y-3.5">
            
            {/* Accordion 1: Enter Content */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setActivePane(activePane === 'content' ? ('' as any) : 'content')}
                className="w-full flex items-center justify-between p-3.5 bg-zinc-900/70 hover:bg-zinc-900 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-white">1. Enter Content</span>
                </div>
                <div className="text-zinc-400">
                  {activePane === 'content' ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
              </button>

              {activePane === 'content' && (
                <div className="p-4 border-t border-zinc-800 space-y-4">
                  {/* vCard Form */}
                  {activeType === 'vcard' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400 font-mono text-[11px]">VERSION:</span>
                          <label className="flex items-center gap-1 text-zinc-300 cursor-pointer">
                            <input
                              type="radio"
                              name="lp_vcard_ver"
                              checked={vcard.version === '2.1'}
                              onChange={() => setVcard({ ...vcard, version: '2.1' })}
                              className="text-indigo-600 focus:ring-0"
                            />
                            <span>2.1</span>
                          </label>
                          <label className="flex items-center gap-1 text-zinc-300 cursor-pointer">
                            <input
                              type="radio"
                              name="lp_vcard_ver"
                              checked={vcard.version === '3.0'}
                              onChange={() => setVcard({ ...vcard, version: '3.0' })}
                              className="text-indigo-600 focus:ring-0"
                            />
                            <span>3.0</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVcard(QR_SAMPLE_DATA.vcard)}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Namuna</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 mb-1">FIRSTNAME *</label>
                          <input
                            type="text"
                            value={vcard.firstName}
                            onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 mb-1">LASTNAME</label>
                          <input
                            type="text"
                            value={vcard.lastName}
                            onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 mb-1">ORGANIZATION</label>
                          <input
                            type="text"
                            value={vcard.organization || ''}
                            onChange={(e) => setVcard({ ...vcard, organization: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 mb-1">POSITION (WORK)</label>
                          <input
                            type="text"
                            value={vcard.jobTitle || ''}
                            onChange={(e) => setVcard({ ...vcard, jobTitle: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 mb-1">PHONE (MOBILE) *</label>
                          <input
                            type="tel"
                            value={vcard.phoneMobile || ''}
                            onChange={(e) => setVcard({ ...vcard, phoneMobile: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 mb-1">EMAIL</label>
                          <input
                            type="email"
                            value={vcard.email || ''}
                            onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 mb-1">WEBSITE</label>
                          <input
                            type="text"
                            value={vcard.website || ''}
                            onChange={(e) => setVcard({ ...vcard, website: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 mb-1">CITY</label>
                          <input
                            type="text"
                            value={vcard.city || ''}
                            onChange={(e) => setVcard({ ...vcard, city: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 mb-1">COUNTRY</label>
                          <input
                            type="text"
                            value={vcard.country || ''}
                            onChange={(e) => setVcard({ ...vcard, country: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* URL Form */}
                  {activeType === 'url' && (
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">YOUR URL</label>
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://urls.uz/sherzod"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-white font-mono"
                      />
                    </div>
                  )}

                  {/* Text Form */}
                  {activeType === 'text' && (
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">YOUR TEXT</label>
                      <textarea
                        rows={3}
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-white resize-y"
                      />
                    </div>
                  )}

                  {/* Location Form */}
                  {activeType === 'location' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">LATITUDE</label>
                        <input
                          type="text"
                          value={location.latitude}
                          onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">LONGITUDE</label>
                        <input
                          type="text"
                          value={location.longitude}
                          onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* WiFi Form */}
                  {activeType === 'wifi' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">SSID</label>
                        <input
                          type="text"
                          value={wifi.ssid}
                          onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">PASSWORD</label>
                        <input
                          type="text"
                          value={wifi.password || ''}
                          onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">ENCRYPTION</label>
                        <select
                          value={wifi.encryption}
                          onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as any })}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white"
                        >
                          <option value="WPA">WPA/WPA2</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">no encryption</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Event Form */}
                  {activeType === 'event' && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">EVENT TITLE</label>
                      <input
                        type="text"
                        value={eventData.title}
                        onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white"
                      />
                    </div>
                  )}

                  {/* QR Code Frame Text Setting */}
                  <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase text-zinc-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>QR Kod Pastidagi Matn:</span>
                      </label>
                      <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setFrameStyle('none');
                            setFrameText('');
                          }}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            frameStyle === 'none' || !frameText.trim()
                              ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Matnsiz
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFrameStyle('bottom');
                            if (!frameText.trim()) setFrameText('VISIT LINK');
                          }}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            frameStyle === 'bottom' && Boolean(frameText.trim())
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Pastda
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFrameStyle('top');
                            if (!frameText.trim()) setFrameText('VISIT LINK');
                          }}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            frameStyle === 'top' && Boolean(frameText.trim())
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Tepada
                        </button>
                      </div>
                    </div>

                    {frameStyle !== 'none' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={frameText}
                          onChange={(e) => setFrameText(e.target.value)}
                          placeholder="VISIT LINK, SCAN ME, BIZNING SAYT..."
                          className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFrameText('');
                            setFrameStyle('none');
                          }}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-rose-400 transition-colors"
                          title="Matnni olib tashlash"
                        >
                          ✕ O‘chirish
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 bg-zinc-950 rounded-lg border border-dashed border-zinc-800 flex items-center justify-between text-xs">
                        <span className="text-zinc-500">QR kod ostidagi matn o‘chirilgan.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFrameStyle('bottom');
                            setFrameText('SCAN ME');
                          }}
                          className="text-indigo-400 hover:underline font-medium text-xs"
                        >
                          + Matn qo‘shish
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Set Colors */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setActivePane(activePane === 'colors' ? ('' as any) : 'colors')}
                className="w-full flex items-center justify-between p-3.5 bg-zinc-900/70 hover:bg-zinc-900 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Paintbrush className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-white">2. Set Colors</span>
                </div>
                <div className="text-zinc-400">
                  {activePane === 'colors' ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
              </button>

              {activePane === 'colors' && (
                <div className="p-4 border-t border-zinc-800 space-y-3">
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="lp_color_mode"
                        checked={colorMode === 'single'}
                        onChange={() => setColorMode('single')}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <span>Single Color</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="lp_color_mode"
                        checked={colorMode === 'gradient'}
                        onChange={() => setColorMode('gradient')}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <span>Color Gradient</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Foreground</span>
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                    {colorMode === 'gradient' ? (
                      <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-between">
                        <span className="text-xs text-zinc-400">Gradient 2</span>
                        <input
                          type="color"
                          value={gradientColor2}
                          onChange={(e) => setGradientColor2(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    ) : (
                      <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-between">
                        <span className="text-xs text-zinc-400">Background</span>
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: Add Logo Image */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setActivePane(activePane === 'logo' ? ('' as any) : 'logo')}
                className="w-full flex items-center justify-between p-3.5 bg-zinc-900/70 hover:bg-zinc-900 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-white">3. Add Logo Image</span>
                </div>
                <div className="text-zinc-400">
                  {activePane === 'logo' ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
              </button>

              {activePane === 'logo' && (
                <div className="p-4 border-t border-zinc-800 space-y-3.5">
                  {/* Tabs & Background Option */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setLogoTab('brands')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                          logoTab === 'brands' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Brendlar
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoTab('emojis')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                          logoTab === 'emojis' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Smile className="w-3 h-3 text-amber-400" />
                        <span>Emodzilar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoTab('upload')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                          logoTab === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Upload className="w-3 h-3 text-indigo-400" />
                        <span>Yuklash</span>
                      </button>
                    </div>

                    <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={removeBgBehindLogo}
                        onChange={(e) => setRemoveBgBehindLogo(e.target.checked)}
                        className="text-indigo-600 focus:ring-0 rounded"
                      />
                      <span>Fonni tozalash</span>
                    </label>
                  </div>

                  {/* TAB 1: BRANDS */}
                  {logoTab === 'brands' && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-1.5">
                      {/* NO ICON BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setCenterLogo('none');
                          setCenterEmoji(null);
                          setCustomLogoUrl(null);
                          setCustomEmojiInput('');
                        }}
                        className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                          centerLogo === 'none' && !centerEmoji && !customLogoUrl
                            ? 'bg-rose-500/15 border-rose-500/70 ring-1 ring-rose-400 text-rose-300'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Belgisiz toza QR"
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          <Ban className="w-4 h-4 text-rose-400" />
                        </div>
                        <span className="text-[9px] font-semibold truncate max-w-full">No Icon</span>
                      </button>

                      {/* BUILT-IN BRAND LOGOS */}
                      {Object.entries(BUILTIN_LOGOS).map(([key, item]) => {
                        const isSel = centerLogo === key && !customLogoUrl && !centerEmoji;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setCenterLogo(key);
                              setCenterEmoji(null);
                              setCustomLogoUrl(null);
                            }}
                            className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                              isSel
                                ? 'bg-zinc-800 border-zinc-600 ring-1 ring-white/20'
                                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div
                              className="w-5 h-5 flex items-center justify-center"
                              dangerouslySetInnerHTML={{ __html: item.svg }}
                            />
                            <span className="text-[9px] text-zinc-400 truncate max-w-full">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 2: PHONE EMOJIS */}
                  {logoTab === 'emojis' && (
                    <div className="space-y-3">
                      {/* Custom Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={customEmojiInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomEmojiInput(val);
                            if (val.trim()) {
                              setCenterEmoji(val.trim());
                              setCenterLogo('none');
                              setCustomLogoUrl(null);
                            } else {
                              setCenterEmoji(null);
                            }
                          }}
                          placeholder="Emodzi kiriting (masalan: 🚀, 😎, ⭐)..."
                          className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-lg select-none">
                          {centerEmoji || '🔲'}
                        </div>
                      </div>

                      {/* Category Pills */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {PHONE_EMOJI_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveEmojiCategory(cat.id)}
                            className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                              activeEmojiCategory === cat.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                            }`}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Emojis Grid */}
                      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-9 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCenterLogo('none');
                            setCenterEmoji(null);
                            setCustomLogoUrl(null);
                            setCustomEmojiInput('');
                          }}
                          className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all ${
                            centerLogo === 'none' && !centerEmoji && !customLogoUrl
                              ? 'bg-rose-500/15 border-rose-500/70 ring-1 ring-rose-400 text-rose-300'
                              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                          }`}
                          title="Belgisiz toza QR"
                        >
                          <Ban className="w-4 h-4 text-rose-400" />
                          <span className="text-[8px] font-semibold">No Icon</span>
                        </button>

                        {(
                          PHONE_EMOJI_CATEGORIES.find((c) => c.id === activeEmojiCategory)?.emojis ||
                          PHONE_EMOJI_CATEGORIES[0].emojis
                        ).map((emoji) => {
                          const isSel = centerEmoji === emoji;
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setCenterEmoji(emoji);
                                setCustomEmojiInput(emoji);
                                setCenterLogo('none');
                                setCustomLogoUrl(null);
                              }}
                              className={`p-2 rounded-lg border flex items-center justify-center text-xl transition-transform hover:scale-110 ${
                                isSel
                                  ? 'bg-indigo-600/25 border-indigo-500 ring-1 ring-indigo-400 scale-105'
                                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <span>{emoji}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: UPLOAD */}
                  {logoTab === 'upload' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Rasm tanlash</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        {customLogoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomLogoUrl(null);
                              setCenterLogo('none');
                              setCenterEmoji(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-950 text-rose-400 border border-zinc-800 rounded-lg text-xs hover:bg-zinc-900"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>O‘chirish</span>
                          </button>
                        )}
                      </div>

                      {customLogoUrl && (
                        <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800 inline-flex items-center gap-2">
                          <img
                            src={customLogoUrl}
                            alt="Custom logo"
                            className="w-10 h-10 object-contain rounded border border-zinc-700 p-0.5"
                          />
                          <span className="text-xs text-zinc-300">Maxsus rasm yuklandi</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accordion 4: Customize Design */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setActivePane(activePane === 'design' ? ('' as any) : 'design')}
                className="w-full flex items-center justify-between p-3.5 bg-zinc-900/70 hover:bg-zinc-900 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-white">4. Customize Design</span>
                </div>
                <div className="text-zinc-400">
                  {activePane === 'design' ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
              </button>

              {activePane === 'design' && (
                <div className="p-4 border-t border-zinc-800 space-y-3">
                  <div>
                    <span className="block text-[10px] font-mono text-zinc-400 mb-1.5">BODY SHAPE:</span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {[
                        { id: 'square' as const, label: 'Square' },
                        { id: 'dots' as const, label: 'Dots' },
                        { id: 'rounded' as const, label: 'Rounded' },
                        { id: 'diamond' as const, label: 'Diamond' },
                        { id: 'mosaic' as const, label: 'Mosaic' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBodyShape(item.id)}
                          className={`py-1.5 px-2 text-[11px] rounded border text-center transition-all ${
                            bodyShape === item.id
                              ? 'bg-zinc-800 text-white border-zinc-600'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Sticky Preview Console (4 cols) */}
          <div className="lg:col-span-4 sticky top-24 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl flex flex-col items-center">
            
            {/* Resolution Slider Bar */}
            <div className="w-full mb-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>Low Quality</span>
                <span className="text-white font-semibold">{resolution} x {resolution} Px</span>
                <span>High Quality</span>
              </div>
              <input
                type="range"
                min="300"
                max="2000"
                step="100"
                value={resolution}
                onChange={(e) => setResolution(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-zinc-950 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Live Canvas */}
            <QrCanvas
              value={activePayload}
              size={220}
              exportResolution={resolution}
              fgColor={fgColor}
              gradientColor2={gradientColor2}
              colorMode={colorMode}
              gradientType={gradientType}
              customEyeColor={customEyeColor}
              eyeFrameColor={eyeFrameColor}
              eyeBallColor={eyeBallColor}
              bgColor={bgColor}
              bodyShape={bodyShape}
              eyeFrameShape={eyeFrameShape}
              eyeBallShape={eyeBallShape}
              centerLogo={centerLogo}
              centerEmoji={centerEmoji}
              customLogoUrl={customLogoUrl}
              removeBgBehindLogo={removeBgBehindLogo}
              frameText={frameText}
              frameStyle={frameStyle}
              showControls={true}
              errorLevel={activePayload.length > 200 ? 'M' : 'Q'}
            />

            {/* Quick Frame Text Controller */}
            <div className="w-full mt-3 p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-300 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span>Pastdagi Matn:</span>
                </span>
                <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setFrameStyle('none');
                      setFrameText('');
                    }}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      frameStyle === 'none' || !frameText.trim()
                        ? 'bg-rose-500/20 text-rose-300 font-semibold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Matnsiz
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFrameStyle('bottom');
                      if (!frameText.trim()) setFrameText('VISIT LINK');
                    }}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      frameStyle === 'bottom' && Boolean(frameText.trim())
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Pastda
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFrameStyle('top');
                      if (!frameText.trim()) setFrameText('VISIT LINK');
                    }}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      frameStyle === 'top' && Boolean(frameText.trim())
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Tepada
                  </button>
                </div>
              </div>

              {frameStyle !== 'none' ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={frameText}
                    onChange={(e) => setFrameText(e.target.value)}
                    placeholder="Matn (masalan: VISIT LINK)"
                    className="flex-1 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                  {frameText && (
                    <button
                      type="button"
                      onClick={() => {
                        setFrameText('');
                        setFrameStyle('none');
                      }}
                      className="px-2 py-1 text-[11px] text-zinc-400 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors whitespace-nowrap"
                      title="Matnni olib tashlash"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-0.5 text-center">
                  <span className="text-[10px] text-zinc-500">Matnsiz toza kvadrat. </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFrameStyle('bottom');
                      setFrameText('SCAN ME');
                    }}
                    className="text-[10px] text-indigo-400 hover:underline font-medium"
                  >
                    + Matn qo‘shish
                  </button>
                </div>
              )}
            </div>

            {/* Create QR Code Button */}
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs uppercase tracking-wider shadow transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Create QR Code</span>
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
