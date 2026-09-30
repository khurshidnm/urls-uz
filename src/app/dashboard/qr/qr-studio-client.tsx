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
  Mail,
  Phone,
  MessageSquare,
  UserCheck,
  MapPin,
  Wifi,
  Calendar,
  ChevronDown,
  ChevronUp,
  Paintbrush,
  Image as ImageIcon,
  QrCode,
  Sparkles,
  RotateCcw,
  Sliders,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Compass,
  Check,
  Plus,
  Minus,
  Ban,
  Smile,
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
import { useToast } from '@/components/ui/toast';

interface Props {
  links: any[];
}

export default function QrStudioClient({ links }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Active Category Type (QRCode Monkey top tabs)
  const [activeType, setActiveType] = useState<QrDataType>('vcard');

  // Accordion active pane: 'content' | 'colors' | 'logo' | 'design'
  const [activePane, setActivePane] = useState<'content' | 'colors' | 'logo' | 'design'>('content');

  // Quality resolution slider (300 to 2000px)
  const [resolution, setResolution] = useState<number>(1000);

  // Content State: URL
  const [urlMode, setUrlMode] = useState<'existing' | 'custom'>('custom');
  const [selectedLinkSlug, setSelectedLinkSlug] = useState(links[0]?.slug || '');
  const [customUrl, setCustomUrl] = useState('https://urls.uz/sherzod');

  // Content State: vCard (All 16 QRCode Monkey fields)
  const [vcard, setVcard] = useState<VCardPayload>(QR_SAMPLE_DATA.vcard);

  // Content State: Text
  const [textContent, setTextContent] = useState<string>(QR_SAMPLE_DATA.text);

  // Content State: WiFi
  const [wifi, setWifi] = useState<WifiPayload>(QR_SAMPLE_DATA.wifi);
  const [showWifiPass, setShowWifiPass] = useState(false);

  // Content State: Location
  const [location, setLocation] = useState<LocationPayload>(QR_SAMPLE_DATA.location);
  const [isLocating, setIsLocating] = useState(false);

  // Content State: Event
  const [eventData, setEventData] = useState<EventPayload>(QR_SAMPLE_DATA.event);

  // Pane 2: Colors
  const [colorMode, setColorMode] = useState<ColorMode>('single');
  const [fgColor, setFgColor] = useState('#0f172a');
  const [gradientColor2, setGradientColor2] = useState('#4f46e5');
  const [gradientType, setGradientType] = useState<GradientType>('linear');
  const [customEyeColor, setCustomEyeColor] = useState(false);
  const [eyeFrameColor, setEyeFrameColor] = useState('#0f172a');
  const [eyeBallColor, setEyeBallColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');

  // Pane 3: Logo & Phone Emojis
  const [centerLogo, setCenterLogo] = useState<string>('vcard');
  const [centerEmoji, setCenterEmoji] = useState<string | null>(null);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [removeBgBehindLogo, setRemoveBgBehindLogo] = useState(true);
  const [logoTab, setLogoTab] = useState<'brands' | 'emojis' | 'upload'>('brands');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('popular');

  // Pane 4: Customize Design
  const [bodyShape, setBodyShape] = useState<BodyShape>('square');
  const [eyeFrameShape, setEyeFrameShape] = useState<EyeFrameShape>('square');
  const [eyeBallShape, setEyeBallShape] = useState<EyeBallShape>('square');

  // Frame Callout
  const [frameText, setFrameText] = useState('SAVE CONTACT');
  const [frameStyle, setFrameStyle] = useState<'bottom' | 'top' | 'none'>('bottom');

  // Refresh trigger when user clicks "Create QR Code"
  const [renderNonce, setRenderNonce] = useState(0);

  // Type Switch Handler
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

  // Compute live encoded payload value
  const activePayload = useMemo(() => {
    switch (activeType) {
      case 'url': {
        if (urlMode === 'existing') {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://urls.uz';
          return `${origin}/${selectedLinkSlug || 'telegram'}`;
        }
        return customUrl || 'https://urls.uz';
      }
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
  }, [activeType, urlMode, selectedLinkSlug, customUrl, vcard, wifi, location, eventData, textContent, renderNonce]);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Fayl hajmi 2 MB dan oshmasligi kerak');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setCustomLogoUrl(uploadEvent.target?.result as string);
      setCenterLogo('custom');
      showToast('success', 'Maxsus logotip yuklandi');
    };
    reader.readAsDataURL(file);
  };

  // Browser Geolocation Detector
  const handleDetectLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('error', 'Brauzeringiz geolokatsiyani qo‘llab-quvvatlamaydi');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
          addressSearch: 'Mening joriy joylashuvim',
        }));
        setIsLocating(false);
        showToast('success', 'Joylashuvingiz muvaffaqiyatli aniqlandi');
      },
      (err) => {
        setIsLocating(false);
        showToast('error', 'Joylashuvni aniqlab bo‘lmadi: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-400" />
            <span>{t.qrStudio}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            QRCode Monkey texnologiyasiga asoslangan professional vCard, Wi-Fi, joylashuv va brendli QR-kodlar yaratish tizimi
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>SPEC V3.0 · REED-SOLOMON ERROR CORRECTION</span>
        </div>
      </div>

      {/* Top Type Bar (QRCode Monkey Navigation Tabs) */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto scrollbar-none shadow-sm">
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

      {/* 2-Column Workspace: Left Accordions (8 cols), Right Sticky Console (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: 4 Accordion Panes */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* PANE 1: ENTER CONTENT */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setActivePane(activePane === 'content' ? ('' as any) : 'content')}
              className="w-full flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900/90 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">1. Enter Content</h3>
                  <p className="text-[11px] text-zinc-400">
                    {activeType === 'vcard' && 'vCard 2.1 / 3.0 to‘liq kontakt maydonlari'}
                    {activeType === 'url' && 'Havola yoki veb-sayt manzili'}
                    {activeType === 'wifi' && 'Wi-Fi tarmoq nomi va xavfsizlik paroli'}
                    {activeType === 'location' && 'Geografik koordinatalar va manzil'}
                    {activeType === 'event' && 'Kalendarga kiritiladigan tadbir tafsilotlari'}
                    {activeType === 'text' && 'Xom matn yoki xabar'}
                  </p>
                </div>
              </div>
              <div className="text-zinc-400">
                {activePane === 'content' ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
            </button>

            {activePane === 'content' && (
              <div className="p-5 border-t border-zinc-800 space-y-5">
                
                {/* 1.1 VCARD FORM (Matching QRCode Monkey #vcard Byte-by-Byte) */}
                {activeType === 'vcard' && (
                  <div className="space-y-4">
                    {/* Version Selector & Reset */}
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-zinc-400 font-medium">Format Version:</span>
                        <label className="flex items-center gap-1.5 text-zinc-200 cursor-pointer">
                          <input
                            type="radio"
                            name="vcard_version"
                            checked={vcard.version === '2.1'}
                            onChange={() => setVcard({ ...vcard, version: '2.1' })}
                            className="text-indigo-600 focus:ring-0"
                          />
                          <span>Version 2.1</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-zinc-200 cursor-pointer">
                          <input
                            type="radio"
                            name="vcard_version"
                            checked={vcard.version === '3.0'}
                            onChange={() => setVcard({ ...vcard, version: '3.0' })}
                            className="text-indigo-600 focus:ring-0"
                          />
                          <span>Version 3.0 (Recommended)</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => setVcard(QR_SAMPLE_DATA.vcard)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Namunani to‘ldirish</span>
                      </button>
                    </div>

                    {/* 3-Column Responsive Grid matching QRCode Monkey */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Firstname *</label>
                        <input
                          type="text"
                          value={vcard.firstName}
                          onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                          placeholder="Sherzod"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Lastname</label>
                        <input
                          type="text"
                          value={vcard.lastName}
                          onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                          placeholder="Qosimov"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Organization</label>
                        <input
                          type="text"
                          value={vcard.organization || ''}
                          onChange={(e) => setVcard({ ...vcard, organization: e.target.value })}
                          placeholder="FinTech Lab"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Position (Work)</label>
                        <input
                          type="text"
                          value={vcard.jobTitle || ''}
                          onChange={(e) => setVcard({ ...vcard, jobTitle: e.target.value })}
                          placeholder="Senior Software Architect"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Phone (Work)</label>
                        <input
                          type="tel"
                          value={vcard.phoneWork || ''}
                          onChange={(e) => setVcard({ ...vcard, phoneWork: e.target.value })}
                          placeholder="+998 71 200 00 00"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Phone (Private)</label>
                        <input
                          type="tel"
                          value={vcard.phonePrivate || ''}
                          onChange={(e) => setVcard({ ...vcard, phonePrivate: e.target.value })}
                          placeholder="+998 71 234 56 78"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Phone (Mobile) *</label>
                        <input
                          type="tel"
                          value={vcard.phoneMobile || ''}
                          onChange={(e) => setVcard({ ...vcard, phoneMobile: e.target.value })}
                          placeholder="+998 90 123 45 67"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Fax (Work)</label>
                        <input
                          type="tel"
                          value={vcard.faxWork || ''}
                          onChange={(e) => setVcard({ ...vcard, faxWork: e.target.value })}
                          placeholder="+998 71 200 00 01"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Fax (Private)</label>
                        <input
                          type="tel"
                          value={vcard.faxPrivate || ''}
                          onChange={(e) => setVcard({ ...vcard, faxPrivate: e.target.value })}
                          placeholder=""
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Email</label>
                        <input
                          type="email"
                          value={vcard.email || ''}
                          onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                          placeholder="sherzod@urls.uz"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Website</label>
                        <input
                          type="text"
                          value={vcard.website || ''}
                          onChange={(e) => setVcard({ ...vcard, website: e.target.value })}
                          placeholder="https://urls.uz/sherzod"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Street</label>
                        <input
                          type="text"
                          value={vcard.street || ''}
                          onChange={(e) => setVcard({ ...vcard, street: e.target.value })}
                          placeholder="Amir Temur shoh ko‘chasi 107"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Zipcode</label>
                        <input
                          type="text"
                          value={vcard.zipCode || ''}
                          onChange={(e) => setVcard({ ...vcard, zipCode: e.target.value })}
                          placeholder="100084"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">City</label>
                        <input
                          type="text"
                          value={vcard.city || ''}
                          onChange={(e) => setVcard({ ...vcard, city: e.target.value })}
                          placeholder="Toshkent"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">State / Region</label>
                        <input
                          type="text"
                          value={vcard.state || ''}
                          onChange={(e) => setVcard({ ...vcard, state: e.target.value })}
                          placeholder="Toshkent shahri"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Country</label>
                        <input
                          type="text"
                          value={vcard.country || ''}
                          onChange={(e) => setVcard({ ...vcard, country: e.target.value })}
                          placeholder="O‘zbekiston"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 1.2 URL FORM */}
                {activeType === 'url' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setUrlMode('custom')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          urlMode === 'custom'
                            ? 'bg-zinc-800 text-white border-zinc-600'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        Ixtiyoriy URL Manzil
                      </button>
                      <button
                        type="button"
                        onClick={() => setUrlMode('existing')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          urlMode === 'existing'
                            ? 'bg-zinc-800 text-white border-zinc-600'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        Mening qisqa havolalarimdan
                      </button>
                    </div>

                    {urlMode === 'custom' ? (
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Your URL</label>
                        <input
                          type="url"
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                          placeholder="https://urls.uz/sherzod"
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Select Short Link</label>
                        <select
                          value={selectedLinkSlug}
                          onChange={(e) => setSelectedLinkSlug(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        >
                          {links.map((l) => (
                            <option key={l.id} value={l.slug}>
                              {l.title} (urls.uz/{l.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* 1.3 TEXT FORM */}
                {activeType === 'text' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono uppercase text-zinc-400 flex items-center justify-between">
                      <span>Your Text</span>
                      <span>{textContent.length} characters</span>
                    </label>
                    <textarea
                      rows={4}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Enter your plain text message..."
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 resize-y"
                    />
                  </div>
                )}

                {/* 1.4 LOCATION (MAPS) FORM */}
                {activeType === 'location' && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase text-zinc-400">Search Your Address</label>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isLocating}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                        <span>{isLocating ? 'Aniqlanmoqda...' : 'Joriy joylashuvim'}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={location.addressSearch || ''}
                      onChange={(e) => setLocation({ ...location, addressSearch: e.target.value })}
                      placeholder="e.g. Amir Temur Xiyoboni, Toshkent..."
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Latitude</label>
                        <input
                          type="text"
                          value={location.latitude}
                          onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                          placeholder="41.311081"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Longitude</label>
                        <input
                          type="text"
                          value={location.longitude}
                          onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                          placeholder="69.240562"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 1.5 WIFI FORM */}
                {activeType === 'wifi' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Wireless SSID</label>
                      <input
                        type="text"
                        value={wifi.ssid}
                        onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                        placeholder="MyHome_WiFi"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showWifiPass ? 'text' : 'password'}
                          value={wifi.password || ''}
                          onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                          placeholder="Password"
                          className="w-full pl-3 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowWifiPass(!showWifiPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          {showWifiPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Encryption</label>
                      <select
                        value={wifi.encryption}
                        onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as any })}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                      >
                        <option value="WPA">WPA/WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">no encryption</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 1.6 EVENT FORM */}
                {activeType === 'event' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Event Title</label>
                      <input
                        type="text"
                        value={eventData.title}
                        onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                        placeholder="Tashkent Tech Summit 2026"
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Event Location</label>
                        <input
                          type="text"
                          value={eventData.location || ''}
                          onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                          placeholder="Hilton Tashkent City"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">Start Time</label>
                        <input
                          type="datetime-local"
                          value={`${eventData.startDate}T${eventData.startTime}`}
                          onChange={(e) => {
                            const [d, t] = e.target.value.split('T');
                            setEventData({ ...eventData, startDate: d || '', startTime: t || '10:00' });
                          }}
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">End Time</label>
                        <input
                          type="datetime-local"
                          value={`${eventData.endDate}T${eventData.endTime}`}
                          onChange={(e) => {
                            const [d, t] = e.target.value.split('T');
                            setEventData({ ...eventData, endDate: d || '', endTime: t || '18:00' });
                          }}
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code Frame Text Setting (For all content types) */}
                <div className="pt-4 border-t border-zinc-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase text-zinc-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>QR Kod Pastidagi Matn (Frame Text):</span>
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
                        Matnsiz (None)
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
                        Pastda (Bottom)
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
                        Tepada (Top)
                      </button>
                    </div>
                  </div>

                  {frameStyle !== 'none' ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={frameText}
                          onChange={(e) => setFrameText(e.target.value)}
                          placeholder="VISIT LINK, SCAN ME, BIZNING SAYT..."
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFrameText('');
                          setFrameStyle('none');
                        }}
                        className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-rose-400 transition-colors"
                        title="Matnni olib tashlash"
                      >
                        ✕ O‘chirish
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-zinc-950 rounded-lg border border-dashed border-zinc-800 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">QR kod ostidagi matn o‘chirilgan (toza kvadrat).</span>
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

                  {/* Preset Quick Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-zinc-500 font-mono">Namunalar:</span>
                    {['SCAN ME', 'VISIT LINK', 'SAVE CONTACT', 'CONNECT WI-FI', 'OPEN MAP'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setFrameText(preset);
                          setFrameStyle('bottom');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                          frameText === preset && frameStyle !== 'none'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFrameText('');
                        setFrameStyle('none');
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono border border-zinc-800 bg-zinc-950 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40"
                    >
                      ⊘ Matnsiz
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* PANE 2: SET COLORS */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setActivePane(activePane === 'colors' ? ('' as any) : 'colors')}
              className="w-full flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900/90 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Paintbrush className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">2. Set Colors</h3>
                  <p className="text-[11px] text-zinc-400">Single color, Linear/Radial gradient va ko‘zlar rangi</p>
                </div>
              </div>
              <div className="text-zinc-400">
                {activePane === 'colors' ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
            </button>

            {activePane === 'colors' && (
              <div className="p-5 border-t border-zinc-800 space-y-5">
                {/* Foreground Mode Radio */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-mono uppercase text-zinc-400">Foreground Color</label>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 text-zinc-200 cursor-pointer">
                      <input
                        type="radio"
                        name="color_mode"
                        checked={colorMode === 'single'}
                        onChange={() => setColorMode('single')}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <span>Single Color</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-zinc-200 cursor-pointer">
                      <input
                        type="radio"
                        name="color_mode"
                        checked={colorMode === 'gradient'}
                        onChange={() => setColorMode('gradient')}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <span>Color Gradient</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-zinc-200 cursor-pointer ml-auto">
                      <input
                        type="checkbox"
                        checked={customEyeColor}
                        onChange={(e) => setCustomEyeColor(e.target.checked)}
                        className="text-indigo-600 focus:ring-0 rounded"
                      />
                      <span>Custom Eye Color</span>
                    </label>
                  </div>
                </div>

                {/* Color Pickers */}
                {colorMode === 'single' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-300">Asosiy Rang (Body)</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={fgColor}
                          onChange={(e) => setFgColor(e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono text-zinc-200 uppercase">{fgColor}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-300">Orqa Fon (Background)</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono text-zinc-200 uppercase">{bgColor}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-300">Gradient 1</span>
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-300">Gradient 2</span>
                      <input
                        type="color"
                        value={gradientColor2}
                        onChange={(e) => setGradientColor2(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-300">Turi</span>
                      <select
                        value={gradientType}
                        onChange={(e) => setGradientType(e.target.value as any)}
                        className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded px-2 py-1"
                      >
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Custom Eye Colors if Enabled */}
                {customEyeColor && (
                  <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-300">Eye Frame Color</span>
                      <input
                        type="color"
                        value={eyeFrameColor}
                        onChange={(e) => setEyeFrameColor(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-300">Eye Ball Color</span>
                      <input
                        type="color"
                        value={eyeBallColor}
                        onChange={(e) => setEyeBallColor(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PANE 3: ADD LOGO IMAGE */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setActivePane(activePane === 'logo' ? ('' as any) : 'logo')}
              className="w-full flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900/90 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">3. Add Logo Image</h3>
                  <p className="text-[11px] text-zinc-400">
                    Belgisiz, rasmiy brend logotiplari yoki telefondagi emojilar bilan bezang
                  </p>
                </div>
              </div>
              <div className="text-zinc-400">
                {activePane === 'logo' ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
            </button>

            {activePane === 'logo' && (
              <div className="p-5 border-t border-zinc-800 space-y-4">
                {/* Logo Category Tabs & Background Option */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setLogoTab('brands')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        logoTab === 'brands'
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Brend Logotiplar
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoTab('emojis')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        logoTab === 'emojis'
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Smile className="w-3.5 h-3.5 text-amber-400" />
                      <span>Telefon Emodzilari</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoTab('upload')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        logoTab === 'upload'
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Rasm Yuklash</span>
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={removeBgBehindLogo}
                      onChange={(e) => setRemoveBgBehindLogo(e.target.checked)}
                      className="text-indigo-600 focus:ring-0 rounded"
                    />
                    <span>Belgi orqasidagi fonni tozalash</span>
                  </label>
                </div>

                {/* TAB 1: BRAND LOGOS */}
                {logoTab === 'brands' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase text-zinc-400">
                        Brend logotipi yoki "No Icon" ni tanlang:
                      </span>
                      {centerLogo === 'none' && !centerEmoji && !customLogoUrl && (
                        <span className="text-[11px] text-rose-400 font-mono flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Belgi yo‘q (Toza QR)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2">
                      {/* NO ICON BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          setCenterLogo('none');
                          setCenterEmoji(null);
                          setCustomLogoUrl(null);
                          setCustomEmojiInput('');
                        }}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                          centerLogo === 'none' && !centerEmoji && !customLogoUrl
                            ? 'bg-rose-500/15 border-rose-500/70 ring-2 ring-rose-500/40 text-rose-300'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Belgisiz toza QR kod"
                      >
                        <div className="w-6 h-6 flex items-center justify-center">
                          <Ban className="w-5 h-5 text-rose-400" />
                        </div>
                        <span className="text-[10px] font-semibold truncate max-w-full">No Icon</span>
                      </button>

                      {/* BUILT-IN LOGOS */}
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
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                              isSel
                                ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-400/50'
                                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div
                              className="w-6 h-6 flex items-center justify-center"
                              dangerouslySetInnerHTML={{ __html: item.svg }}
                            />
                            <span className="text-[10px] text-zinc-400 truncate max-w-full">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: PHONE EMOJIS */}
                {logoTab === 'emojis' && (
                  <div className="space-y-4">
                    {/* Custom Emoji Input Box */}
                    <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                          <Smile className="w-3.5 h-3.5 text-amber-400" />
                          <span>Telefondan yoki klaviaturadan istalgan emodzini kiriting:</span>
                        </label>
                        {centerEmoji && (
                          <button
                            type="button"
                            onClick={() => {
                              setCenterEmoji(null);
                              setCustomEmojiInput('');
                            }}
                            className="text-[11px] text-zinc-400 hover:text-rose-400"
                          >
                            Tozalash
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
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
                            placeholder="Masalan: 🚀, 😎, 👑, 🔥, 🏆..."
                            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-base focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600 placeholder:text-xs"
                          />
                        </div>

                        {/* Direct Display Badge */}
                        <div className="w-11 h-11 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl select-none">
                          {centerEmoji || '🔲'}
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Smartfoningiz emodzi klaviaturasidan (iOS / Android) to‘g‘ridan-to‘g‘ri nusxalab qo‘yishingiz mumkin.
                      </p>
                    </div>

                    {/* Emoji Category Switcher */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {PHONE_EMOJI_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setActiveEmojiCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            activeEmojiCategory === cat.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Emoji Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-9 gap-2">
                      {/* NO ICON BUTTON IN EMOJI TAB */}
                      <button
                        type="button"
                        onClick={() => {
                          setCenterLogo('none');
                          setCenterEmoji(null);
                          setCustomLogoUrl(null);
                          setCustomEmojiInput('');
                        }}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          centerLogo === 'none' && !centerEmoji && !customLogoUrl
                            ? 'bg-rose-500/15 border-rose-500/70 ring-2 ring-rose-500/40 text-rose-300'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Belgisiz toza QR kod"
                      >
                        <Ban className="w-5 h-5 text-rose-400" />
                        <span className="text-[9px] font-semibold">No Icon</span>
                      </button>

                      {/* EMOJIS FROM ACTIVE CATEGORY */}
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
                            className={`p-2.5 rounded-xl border flex items-center justify-center text-2xl transition-transform hover:scale-110 active:scale-95 ${
                              isSel
                                ? 'bg-indigo-600/25 border-indigo-500 ring-2 ring-indigo-400/50 scale-105'
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

                {/* TAB 3: UPLOAD IMAGE */}
                {logoTab === 'upload' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Fayl tanlash (.png, .svg, .jpg, .webp)</span>
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
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 rounded-xl text-xs font-medium transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Yuklangan rasmni o‘chirish</span>
                        </button>
                      )}
                    </div>

                    {customLogoUrl && (
                      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 inline-flex items-center gap-3">
                        <img
                          src={customLogoUrl}
                          alt="Custom logo"
                          className="w-12 h-12 object-contain rounded-lg border border-zinc-700 bg-white/5 p-1"
                        />
                        <div className="text-xs">
                          <p className="font-medium text-white">Yuklangan maxsus rasm faol</p>
                          <p className="text-[11px] text-zinc-400">QR kod markazida aks etadi</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PANE 4: CUSTOMIZE DESIGN (Body Shape, Eye Frame, Eye Ball) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setActivePane(activePane === 'design' ? ('' as any) : 'design')}
              className="w-full flex items-center justify-between p-4 bg-zinc-900/60 hover:bg-zinc-900/90 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">4. Customize Design</h3>
                  <p className="text-[11px] text-zinc-400">Body shape, eye frame shape va eye ball shape shakllari</p>
                </div>
              </div>
              <div className="text-zinc-400">
                {activePane === 'design' ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
            </button>

            {activePane === 'design' && (
              <div className="p-5 border-t border-zinc-800 space-y-5">
                
                {/* 4.1 Body Shape */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-2">Body Shape</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'square' as const, label: 'Square' },
                      { id: 'dots' as const, label: 'Dots (Circles)' },
                      { id: 'rounded' as const, label: 'Rounded' },
                      { id: 'diamond' as const, label: 'Diamond' },
                      { id: 'mosaic' as const, label: 'Mosaic' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setBodyShape(item.id)}
                        className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                          bodyShape === item.id
                            ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4.2 Eye Frame Shape */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-2">Eye Frame Shape</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'square' as const, label: 'Square' },
                      { id: 'rounded' as const, label: 'Rounded' },
                      { id: 'circle' as const, label: 'Circle' },
                      { id: 'leaf' as const, label: 'Leaf (Asymmetric)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEyeFrameShape(item.id)}
                        className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                          eyeFrameShape === item.id
                            ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4.3 Eye Ball Shape */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-2">Eye Ball Shape</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'square' as const, label: 'Square' },
                      { id: 'circle' as const, label: 'Circle' },
                      { id: 'rounded' as const, label: 'Rounded' },
                      { id: 'diamond' as const, label: 'Diamond' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEyeBallShape(item.id)}
                        className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                          eyeBallShape === item.id
                            ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4.4 Frame Callout Text */}
                <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase text-zinc-400">Callout Frame Text</label>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setFrameStyle('bottom')}
                        className={`px-2 py-0.5 rounded ${frameStyle === 'bottom' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                      >
                        Bottom
                      </button>
                      <button
                        type="button"
                        onClick={() => setFrameStyle('none')}
                        className={`px-2 py-0.5 rounded ${frameStyle === 'none' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                      >
                        None
                      </button>
                    </div>
                  </div>
                  {frameStyle !== 'none' && (
                    <input
                      type="text"
                      value={frameText}
                      onChange={(e) => setFrameText(e.target.value)}
                      placeholder="SCAN ME"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono uppercase focus:outline-none focus:border-zinc-600"
                    />
                  )}
                </div>

              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: QRCode Monkey Sticky Preview & Action Console */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 shadow-2xl flex flex-col items-center">
            
            {/* Resolution Slider Bar */}
            <div className="w-full mb-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
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
                className="w-full accent-indigo-500 bg-zinc-950 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Canvas Component */}
            <QrCanvas
              value={activePayload}
              size={240}
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

            {/* Quick Frame Text Controller (Directly under preview) */}
            <div className="w-full mt-3 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Pastdagi Matn (Frame):</span>
                </span>
                <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setFrameStyle('none');
                      setFrameText('');
                    }}
                    className={`px-2 py-0.5 rounded transition-all ${
                      frameStyle === 'none' || !frameText.trim()
                        ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
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
                    className={`px-2 py-0.5 rounded transition-all ${
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
                    className={`px-2 py-0.5 rounded transition-all ${
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
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={frameText}
                    onChange={(e) => setFrameText(e.target.value)}
                    placeholder="Matn (masalan: VISIT LINK)"
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                  {frameText && (
                    <button
                      type="button"
                      onClick={() => {
                        setFrameText('');
                        setFrameStyle('none');
                      }}
                      className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors whitespace-nowrap"
                      title="Matnni olib tashlash"
                    >
                      ✕ O‘chirish
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-1 text-center">
                  <span className="text-[11px] text-zinc-500">QR kod matnsiz (toza kvadrat). </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFrameStyle('bottom');
                      setFrameText('SCAN ME');
                    }}
                    className="text-[11px] text-indigo-400 hover:underline font-medium"
                  >
                    + Matn qo‘shish
                  </button>
                </div>
              )}
            </div>

            {/* Create QR Code Primary Button */}
            <button
              type="button"
              onClick={() => setRenderNonce((n) => n + 1)}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Create QR Code</span>
            </button>

            <div className="mt-4 text-center">
              <span className="text-[11px] text-zinc-500">
                100% bepul vektor va raster yuklab olish. Chop etilgandan so‘ng barcha smartfonlarda ochiladi.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
