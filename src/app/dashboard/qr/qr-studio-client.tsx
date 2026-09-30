'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, FileText, Image as ImageIcon, Link2, MapPin, Paintbrush, QrCode, Sliders, UserCheck, Wifi } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/components/ui/toast';
import { shortUrl } from '@/lib/utils';
import type { ClientLink } from '@/lib/client-types';
import {
  QR_SAMPLE_DATA,
  generateEventString,
  generateLocationString,
  generateVCardString,
  generateWifiString,
  type EventPayload,
  type LocationPayload,
  type QrDataType,
  type VCardPayload,
  type WifiPayload,
} from '@/lib/qr-payloads';
import StudioPane from './studio-pane';
import { EventForm, LocationForm, TextForm, VCardForm, WifiForm } from './content-forms';
import { ColorsPane, LogoPane, ShapesPane } from './design-panes';
import QrPreviewPanel, { type PreviewMode } from './qr-preview-panel';
import { DEFAULT_DESIGN, designFrom, type QrDesign } from './qr-design';

interface Props {
  links: ClientLink[];
  /** Open the studio on this link (from /dashboard/qr?link=...). */
  initialLinkId: string | null;
  canWrite: boolean;
}

const TYPES = [
  { id: 'url' as const, label: 'Havola', icon: Link2 },
  { id: 'text' as const, label: 'Matn', icon: FileText },
  { id: 'vcard' as const, label: 'vCard', icon: UserCheck },
  { id: 'location' as const, label: 'Joylashuv', icon: MapPin },
  { id: 'wifi' as const, label: 'Wi-Fi', icon: Wifi },
  { id: 'event' as const, label: 'Tadbir', icon: Calendar },
];

/** Suggested logo and frame text for each content type. */
const TYPE_DEFAULTS: Record<QrDataType, Pick<QrDesign, 'centerLogo' | 'frameText'>> = {
  url: { centerLogo: 'globe', frameText: 'SCAN ME' },
  text: { centerLogo: 'none', frameText: 'READ ME' },
  vcard: { centerLogo: 'vcard', frameText: 'SAVE CONTACT' },
  location: { centerLogo: 'location', frameText: 'OPEN MAP' },
  wifi: { centerLogo: 'wifi', frameText: 'CONNECT WI-FI' },
  event: { centerLogo: 'event', frameText: 'ADD EVENT' },
};

type Pane = 'content' | 'colors' | 'logo' | 'design';

export default function QrStudioClient({ links: initialLinks, initialLinkId, canWrite }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [links, setLinks] = useState(initialLinks);
  const initialLink = initialLinks.find((l) => l.id === initialLinkId);

  const [activeType, setActiveType] = useState<QrDataType>('url');
  const [activePane, setActivePane] = useState<Pane | null>('content');
  const [resolution, setResolution] = useState(1000);

  // Content
  const [urlMode, setUrlMode] = useState<'existing' | 'custom'>(initialLink || links.length > 0 ? 'existing' : 'custom');
  const [selectedLinkId, setSelectedLinkId] = useState(initialLink?.id ?? links[0]?.id ?? '');
  const [customUrl, setCustomUrl] = useState('');
  const [vcard, setVcard] = useState<VCardPayload>(QR_SAMPLE_DATA.vcard);
  const [textContent, setTextContent] = useState(QR_SAMPLE_DATA.text);
  const [wifi, setWifi] = useState<WifiPayload>(QR_SAMPLE_DATA.wifi);
  const [location, setLocation] = useState<LocationPayload>(QR_SAMPLE_DATA.location);
  const [isLocating, setIsLocating] = useState(false);
  const [eventData, setEventData] = useState<EventPayload>(QR_SAMPLE_DATA.event);

  // Design (for a link: its saved design)
  const selectedLink = links.find((l) => l.id === selectedLinkId);
  const [design, setDesign] = useState<QrDesign>(() => (initialLink ?? selectedLink ? designFrom((initialLink ?? selectedLink)!.qr_config) : DEFAULT_DESIGN));
  const update = (patch: Partial<QrDesign>) => setDesign((d) => ({ ...d, ...patch }));
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  const linkMode = activeType === 'url' && urlMode === 'existing' && selectedLink;

  const payload = useMemo(() => {
    switch (activeType) {
      case 'url':
        if (urlMode === 'existing') return selectedLink ? shortUrl(selectedLink.slug) : 'https://urls.uz';
        return customUrl.trim() || 'https://urls.uz';
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
    }
  }, [activeType, urlMode, selectedLink, customUrl, vcard, wifi, location, eventData, textContent]);

  const selectType = (type: QrDataType) => {
    setActiveType(type);
    setActivePane('content');
    const defaults = TYPE_DEFAULTS[type];
    update({ centerLogo: defaults.centerLogo, centerEmoji: null, frameText: design.frameStyle === 'none' ? '' : defaults.frameText });
  };

  const selectLink = (id: string) => {
    setSelectedLinkId(id);
    const link = links.find((l) => l.id === id);
    if (link) setDesign(designFrom(link.qr_config));
  };

  const demoRestricted = () => window.dispatchEvent(new CustomEvent('open-demo-restriction', { detail: { actionTitle: 'QR dizaynini saqlash' } }));

  const saveToLink = async (link: ClientLink, successMessage: string) => {
    const res = await fetch(`/api/links/${link.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_config: design }),
    });
    const data = await res.json();
    if (!data.success) {
      showToast('error', data.error || 'Saqlashda xatolik');
      return;
    }
    setLinks((all) => all.map((l) => (l.id === link.id ? data.link : l)));
    showToast('success', successMessage);
  };

  const handleSave = async () => {
    if (!selectedLink) return;
    if (!canWrite) return demoRestricted();
    setSaving(true);
    try {
      await saveToLink(selectedLink, 'QR dizayn havolaga saqlandi');
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  /** Turns the typed URL into a short link, so the QR becomes dynamic and trackable. */
  const makeDynamic = async () => {
    if (!canWrite) return demoRestricted();
    if (!customUrl.trim()) {
      showToast('error', 'Avval URL manzilini kiriting');
      return;
    }
    setConverting(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination_url: customUrl, source: 'dashboard' }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast('error', data.error || 'Havola yaratib bo‘lmadi');
        return;
      }
      const link: ClientLink = data.link;
      setLinks((all) => [link, ...all]);
      setSelectedLinkId(link.id);
      setUrlMode('existing');
      await saveToLink(link, `Dinamik QR tayyor: ${shortUrl(link.slug).replace(/^https?:\/\//, '')}`);
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setConverting(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
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
        showToast('success', 'Joylashuvingiz aniqlandi');
      },
      (err) => {
        setIsLocating(false);
        showToast('error', 'Joylashuvni aniqlab bo‘lmadi: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const previewMode: PreviewMode = linkMode
    ? {
        kind: 'link',
        link: selectedLink,
        dirty: JSON.stringify(design) !== JSON.stringify(designFrom(selectedLink.qr_config)),
        saving,
        onSave: handleSave,
      }
    : activeType === 'url'
      ? { kind: 'custom-url', converting, onMakeDynamic: makeDynamic }
      : { kind: 'static' };

  const toggle = (pane: Pane) => setActivePane(activePane === pane ? null : pane);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <QrCode className="w-6 h-6 text-indigo-400" />
          <span>{t.qrStudio}</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Havolalaringiz uchun dinamik QR kodlar, shuningdek vCard, Wi-Fi, joylashuv va tadbir uchun statik QR kodlar.
        </p>
      </div>

      <div role="tablist" className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto scrollbar-none shadow-sm">
        {TYPES.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeType === tab.id}
              onClick={() => selectType(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeType === tab.id ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          <StudioPane
            icon={<FileText className="w-4 h-4" />}
            iconClass="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            title="1. Tarkib"
            subtitle={activeType === 'url' ? 'Qisqa havola (dinamik) yoki ixtiyoriy URL (statik)' : 'QR ichiga yoziladigan ma’lumot'}
            open={activePane === 'content'}
            onToggle={() => toggle('content')}
          >
            {activeType === 'url' && (
              <UrlForm
                links={links}
                urlMode={urlMode}
                setUrlMode={setUrlMode}
                selectedLinkId={selectedLinkId}
                onSelectLink={selectLink}
                customUrl={customUrl}
                setCustomUrl={setCustomUrl}
              />
            )}
            {activeType === 'vcard' && <VCardForm vcard={vcard} setVcard={setVcard} />}
            {activeType === 'text' && <TextForm textContent={textContent} setTextContent={setTextContent} />}
            {activeType === 'location' && (
              <LocationForm location={location} setLocation={setLocation} isLocating={isLocating} handleDetectLocation={detectLocation} />
            )}
            {activeType === 'wifi' && <WifiForm wifi={wifi} setWifi={setWifi} />}
            {activeType === 'event' && <EventForm eventData={eventData} setEventData={setEventData} />}
          </StudioPane>

          <StudioPane
            icon={<Paintbrush className="w-4 h-4" />}
            iconClass="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
            title="2. Ranglar"
            subtitle="Bitta rang, gradient va ko‘zlar rangi"
            open={activePane === 'colors'}
            onToggle={() => toggle('colors')}
          >
            <ColorsPane design={design} update={update} />
          </StudioPane>

          <StudioPane
            icon={<ImageIcon className="w-4 h-4" />}
            iconClass="bg-purple-500/10 text-purple-400 border-purple-500/20"
            title="3. Logotip"
            subtitle="Brend logotipi, emodzi yoki o‘z rasmingiz"
            open={activePane === 'logo'}
            onToggle={() => toggle('logo')}
          >
            <LogoPane design={design} update={update} />
          </StudioPane>

          <StudioPane
            icon={<Sliders className="w-4 h-4" />}
            iconClass="bg-amber-500/10 text-amber-400 border-amber-500/20"
            title="4. Shakllar"
            subtitle="Nuqtalar, ko‘z ramkasi va ko‘z markazi shakli"
            open={activePane === 'design'}
            onToggle={() => toggle('design')}
          >
            <ShapesPane design={design} update={update} />
          </StudioPane>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <QrPreviewPanel payload={payload} design={design} update={update} resolution={resolution} setResolution={setResolution} mode={previewMode} />
        </div>
      </div>
    </div>
  );
}

function UrlForm({
  links,
  urlMode,
  setUrlMode,
  selectedLinkId,
  onSelectLink,
  customUrl,
  setCustomUrl,
}: {
  links: ClientLink[];
  urlMode: 'existing' | 'custom';
  setUrlMode: (mode: 'existing' | 'custom') => void;
  selectedLinkId: string;
  onSelectLink: (id: string) => void;
  customUrl: string;
  setCustomUrl: (url: string) => void;
}) {
  const modeButton = (active: boolean) =>
    `flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${active ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setUrlMode('existing')} className={modeButton(urlMode === 'existing')}>
          Mening havolam (dinamik)
        </button>
        <button type="button" onClick={() => setUrlMode('custom')} className={modeButton(urlMode === 'custom')}>
          Ixtiyoriy URL (statik)
        </button>
      </div>

      {urlMode === 'existing' ? (
        links.length > 0 ? (
          <div>
            <label htmlFor="qr-link" className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
              Qisqa havola
            </label>
            <select
              id="qr-link"
              value={selectedLinkId}
              onChange={(e) => onSelectLink(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
            >
              {links.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} ({shortUrl(l.slug).replace(/^https?:\/\//, '')})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500 mt-1.5">Havolaning saqlangan dizayni yuklandi. O‘zgartirib, saqlang.</p>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">Hali havola yo‘q. Ixtiyoriy URL kiriting va uni dinamik QR ga aylantiring.</p>
        )
      ) : (
        <div>
          <label htmlFor="qr-url" className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
            URL manzil
          </label>
          <input
            id="qr-url"
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://sayt.uz/sahifa"
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600"
          />
        </div>
      )}
    </div>
  );
}
