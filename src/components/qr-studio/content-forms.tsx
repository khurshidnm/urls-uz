'use client';

import React, { useState } from 'react';
import { Compass, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { QR_SAMPLE_DATA, type EventPayload, type LocationPayload, type VCardPayload, type WifiPayload } from '@/lib/qr-payloads';
import { SITE_URL, SITE_NAME } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';

/* Forms for static QR content. Their data is encoded into the QR itself. */

export function VCardForm({ vcard, setVcard }: { vcard: VCardPayload; setVcard: (v: VCardPayload) => void }) {
  const { tr } = useLanguage();
  return (
        <div className="space-y-4">
          {/* Version Selector & Reset */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-zinc-400 font-medium">{tr('Format versiyasi:', 'Версия формата:', 'Format version:')}</span>
              <label className="flex items-center gap-1.5 text-zinc-200 cursor-pointer">
                <input
                  type="radio"
                  name="vcard_version"
                  checked={vcard.version === '2.1'}
                  onChange={() => setVcard({ ...vcard, version: '2.1' })}
                  className="text-indigo-600 focus:ring-0"
                />
                <span>{tr('Versiya 2.1', 'Версия 2.1', 'Version 2.1')}</span>
              </label>
              <label className="flex items-center gap-1.5 text-zinc-200 cursor-pointer">
                <input
                  type="radio"
                  name="vcard_version"
                  checked={vcard.version === '3.0'}
                  onChange={() => setVcard({ ...vcard, version: '3.0' })}
                  className="text-indigo-600 focus:ring-0"
                />
                <span>{tr('Versiya 3.0 (tavsiya etiladi)', 'Версия 3.0 (рекомендуется)', 'Version 3.0 (recommended)')}</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => setVcard(QR_SAMPLE_DATA.vcard)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{tr('Namunani to‘ldirish', 'Заполнить пример', 'Fill in a sample')}</span>
            </button>
          </div>

          {/* 3-Column Responsive Grid matching QRCode Monkey */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Ism *', 'Имя *', 'First name *')}</label>
              <input
                type="text"
                value={vcard.firstName}
                onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                placeholder="Sherzod"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Familiya', 'Фамилия', 'Last name')}</label>
              <input
                type="text"
                value={vcard.lastName}
                onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                placeholder="Qosimov"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Tashkilot', 'Организация', 'Organisation')}</label>
              <input
                type="text"
                value={vcard.organization || ''}
                onChange={(e) => setVcard({ ...vcard, organization: e.target.value })}
                placeholder="FinTech Lab"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Lavozim', 'Должность', 'Job title')}</label>
              <input
                type="text"
                value={vcard.jobTitle || ''}
                onChange={(e) => setVcard({ ...vcard, jobTitle: e.target.value })}
                placeholder="Senior Software Architect"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Ish telefoni', 'Рабочий телефон', 'Work phone')}</label>
              <input
                type="tel"
                value={vcard.phoneWork || ''}
                onChange={(e) => setVcard({ ...vcard, phoneWork: e.target.value })}
                placeholder="+998 71 200 00 00"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Uy telefoni', 'Домашний телефон', 'Home phone')}</label>
              <input
                type="tel"
                value={vcard.phonePrivate || ''}
                onChange={(e) => setVcard({ ...vcard, phonePrivate: e.target.value })}
                placeholder="+998 71 234 56 78"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Mobil telefon *', 'Мобильный *', 'Mobile *')}</label>
              <input
                type="tel"
                value={vcard.phoneMobile || ''}
                onChange={(e) => setVcard({ ...vcard, phoneMobile: e.target.value })}
                placeholder="+998 90 123 45 67"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Faks (ish)', 'Факс (рабочий)', 'Fax (work)')}</label>
              <input
                type="tel"
                value={vcard.faxWork || ''}
                onChange={(e) => setVcard({ ...vcard, faxWork: e.target.value })}
                placeholder="+998 71 200 00 01"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Faks (uy)', 'Факс (домашний)', 'Fax (home)')}</label>
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
                placeholder={`sherzod@${SITE_NAME}`}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Veb-sayt', 'Сайт', 'Website')}</label>
              <input
                type="text"
                value={vcard.website || ''}
                onChange={(e) => setVcard({ ...vcard, website: e.target.value })}
                placeholder={`${SITE_URL}/sherzod`}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Ko‘cha', 'Улица', 'Street')}</label>
              <input
                type="text"
                value={vcard.street || ''}
                onChange={(e) => setVcard({ ...vcard, street: e.target.value })}
                placeholder="Amir Temur shoh ko‘chasi 107"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Pochta indeksi', 'Индекс', 'Postcode')}</label>
              <input
                type="text"
                value={vcard.zipCode || ''}
                onChange={(e) => setVcard({ ...vcard, zipCode: e.target.value })}
                placeholder="100084"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Shahar', 'Город', 'City')}</label>
              <input
                type="text"
                value={vcard.city || ''}
                onChange={(e) => setVcard({ ...vcard, city: e.target.value })}
                placeholder="Toshkent"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Viloyat', 'Регион', 'State / region')}</label>
              <input
                type="text"
                value={vcard.state || ''}
                onChange={(e) => setVcard({ ...vcard, state: e.target.value })}
                placeholder="Toshkent shahri"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Mamlakat', 'Страна', 'Country')}</label>
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
  );
}

export function TextForm({ textContent, setTextContent }: { textContent: string; setTextContent: (v: string) => void }) {
  const { tr } = useLanguage();
  return (
        <div className="space-y-2">
          <label className="block text-[11px] font-mono uppercase text-zinc-400 flex items-center justify-between">
            <span>{tr('Matn', 'Текст', 'Your text')}</span>
            <span>{tr(`${textContent.length} ta belgi`, `${textContent.length} симв.`, `${textContent.length} characters`)}</span>
          </label>
          <textarea
            rows={4}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder={tr('Matnni kiriting...', 'Введите текст...', 'Enter your text...')}
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 resize-y"
          />
        </div>
  );
}

export function LocationForm({
  location,
  setLocation,
  isLocating,
  handleDetectLocation,
}: {
  location: LocationPayload;
  setLocation: (v: LocationPayload) => void;
  isLocating: boolean;
  handleDetectLocation: () => void;
}) {
  const { tr } = useLanguage();
  return (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono uppercase text-zinc-400">{tr('Manzilni qidirish', 'Поиск адреса', 'Search for an address')}</label>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? tr('Aniqlanmoqda...', 'Определяем...', 'Locating...') : tr('Joriy joylashuvim', 'Моё местоположение', 'My location')}</span>
            </button>
          </div>

          <input
            type="text"
            value={location.addressSearch || ''}
            onChange={(e) => setLocation({ ...location, addressSearch: e.target.value })}
            placeholder={tr('Masalan: Amir Temur xiyoboni, Toshkent...', 'Например: сквер Амира Темура, Ташкент...', 'e.g. Amir Temur Square, Tashkent...')}
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Kenglik', 'Широта', 'Latitude')}</label>
              <input
                type="text"
                value={location.latitude}
                onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                placeholder="41.311081"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Uzunlik', 'Долгота', 'Longitude')}</label>
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
  );
}

export function WifiForm({ wifi, setWifi }: { wifi: WifiPayload; setWifi: (v: WifiPayload) => void }) {
  const { tr } = useLanguage();
  const [showWifiPass, setShowWifiPass] = useState(false);
  return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Tarmoq nomi (SSID)', 'Имя сети (SSID)', 'Network name (SSID)')}</label>
            <input
              type="text"
              value={wifi.ssid}
              onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
              placeholder="MyHome_WiFi"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Parol', 'Пароль', 'Password')}</label>
            <div className="relative">
              <input
                type={showWifiPass ? 'text' : 'password'}
                value={wifi.password || ''}
                onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                placeholder={tr('Parol', 'Пароль', 'Password')}
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
            <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Shifrlash', 'Шифрование', 'Encryption')}</label>
            <select
              value={wifi.encryption}
              onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as typeof wifi.encryption })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">{tr('shifrlashsiz', 'без шифрования', 'no encryption')}</option>
            </select>
          </div>
        </div>
  );
}

export function EventForm({ eventData, setEventData }: { eventData: EventPayload; setEventData: (v: EventPayload) => void }) {
  const { tr } = useLanguage();
  return (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Tadbir nomi', 'Название события', 'Event title')}</label>
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
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Tadbir joyi', 'Место', 'Location')}</label>
              <input
                type="text"
                value={eventData.location || ''}
                onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                placeholder="Hilton Tashkent City"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Boshlanishi', 'Начало', 'Starts')}</label>
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
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">{tr('Tugashi', 'Окончание', 'Ends')}</label>
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
  );
}
