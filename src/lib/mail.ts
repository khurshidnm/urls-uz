import { SITE_NAME, SITE_URL } from '@/lib/site';

/**
 * Sending email through ZeptoMail (Zoho) by its HTTP API.
 * Configure ZEPTOMAIL_TOKEN (the "Send Mail" token from ZeptoMail), MAIL_FROM_ADDRESS
 * (an address on the verified domain, e.g. no-reply@urlss.uz) and optionally
 * MAIL_FROM_NAME and ZEPTOMAIL_API_URL (default https://api.zeptomail.com/v1.1/email;
 * EU / India accounts use api.zeptomail.eu / api.zeptomail.in).
 */

export function mailConfigured(): boolean {
  return Boolean(process.env.ZEPTOMAIL_TOKEN && process.env.MAIL_FROM_ADDRESS);
}

/** Email sign-in works when mail can be delivered, or in development (the code is shown on screen). */
export function emailLoginAvailable(): boolean {
  return mailConfigured() || process.env.NODE_ENV !== 'production';
}

interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class MailError extends Error {}

export async function sendMail(mail: Mail): Promise<void> {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV === 'production') throw new MailError('ZeptoMail sozlanmagan');
    console.info(`[mail] (development, not sent) to ${mail.to}: ${mail.subject}`);
    return;
  }

  const token = process.env.ZEPTOMAIL_TOKEN!.trim();
  const res = await fetch(process.env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.com/v1.1/email', {
    method: 'POST',
    headers: {
      // The token is shown in ZeptoMail with or without its "Zoho-enczapikey" prefix
      Authorization: token.startsWith('Zoho-enczapikey') ? token : `Zoho-enczapikey ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { address: process.env.MAIL_FROM_ADDRESS, name: process.env.MAIL_FROM_NAME || SITE_NAME },
      to: [{ email_address: { address: mail.to } }],
      subject: mail.subject,
      htmlbody: mail.html,
      textbody: mail.text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[mail] ZeptoMail rejected the message:', res.status, detail.slice(0, 500));
    throw new MailError('Xat yuborib bo‘lmadi');
  }
}

const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const PURPOSE_TEXT = {
  signup: { subject: 'ro‘yxatdan o‘tish kodi', lead: 'Ro‘yxatdan o‘tishni yakunlash uchun quyidagi kodni kiriting:' },
  reset: { subject: 'parolni tiklash kodi', lead: 'Yangi parol o‘rnatish uchun quyidagi kodni kiriting:' },
  connect: { subject: 'emailni tasdiqlash kodi', lead: 'Emailni akkauntingizga ulash uchun quyidagi kodni kiriting:' },
} as const;

/** The one-time code email (plain, readable in every mail app). */
export function codeEmail(purpose: keyof typeof PURPOSE_TEXT, code: string, minutes: number): Omit<Mail, 'to'> {
  const { subject, lead } = PURPOSE_TEXT[purpose];
  const ignore = 'Agar bu so‘rovni siz yubormagan bo‘lsangiz, xatga e’tibor bermang: akkauntingizga hech narsa qilinmaydi.';
  return {
    subject: `${code} — ${SITE_NAME} ${subject}`,
    text: `${lead}\n\n${code}\n\nKod ${minutes} daqiqa amal qiladi.\n\n${ignore}\n\n${SITE_URL}`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b">
  <p style="font-size:15px;font-weight:600;margin:0 0 16px">${escapeHtml(SITE_NAME)}</p>
  <p style="font-size:14px;margin:0 0 12px">${escapeHtml(lead)}</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:8px;font-family:monospace;margin:0 0 12px">${code}</p>
  <p style="font-size:13px;color:#52525b;margin:0 0 20px">Kod ${minutes} daqiqa amal qiladi.</p>
  <p style="font-size:12px;color:#71717a;margin:0">${escapeHtml(ignore)}</p>
</div>`,
  };
}

/** Sent instead of a code when someone tries to sign up with an email that already has an account. */
export function alreadyRegisteredEmail(): Omit<Mail, 'to'> {
  const text = `Bu email bilan ${SITE_NAME} da akkaunt allaqachon bor. Kirish oynasida email va parolingiz bilan kiring yoki «Parolni unutdingizmi?» orqali yangi parol o‘rnating.\n\n${SITE_URL}`;
  return {
    subject: `${SITE_NAME}: bu email allaqachon ro‘yxatdan o‘tgan`,
    text,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b"><p style="font-size:14px">${escapeHtml(text).replace(/\n/g, '<br>')}</p></div>`,
  };
}

function infoEmail(subject: string, text: string): Omit<Mail, 'to'> {
  return {
    subject,
    text: `${text}\n\n${SITE_URL}`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b"><p style="font-size:15px;font-weight:600;margin:0 0 16px">${escapeHtml(SITE_NAME)}</p><p style="font-size:14px;line-height:1.5">${escapeHtml(text).replace(/\n/g, '<br>')}</p><p style="font-size:13px"><a href="${SITE_URL}">${escapeHtml(SITE_URL)}</a></p></div>`,
  };
}

/** Password reset asked for an address that signed up with Google (no password to reset). */
export function resetForGoogleAccountEmail(): Omit<Mail, 'to'> {
  return infoEmail(
    `${SITE_NAME}: Google orqali kiring`,
    `Parolni tiklash so‘raldi, lekin bu email bilan akkauntingiz Google orqali ochilgan, shuning uchun parol yo‘q.\n\nKirish oynasida «Google orqali kirish» tugmasini bosing. Parol bilan ham kirmoqchi bo‘lsangiz, kirganingizdan keyin Sozlamalar → «Kirish usullari» → «Emailni ulash» bo‘limida parol o‘rnating.\n\nAgar bu so‘rovni siz yubormagan bo‘lsangiz, xatga e’tibor bermang.`
  );
}

/** Password reset asked for an address with no account at all. */
export function resetNoAccountEmail(): Omit<Mail, 'to'> {
  return infoEmail(
    `${SITE_NAME}: bu email bilan akkaunt yo‘q`,
    `Parolni tiklash so‘raldi, lekin bu email bilan ${SITE_NAME} da akkaunt topilmadi. Boshqa email, Google yoki Telegram bilan ro‘yxatdan o‘tgan bo‘lishingiz mumkin. Yangi akkaunt ochish uchun kirish oynasida «Ro‘yxatdan o‘ting» ni bosing.\n\nAgar bu so‘rovni siz yubormagan bo‘lsangiz, xatga e’tibor bermang.`
  );
}
