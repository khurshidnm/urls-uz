import React from 'react';
import Link from 'next/link';
import { Briefcase, Calendar, Download, Globe, Mail, MapPin, Phone, Printer, Smartphone, UserPlus } from 'lucide-react';
import type { QrCodeRecord } from '@/lib/qr/qr-repo';
import type { EventPayload, VCardPayload } from '@/lib/qr-payloads';
import { SITE_NAME } from '@/lib/site';
import type { Tr } from '@/lib/locale';
import type { Locale } from '@/lib/translations';

/**
 * What a dynamic vCard, event or text QR code opens: a page with the current
 * content, so the owner can edit it after the QR is printed.
 */
export default function HostedQrPage({ qr, tr, locale }: { qr: QrCodeRecord; tr: Tr; locale: Locale }) {
  const fileUrl = `/api/qr-codes/${qr.id}/file`;
  return (
    <div className="min-h-screen bg-zinc-950 flex items-start sm:items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        {qr.type === 'vcard' && <ContactCard card={qr.content as unknown as VCardPayload} fileUrl={fileUrl} tr={tr} />}
        {qr.type === 'event' && <EventCard event={qr.content as unknown as EventPayload} fileUrl={fileUrl} tr={tr} locale={locale} />}
        {qr.type === 'text' && <TextCard text={String(qr.content.text ?? '')} />}
        <p className="mt-6 text-center text-[11px] text-zinc-600">
          {tr('Dinamik QR kod:', 'Динамический QR-код:', 'Dynamic QR code by')} <Link href="/" className="hover:text-zinc-400">{SITE_NAME}</Link>
        </p>
      </div>
    </div>
  );
}

function Row({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const body = (
    <>
      <span className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 flex items-center justify-center shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[10px] font-mono uppercase text-zinc-500">{label}</span>
        <span className="block text-sm text-zinc-100 break-words">{value}</span>
      </span>
    </>
  );
  return href ? (
    <a href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors">
      {body}
    </a>
  ) : (
    <div className="flex items-center gap-3 p-3">{body}</div>
  );
}

const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

function ContactCard({ card, fileUrl, tr }: { card: VCardPayload; fileUrl: string; tr: Tr }) {
  const name = [card.firstName, card.lastName].filter(Boolean).join(' ') || card.organization || tr('Kontakt', 'Контакт', 'Contact');
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const role = [card.jobTitle, card.organization].filter(Boolean).join(' · ');
  const address = [card.street, card.city, card.state, card.zipCode, card.country].filter(Boolean).join(', ');
  const website = card.website ? (/^https?:\/\//i.test(card.website) ? card.website : `https://${card.website}`) : '';

  return (
    <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl overflow-hidden">
      <div className="px-6 pt-8 pb-6 text-center bg-gradient-to-b from-indigo-500/10 to-transparent">
        <div className="w-20 h-20 mx-auto rounded-full bg-indigo-600 text-white text-2xl font-semibold flex items-center justify-center shadow-lg shadow-indigo-600/30" aria-hidden>
          {initials}
        </div>
        <h1 className="mt-4 text-xl font-semibold text-white tracking-tight">{name}</h1>
        {role && <p className="mt-1 text-xs text-zinc-400">{role}</p>}
        <a
          href={fileUrl}
          className="mt-5 inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-semibold transition-colors"
        >
          <UserPlus className="w-4 h-4" /> {tr('Kontaktni saqlash', 'Сохранить контакт', 'Save contact')}
        </a>
      </div>
      <div className="px-3 pb-4 divide-y divide-zinc-800/80">
        {card.phoneMobile && <Row icon={<Smartphone className="w-4 h-4" />} label={tr('Mobil', 'Мобильный', 'Mobile')} value={card.phoneMobile} href={tel(card.phoneMobile)} />}
        {card.phoneWork && <Row icon={<Phone className="w-4 h-4" />} label={tr('Ish telefoni', 'Рабочий телефон', 'Work phone')} value={card.phoneWork} href={tel(card.phoneWork)} />}
        {card.phonePrivate && <Row icon={<Phone className="w-4 h-4" />} label={tr('Shaxsiy telefon', 'Личный телефон', 'Personal phone')} value={card.phonePrivate} href={tel(card.phonePrivate)} />}
        {card.email && <Row icon={<Mail className="w-4 h-4" />} label="Email" value={card.email} href={`mailto:${card.email}`} />}
        {website && <Row icon={<Globe className="w-4 h-4" />} label={tr('Veb-sayt', 'Сайт', 'Website')} value={website.replace(/^https?:\/\//, '')} href={website} />}
        {card.faxWork && <Row icon={<Printer className="w-4 h-4" />} label={tr('Faks', 'Факс', 'Fax')} value={card.faxWork} />}
        {address && (
          <Row
            icon={<MapPin className="w-4 h-4" />}
            label={tr('Manzil', 'Адрес', 'Address')}
            value={address}
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          />
        )}
        {!role && card.organization && <Row icon={<Briefcase className="w-4 h-4" />} label={tr('Tashkilot', 'Организация', 'Organisation')} value={card.organization} />}
      </div>
    </div>
  );
}

const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

function formatEventDate(date: string, time: string, allDay: boolean | undefined, locale: Locale) {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return '';
  const day =
    locale === 'uz'
      ? `${d}-${UZ_MONTHS[m - 1]}, ${y}`
      : new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(y, m - 1, d));
  return `${day}${allDay || !time ? '' : `, ${time}`}`;
}

function EventCard({ event, fileUrl, tr, locale }: { event: EventPayload; fileUrl: string; tr: Tr; locale: Locale }) {
  const start = formatEventDate(event.startDate, event.startTime, event.allDay, locale);
  const sameDay = !event.endDate || event.endDate === event.startDate;
  const end = sameDay ? (event.allDay ? '' : event.endTime) : formatEventDate(event.endDate, event.endTime, event.allDay, locale);
  const when = [start, end].filter(Boolean).join(' — ');

  return (
    <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl overflow-hidden">
      <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-indigo-500/10 to-transparent">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <Calendar className="w-6 h-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-white tracking-tight">{event.title}</h1>
        {event.description && <p className="mt-2 text-sm text-zinc-400 whitespace-pre-line">{event.description}</p>}
      </div>
      <div className="px-3 divide-y divide-zinc-800/80">
        {when && <Row icon={<Calendar className="w-4 h-4" />} label={tr('Vaqt', 'Время', 'When')} value={when} />}
        {event.location && (
          <Row
            icon={<MapPin className="w-4 h-4" />}
            label={tr('Joy', 'Место', 'Where')}
            value={event.location}
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
          />
        )}
      </div>
      <div className="p-6 pt-4">
        <a
          href={fileUrl}
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-semibold transition-colors"
        >
          <Download className="w-4 h-4" /> {tr('Kalendarga qo‘shish', 'Добавить в календарь', 'Add to calendar')}
        </a>
      </div>
    </div>
  );
}

function TextCard({ text }: { text: string }) {
  return (
    <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl p-6">
      <p className="text-sm text-zinc-100 whitespace-pre-line break-words leading-relaxed">{text}</p>
    </div>
  );
}
