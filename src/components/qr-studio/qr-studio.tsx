'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, FileText, Image as ImageIcon, Link2, MapPin, Paintbrush, QrCode, Sliders, UserCheck, Wifi } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/components/ui/toast';
import { shortUrl } from '@/lib/utils';
import type { ClientLink, ClientQrCode } from '@/lib/client-types';
import { QR_SAMPLE_DATA, type EventPayload, type LocationPayload, type QrDataType, type VCardPayload, type WifiPayload } from '@/lib/qr-payloads';
import { canBeDynamic, describeContent, staticPayload } from '@/lib/qr/content';
import StudioPane from './studio-pane';
import { EventForm, LocationForm, TextForm, VCardForm, WifiForm } from './content-forms';
import { ColorsPane, LogoPane, ShapesPane } from './design-panes';
import QrPreviewPanel, { type PreviewMode } from './qr-preview-panel';
import { DEFAULT_DESIGN, designFrom, type QrDesign } from './qr-design';
import { SITE_URL } from '@/lib/site';

interface Props {
  links: ClientLink[];
  /** Open the studio on this link (from /dashboard/qr/new?link=...). */
  initialLinkId: string | null;
  canWrite: boolean;
  /** The saved QR code being edited (/dashboard/qr/[id]). */
  saved?: ClientQrCode | null;
  /** Landing page visitor without an account: saving asks them to sign up first. */
  guest?: { requireAuth: (afterLogin: () => void) => void };
  initialType?: QrDataType;
  showHeader?: boolean;
}

const TYPES = [
  { id: 'url' as const, label: ['Havola', 'Ссылка', 'Link'] as const, icon: Link2 },
  { id: 'text' as const, label: ['Matn', 'Текст', 'Text'] as const, icon: FileText },
  { id: 'vcard' as const, label: ['vCard', 'vCard', 'vCard'] as const, icon: UserCheck },
  { id: 'location' as const, label: ['Joylashuv', 'Локация', 'Location'] as const, icon: MapPin },
  { id: 'wifi' as const, label: ['Wi-Fi', 'Wi-Fi', 'Wi-Fi'] as const, icon: Wifi },
  { id: 'event' as const, label: ['Tadbir', 'Событие', 'Event'] as const, icon: Calendar },
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

/** Empty forms for a new QR code in the dashboard (the landing page shows samples). */
const EMPTY = {
  text: '',
  vcard: {
    version: '3.0', firstName: '', lastName: '', organization: '', jobTitle: '', phoneWork: '', phonePrivate: '', phoneMobile: '',
    faxWork: '', faxPrivate: '', email: '', website: '', street: '', zipCode: '', city: '', state: '', country: '',
  } satisfies VCardPayload as VCardPayload,
  wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false } satisfies WifiPayload as WifiPayload,
  location: { latitude: '', longitude: '', addressSearch: '', format: 'google_maps' } satisfies LocationPayload as LocationPayload,
  event: { title: '', location: '', description: '', startDate: '', startTime: '10:00', endDate: '', endTime: '18:00', allDay: false } satisfies EventPayload as EventPayload,
};

/** The form values for every type: a saved QR code's content for its type, otherwise empty (or samples). */
function formValues(saved: ClientQrCode | null | undefined, samples: boolean) {
  const base = samples ? QR_SAMPLE_DATA : EMPTY;
  const c = saved?.content ?? {};
  const is = (type: QrDataType) => saved?.type === type;
  return {
    customUrl: is('url') ? String(c.url ?? '') : '',
    text: is('text') ? String(c.text ?? '') : base.text,
    vcard: is('vcard') ? (c as unknown as VCardPayload) : base.vcard,
    wifi: is('wifi') ? (c as unknown as WifiPayload) : base.wifi,
    location: is('location') ? (c as unknown as LocationPayload) : base.location,
    event: is('event') ? (c as unknown as EventPayload) : base.event,
  };
}

type Pane = 'content' | 'colors' | 'logo' | 'design';

export default function QrStudioClient({ links: initialLinks, initialLinkId, canWrite, saved, guest, initialType = 'url', showHeader = true }: Props) {
  const { t, tr } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();

  const [links, setLinks] = useState(initialLinks);
  const initialLink = saved ? undefined : initialLinks.find((l) => l.id === initialLinkId);
  const [savedQr, setSavedQr] = useState(saved ?? null);

  const [activeType, setActiveType] = useState<QrDataType>(saved?.type ?? initialType);
  const [activePane, setActivePane] = useState<Pane | null>('content');
  const [resolution, setResolution] = useState(1000);

  // Content
  const initial = formValues(saved, Boolean(guest));
  const [urlMode, setUrlMode] = useState<'existing' | 'custom'>(!guest && !saved && (initialLink || links.length > 0) ? 'existing' : 'custom');
  const [selectedLinkId, setSelectedLinkId] = useState(initialLink?.id ?? links[0]?.id ?? '');
  const [customUrl, setCustomUrl] = useState(initial.customUrl);
  const [vcard, setVcard] = useState<VCardPayload>(initial.vcard);
  const [textContent, setTextContent] = useState(initial.text);
  const [wifi, setWifi] = useState<WifiPayload>(initial.wifi);
  const [location, setLocation] = useState<LocationPayload>(initial.location);
  const [isLocating, setIsLocating] = useState(false);
  const [eventData, setEventData] = useState<EventPayload>(initial.event);

  // Design: a saved QR code's, or (designing an existing link's QR) the link's
  const selectedLink = links.find((l) => l.id === selectedLinkId);
  const [design, setDesign] = useState<QrDesign>(() => {
    if (saved) return designFrom(saved.design);
    const link = initialLink ?? selectedLink;
    if (link && initialType === 'url') return designFrom(link.qr_config);
    return { ...DEFAULT_DESIGN, ...TYPE_DEFAULTS[initialType] };
  });
  const update = (patch: Partial<QrDesign>) => setDesign((d) => ({ ...d, ...patch }));
  const [saving, setSaving] = useState(false);

  // Saved QR codes
  const [name, setName] = useState(saved?.name ?? '');
  const [dynamic, setDynamic] = useState(saved ? Boolean(saved.link) : !guest);
  const dynamicAllowed = canBeDynamic(activeType);

  const linkMode = !savedQr && activeType === 'url' && urlMode === 'existing' && selectedLink;

  // Spread: the payload interfaces aren't index-signature records
  const content: Record<string, unknown> = useMemo(() => {
    switch (activeType) {
      case 'url':
        return { url: customUrl };
      case 'text':
        return { text: textContent };
      case 'vcard':
        return { ...vcard };
      case 'wifi':
        return { ...wifi };
      case 'location':
        return { ...location };
      case 'event':
        return { ...eventData };
    }
  }, [activeType, customUrl, textContent, vcard, wifi, location, eventData]);

  // A dynamic QR encodes its short link; everything else encodes the content itself
  const payload = linkMode
    ? shortUrl(selectedLink.slug)
    : savedQr?.link
      ? shortUrl(savedQr.link.slug)
      : activeType === 'url' && urlMode === 'existing'
        ? SITE_URL
        : staticPayload(activeType, content);

  const typeLabel = TYPES.find((x) => x.id === activeType)?.label;
  const namePlaceholder = describeContent(activeType, content) || `${typeLabel ? tr(typeLabel[0], typeLabel[1], typeLabel[2]) : ''} QR`;

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

  const demoRestricted = () => window.dispatchEvent(new CustomEvent('open-demo-restriction', { detail: { actionTitle: tr('QR kodni saqlash', 'Сохранение QR-кода', 'Saving a QR code') } }));

  /** Saves the design of an existing link's QR (the "my link" mode). */
  const saveLinkDesign = async () => {
    if (!selectedLink) return;
    if (!canWrite) return demoRestricted();
    setSaving(true);
    try {
      const res = await fetch(`/api/links/${selectedLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_config: design }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast('error', data.error || tr('Saqlashda xatolik', 'Ошибка сохранения', 'Couldn’t save'));
        return;
      }
      setLinks((all) => all.map((l) => (l.id === selectedLink.id ? data.link : l)));
      showToast('success', 'QR dizayn havolaga saqlandi');
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  /** Puts a saved QR code's (server-normalized) values back into the forms. */
  const applySaved = (qr: ClientQrCode) => {
    const values = formValues(qr, false);
    setSavedQr(qr);
    setName(qr.name);
    setDesign(designFrom(qr.design));
    setDynamic(Boolean(qr.link));
    setCustomUrl(values.customUrl);
    if (qr.type === 'text') setTextContent(values.text);
    if (qr.type === 'vcard') setVcard(values.vcard);
    if (qr.type === 'wifi') setWifi(values.wifi);
    if (qr.type === 'location') setLocation(values.location);
    if (qr.type === 'event') setEventData(values.event);
  };

  const persistQr = async () => {
    setSaving(true);
    try {
      const body = { name: name.trim() || namePlaceholder, content, design, dynamic: dynamicAllowed && dynamic };
      const res = await fetch(savedQr ? `/api/qr-codes/${savedQr.id}` : '/api/qr-codes', {
        method: savedQr ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedQr ? body : { ...body, type: activeType }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast('error', data.error || tr('Saqlashda xatolik', 'Ошибка сохранения', 'Couldn’t save'));
        return;
      }
      const qr: ClientQrCode = data.qrCode;
      if (savedQr) {
        applySaved(qr);
        showToast('success', tr('O‘zgarishlar saqlandi', 'Изменения сохранены', 'Changes saved'));
      } else {
        showToast('success', 'QR kod saqlandi');
        // The editor URL, so a reload (or a bookmark) opens this QR code
        if (guest) router.push(`/dashboard/qr/${qr.id}`);
        else router.replace(`/dashboard/qr/${qr.id}`);
      }
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQr = () => {
    if (guest) return guest.requireAuth(() => void persistQr());
    if (!canWrite) return demoRestricted();
    void persistQr();
  };

  const dirty =
    !savedQr ||
    (!savedQr.link && dynamicAllowed && dynamic) ||
    JSON.stringify({ name: name.trim(), content, design }) !==
      JSON.stringify({ name: savedQr.name, content: savedQr.content, design: designFrom(savedQr.design) });

  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast('error', tr('Brauzeringiz geolokatsiyani qo‘llab-quvvatlamaydi', 'Ваш браузер не поддерживает геолокацию', 'Your browser doesn’t support geolocation'));
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
          addressSearch: tr('Mening joriy joylashuvim', 'Моё текущее местоположение', 'My current location'),
        }));
        setIsLocating(false);
        showToast('success', tr('Joylashuvingiz aniqlandi', 'Местоположение определено', 'Location found'));
      },
      (err) => {
        setIsLocating(false);
        showToast('error', tr('Joylashuvni aniqlab bo‘lmadi', 'Не удалось определить местоположение', 'Couldn’t get your location') + ': ' + err.message);
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
        onSave: saveLinkDesign,
      }
    : {
        kind: 'qr',
        save: {
          name,
          onNameChange: setName,
          namePlaceholder,
          dynamic,
          onDynamicChange: setDynamic,
          dynamicAllowed,
          link: savedQr?.link ?? null,
          pendingDynamic: dynamicAllowed && dynamic && !savedQr?.link,
          isSaved: Boolean(savedQr),
          dirty,
          saving,
          onSave: handleSaveQr,
          guest: Boolean(guest),
        },
      };

  const toggle = (pane: Pane) => setActivePane(activePane === pane ? null : pane);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {showHeader && (
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <QrCode className="w-6 h-6 text-indigo-400" />
          <span>{savedQr ? savedQr.name : t.qrStudio}</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          {savedQr
            ? tr('Saqlangan QR kod. Tarkib yoki dizaynni o‘zgartiring va saqlang.', 'Сохранённый QR-код. Измените содержимое или дизайн и сохраните.', 'A saved QR code. Change the content or design and save.')
            : tr(
                'Havola, vCard, joylashuv, tadbir, matn va Wi-Fi uchun QR kod yarating va keyin tahrirlash uchun saqlang.',
                'Создавайте QR-коды для ссылок, vCard, локаций, событий, текста и Wi-Fi и сохраняйте, чтобы редактировать позже.',
                'Create QR codes for links, vCards, locations, events, text and Wi-Fi, and save them to edit later.'
              )}
        </p>
      </div>
      )}

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
              // A saved QR code keeps its type
              disabled={Boolean(savedQr) && activeType !== tab.id}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all disabled:opacity-40 disabled:pointer-events-none ${
                activeType === tab.id ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{tr(tab.label[0], tab.label[1], tab.label[2])}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          <StudioPane
            icon={<FileText className="w-4 h-4" />}
            iconClass="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            title={tr('1. Tarkib', '1. Содержимое', '1. Content')}
            subtitle={
              savedQr?.link
                ? tr('O‘zgartirib saqlang: chop etilgan QR yangi ma’lumotni ko‘rsatadi', 'Измените и сохраните: напечатанный QR покажет новые данные', 'Edit and save: the printed QR will show the new content')
                : activeType === 'url' && !savedQr && !guest
                  ? tr('Mavjud havolangiz yoki yangi URL', 'Ваша ссылка или новый URL', 'One of your links or a new URL')
                  : tr('QR kod ma’lumoti', 'Данные QR-кода', 'QR code content')
            }
            open={activePane === 'content'}
            onToggle={() => toggle('content')}
          >
            {activeType === 'url' && (
              <UrlForm
                allowExisting={!guest && !savedQr}
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
            title={tr('2. Ranglar', '2. Цвета', '2. Colours')}
            subtitle={tr('Bitta rang, gradient va ko‘zlar rangi', 'Один цвет, градиент и цвет «глаз»', 'Solid colour, gradient and eye colour')}
            open={activePane === 'colors'}
            onToggle={() => toggle('colors')}
          >
            <ColorsPane design={design} update={update} />
          </StudioPane>

          <StudioPane
            icon={<ImageIcon className="w-4 h-4" />}
            iconClass="bg-purple-500/10 text-purple-400 border-purple-500/20"
            title={tr('3. Logotip', '3. Логотип', '3. Logo')}
            subtitle={tr('Brend logotipi, emodzi yoki o‘z rasmingiz', 'Логотип бренда, эмодзи или своё изображение', 'Brand logo, emoji or your own image')}
            open={activePane === 'logo'}
            onToggle={() => toggle('logo')}
          >
            <LogoPane design={design} update={update} />
          </StudioPane>

          <StudioPane
            icon={<Sliders className="w-4 h-4" />}
            iconClass="bg-amber-500/10 text-amber-400 border-amber-500/20"
            title={tr('4. Shakllar', '4. Формы', '4. Shapes')}
            subtitle={tr('Nuqtalar, ko‘z ramkasi va ko‘z markazi shakli', 'Форма точек, рамки и центра «глаз»', 'Dot, eye frame and eye centre shapes')}
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
  allowExisting,
  links,
  urlMode,
  setUrlMode,
  selectedLinkId,
  onSelectLink,
  customUrl,
  setCustomUrl,
}: {
  allowExisting: boolean;
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
  const { tr } = useLanguage();

  return (
    <div className="space-y-3">
      {allowExisting && (
      <div className="flex gap-2">
        <button type="button" onClick={() => setUrlMode('existing')} className={modeButton(urlMode === 'existing')}>
          {tr('Mening havolam', 'Моя ссылка', 'My link')}
        </button>
        <button type="button" onClick={() => setUrlMode('custom')} className={modeButton(urlMode === 'custom')}>
          {tr('Yangi URL', 'Новый URL', 'New URL')}
        </button>
      </div>
      )}

      {urlMode === 'existing' ? (
        links.length > 0 ? (
          <div>
            <label htmlFor="qr-link" className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
              {tr('Qisqa havola', 'Короткая ссылка', 'Short link')}
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
            <p className="text-[11px] text-zinc-500 mt-1.5">{tr('Havolaning saqlangan dizayni yuklandi. O‘zgartirib, saqlang.', 'Загружен сохранённый дизайн ссылки. Измените и сохраните.', 'The link’s saved design is loaded. Change it and save.')}</p>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">{tr('Hali havola yo‘q. «Yangi URL» ni tanlab, manzil kiriting.', 'Ссылок пока нет. Выберите «Новый URL» и введите адрес.', 'No links yet. Choose “New URL” and enter an address.')}</p>
        )
      ) : (
        <div>
          <label htmlFor="qr-url" className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
            {tr('URL manzil', 'URL-адрес', 'URL')}
          </label>
          <input
            id="qr-url"
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder={tr('https://sayt.uz/sahifa', 'https://sayt.uz/stranitsa', 'https://site.uz/page')}
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600"
          />
        </div>
      )}
    </div>
  );
}
