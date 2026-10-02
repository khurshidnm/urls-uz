'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, KeyRound, Loader2, Smartphone, Unlink } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { connectMessage } from './connect-message';
import { useLanguage } from '@/lib/language-context';

export interface LoginMethod {
  provider: 'google' | 'telegram' | 'phone' | 'password' | 'email';
  providerId: string;
  label: string | null;
}

interface Props {
  methods: LoginMethod[];
  /** Result of connecting Google, which returns here from a redirect. */
  notice: { kind: 'success' | 'error'; text: string } | null;
  phoneLoginAvailable: boolean;
  /** Email codes can be delivered (ZeptoMail configured), or this is development. */
  emailLoginAvailable: boolean;
}

type Text = [uz: string, ru: string, en: string];

const PROVIDERS: { id: LoginMethod['provider']; name: Text; hint: Text }[] = [
  { id: 'google', name: ['Google', 'Google', 'Google'], hint: ['Google hisobingiz orqali kirish', 'Вход через аккаунт Google', 'Sign in with your Google account'] },
  { id: 'telegram', name: ['Telegram', 'Telegram', 'Telegram'], hint: ['Telegram akkauntingiz orqali bir bosishda kirish', 'Вход в один клик через Telegram', 'One-click sign-in with Telegram'] },
  { id: 'phone', name: ['Telefon raqam', 'Номер телефона', 'Phone number'], hint: ['Telegram’ga keladigan tasdiqlash kodi orqali kirish', 'Вход по коду, который приходит в Telegram', 'Sign in with a code sent to your Telegram'] },
  { id: 'email', name: ['Email va parol', 'Email и пароль', 'Email and password'], hint: ['Email manzilingiz va parol bilan kirish', 'Вход по email и паролю', 'Sign in with your email and password'] },
  { id: 'password', name: ['Login va parol', 'Логин и пароль', 'Login and password'], hint: ['Har safar Telegram yoki Google so‘ramasdan, login va parol bilan kirish', 'Вход по логину и паролю, без Telegram или Google', 'Sign in with a login and password, without Telegram or Google'] },
];

/**
 * The account's login methods. Connecting another one means Google,
 * Telegram and the phone number all open this same account.
 */
export default function LoginMethods({ methods, notice, phoneLoginAvailable, emailLoginAvailable }: Props) {
  const { tr } = useLanguage();
  const router = useRouter();
  const { showToast } = useToast();
  const [connecting, setConnecting] = useState<LoginMethod['provider'] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const done = (message: string) => {
    showToast('success', message);
    setConnecting(null);
    router.refresh();
  };

  const disconnect = async (method: LoginMethod) => {
    setBusy(method.provider + method.providerId);
    try {
      const res = await fetch('/api/auth/identities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: method.provider, providerId: method.providerId }),
      });
      const data = await res.json();
      if (!data.success) showToast('error', data.error || tr('Uzib bo‘lmadi', 'Не удалось отключить', 'Couldn’t disconnect'));
      else done(tr('Kirish usuli uzildi', 'Способ входа отключён', 'Sign-in method removed'));
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div id="login-methods" className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
        <KeyRound className="w-4 h-4 text-indigo-400" />
        <div>
          <h3 className="text-sm font-bold text-white">{tr('Kirish usullari', 'Способы входа', 'Sign-in methods')}</h3>
          <p className="text-[11px] text-slate-400">{tr('Ulangan usullarning istalgani bilan shu bitta akkauntga kirasiz.', 'Любой из подключённых способов открывает этот же аккаунт.', 'Any connected method signs you in to this same account.')}</p>
        </div>
      </div>

      {notice && (
        <p
          className={`text-xs p-3 rounded-xl border flex gap-2 ${
            notice.kind === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
          }`}
        >
          {notice.kind === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{notice.text}</span>
        </p>
      )}

      <ul className="divide-y divide-slate-800/80">
        {PROVIDERS.map((provider) => {
          const connected = methods.filter((m) => m.provider === provider.id);
          const unavailable =
            connected.length === 0 && ((provider.id === 'phone' && !phoneLoginAvailable) || (provider.id === 'email' && !emailLoginAvailable));
          return (
            <li key={provider.id} className="py-3 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white">{tr(...provider.name)}</div>
                  {connected.length > 0 ? (
                    connected.map((m) => (
                      <div key={m.providerId} className="flex items-center gap-2 mt-1 text-[11px] text-emerald-300/90">
                        <Check className="w-3 h-3 shrink-0" />
                        <span className="truncate">{m.label || tr('Ulangan', 'Подключено', 'Connected')}</span>
                        {(m.provider === 'password' || m.provider === 'email') && connecting !== m.provider && (
                          <button
                            type="button"
                            onClick={() => setConnecting(m.provider)}
                            className="ml-1 text-indigo-400 hover:text-indigo-300"
                          >
                            {tr('Parolni o‘zgartirish', 'Сменить пароль', 'Change password')}
                          </button>
                        )}
                        {methods.length > 1 && (
                          <button
                            type="button"
                            onClick={() => disconnect(m)}
                            disabled={busy !== null}
                            className="ml-1 inline-flex items-center gap-1 text-slate-500 hover:text-rose-400 disabled:opacity-50"
                            aria-label={tr(`${provider.name[0]}ni uzish`, `Отключить: ${provider.name[1]}`, `Disconnect ${provider.name[2]}`)}
                          >
                            <Unlink className="w-3 h-3" /> {tr('Uzish', 'Отключить', 'Disconnect')}
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-500 mt-0.5">{unavailable ? tr('Hozircha mavjud emas', 'Пока недоступно', 'Not available yet') : tr(...provider.hint)}</div>
                  )}
                </div>
                {connected.length === 0 && !unavailable && connecting !== provider.id && (
                  provider.id === 'google' ? (
                    <button
                      type="button"
                      // Full-page redirect to Google; it comes back to this page
                      onClick={() => (window.location.href = '/api/auth/google?connect=1')}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-900 text-xs font-semibold text-center"
                    >
                      {tr('Google’ni ulash', 'Подключить Google', 'Connect Google')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConnecting(provider.id)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700"
                    >
                      {provider.id === 'password'
                        ? tr('Login va parol o‘rnatish', 'Задать логин и пароль', 'Set a login and password')
                        : provider.id === 'email'
                          ? tr('Emailni ulash', 'Подключить email', 'Connect email')
                          : tr(`${provider.name[0]}ni ulash`, `Подключить: ${provider.name[1]}`, `Connect ${provider.name[2]}`)}
                    </button>
                  )
                )}
              </div>
              {connecting === 'telegram' && provider.id === 'telegram' && (
                <ConnectTelegram onDone={done} onCancel={() => setConnecting(null)} />
              )}
              {connecting === 'phone' && provider.id === 'phone' && <ConnectPhone onDone={done} onCancel={() => setConnecting(null)} />}
              {connecting === 'email' && provider.id === 'email' && (
                connected.length > 0 ? (
                  <EmailPasswordForm onDone={done} onCancel={() => setConnecting(null)} />
                ) : (
                  <EmailConnectForm onDone={done} onCancel={() => setConnecting(null)} />
                )
              )}
              {connecting === 'password' && provider.id === 'password' && (
                <PasswordForm currentLogin={connected[0]?.providerId ?? null} onDone={done} onCancel={() => setConnecting(null)} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

async function postTelegramAuth(body: Record<string, unknown>) {
  const res = await fetch('/api/auth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, connect: true }),
  });
  return res.json();
}

/**
 * Telegram Login Widget in callback mode: the signed data comes back to this
 * page and is posted together with the session, instead of a redirect.
 */
function ConnectTelegram({ onDone, onCancel }: { onDone: (message: string) => void; onCancel: () => void }) {
  const { tr } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'urlsuzbot';
  // The widget is set up once; the latest callbacks are read through refs
  const onDoneRef = useRef(onDone);
  const showToastRef = useRef(showToast);
  const trRef = useRef(tr);
  useEffect(() => {
    onDoneRef.current = onDone;
    showToastRef.current = showToast;
    trRef.current = tr;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = window as unknown as { onTelegramConnect?: (user: Record<string, unknown>) => void };
    w.onTelegramConnect = async (user) => {
      const data = await postTelegramAuth({ action: 'verify-widget', widgetData: user });
      if (data.success) onDoneRef.current(connectMessage('Telegram', data.outcome, trRef.current));
      else showToastRef.current('error', data.error || trRef.current(tr('Telegram’ni ulab bo‘lmadi', 'Не удалось подключить Telegram', 'Couldn’t connect Telegram'), 'Не удалось подключить Telegram', 'Couldn’t connect Telegram'));
    };
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'medium');
    script.setAttribute('data-radius', '10');
    script.setAttribute('data-onauth', 'onTelegramConnect(user)');
    container.appendChild(script);
    return () => {
      container.innerHTML = '';
      delete w.onTelegramConnect;
    };
  }, [botUsername]);

  return (
    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
      <div ref={containerRef} className="min-h-[32px]" />
      <button type="button" onClick={onCancel} className="text-[11px] text-slate-400 hover:text-white">
        {tr('Bekor qilish', 'Отмена', 'Cancel')}
      </button>
    </div>
  );
}

/** Phone number + Telegram verification code, added to this account. */
function ConnectPhone({ onDone, onCancel }: { onDone: (message: string) => void; onCancel: () => void }) {
  const { tr } = useLanguage();
  const { showToast } = useToast();
  const [phone, setPhone] = useState('+998 ');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await postTelegramAuth({ action: 'send-otp', phone });
      if (!data.success) return showToast('error', data.error || tr('Kod yuborib bo‘lmadi', 'Не удалось отправить код', 'Couldn’t send the code'));
      setSent(true);
      setDevCode(data.demoCode || '');
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await postTelegramAuth({ action: 'verify-otp', phone, code });
      if (data.success) onDone(connectMessage(tr('Telefon raqam', 'Номер телефона', 'Phone number'), data.outcome, tr));
      else showToast('error', data.error || tr('Kod noto‘g‘ri', 'Неверный код', 'Wrong code'));
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const input = 'flex-1 min-w-0 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-indigo-500';
  return (
    <form onSubmit={sent ? verify : send} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
      <div className="flex gap-2">
        <Smartphone className="w-4 h-4 text-slate-500 mt-2 shrink-0" />
        {sent ? (
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder={tr('Tasdiqlash kodi', 'Код подтверждения', 'Verification code')}
            aria-label={tr('Tasdiqlash kodi', 'Код подтверждения', 'Verification code')}
            inputMode="numeric"
            autoFocus
            className={input}
          />
        ) : (
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" aria-label={tr('Telefon raqam', 'Номер телефона', 'Phone number')} autoFocus className={input} />
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-white hover:bg-slate-200 text-slate-900 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {sent ? tr('Tasdiqlash', 'Подтвердить', 'Confirm') : tr('Kod yuborish', 'Отправить код', 'Send code')}
        </button>
        <button type="button" onClick={onCancel} className="text-[11px] text-slate-400 hover:text-white px-1">
          {tr('Bekor', 'Отмена', 'Cancel')}
        </button>
      </div>
      {devCode && <p className="text-[11px] text-amber-300/90">{tr('Dev rejimi (Telegram Gateway sozlanmagan): kod', 'Режим разработки (Telegram Gateway не настроен): код', 'Dev mode (Telegram Gateway not set up): code')} {devCode}</p>}
    </form>
  );
}

/**
 * Sets the login and password, or changes them (the current password is
 * asked for then). The password is typed twice to catch typos.
 */
function PasswordForm({ currentLogin, onDone, onCancel }: { currentLogin: string | null; onDone: (message: string) => void; onCancel: () => void }) {
  const { tr } = useLanguage();
  const { showToast } = useToast();
  const [login, setLogin] = useState(currentLogin ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const mismatch = repeat.length > 0 && repeat !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== repeat) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password, ...(currentLogin && { currentPassword }) }),
      });
      const data = await res.json();
      if (data.success) onDone(currentLogin ? tr('Login va parol yangilandi', 'Логин и пароль обновлены', 'Login and password updated') : tr(`Endi «${data.login}» login va parolingiz bilan kira olasiz`, `Теперь можно входить с логином «${data.login}» и паролем`, `You can now sign in with the login "${data.login}" and your password`));
      else showToast('error', data.error || tr('Saqlab bo‘lmadi', 'Не удалось сохранить', 'Couldn’t save'));
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const input = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500';
  return (
    <form onSubmit={submit} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-[11px] text-slate-400 space-y-1">
          <span>Login</span>
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30))}
            autoComplete="username"
            placeholder={tr('masalan: hikmat_99', 'например: hikmat_99', 'e.g. hikmat_99')}
            required
            minLength={3}
            className={`${input} font-mono`}
          />
        </label>
        {currentLogin && (
          <label className="text-[11px] text-slate-400 space-y-1">
            <span>{tr('Joriy parol', 'Текущий пароль', 'Current password')}</span>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required className={input} />
          </label>
        )}
        <label className="text-[11px] text-slate-400 space-y-1">
          <span>{currentLogin ? tr('Yangi parol', 'Новый пароль', 'New password') : tr('Parol', 'Пароль', 'Password')}</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required className={input} />
        </label>
        <label className="text-[11px] text-slate-400 space-y-1">
          <span>{tr('Parolni takrorlang', 'Повторите пароль', 'Repeat password')}</span>
          <input type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required className={input} />
        </label>
      </div>
      <p className={`text-[11px] ${mismatch ? 'text-rose-400' : 'text-slate-500'}`}>
        {mismatch ? tr('Parollar mos emas', 'Пароли не совпадают', 'Passwords don’t match') : tr('Kamida 8 ta belgi. Login: 3–30 ta lotin harfi, raqam yoki _', 'Минимум 8 символов. Логин: 3–30 латинских букв, цифр или _', 'At least 8 characters. Login: 3–30 Latin letters, digits or _')}
      </p>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading || mismatch || password.length < 8 || login.length < 3} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-200 text-slate-900 text-xs font-semibold disabled:opacity-50">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {tr('Saqlash', 'Сохранить', 'Save')}
        </button>
        <button type="button" onClick={onCancel} className="text-[11px] text-slate-400 hover:text-white px-1">
          {tr('Bekor qilish', 'Отмена', 'Cancel')}
        </button>
      </div>
    </form>
  );
}

async function postEmailAuth(body: Record<string, unknown>) {
  const res = await fetch('/api/auth/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json();
}

const fieldClass = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500';

/** Adds an email (with a password) to this account: a code is emailed to prove the address. */
function EmailConnectForm({ onDone, onCancel }: { onDone: (message: string) => void; onCancel: () => void }) {
  const { tr } = useLanguage();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const mismatch = repeat.length > 0 && repeat !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = sent
        ? await postEmailAuth({ action: 'connect-verify', email, code })
        : await postEmailAuth({ action: 'connect-request', email, password });
      if (!data.success) return showToast('error', data.error || tr('Bajarilmadi', 'Не удалось', 'Something went wrong'));
      if (sent) onDone(connectMessage('Email', data.outcome, tr));
      else {
        setSent(true);
        setDevCode(data.devCode || '');
      }
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
      {sent ? (
        <label className="block text-[11px] text-slate-400 space-y-1">
          <span>{tr(`${email} manziliga yuborilgan 6 xonali kod`, `6-значный код, отправленный на ${email}`, `The 6-digit code sent to ${email}`)}</span>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus className={`${fieldClass} font-mono tracking-widest`} />
        </label>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-[11px] text-slate-400 space-y-1">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={fieldClass} />
          </label>
          <label className="text-[11px] text-slate-400 space-y-1">
            <span>{tr('Parol', 'Пароль', 'Password')}</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required className={fieldClass} />
          </label>
          <label className="text-[11px] text-slate-400 space-y-1">
            <span>{tr('Parolni takrorlang', 'Повторите пароль', 'Repeat password')}</span>
            <input type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required className={fieldClass} />
          </label>
        </div>
      )}
      {mismatch && !sent && <p className="text-[11px] text-rose-400">{tr('Parollar mos emas', 'Пароли не совпадают', 'Passwords don’t match')}</p>}
      {devCode && <p className="text-[11px] text-amber-300/90">{tr('Dev rejimi (ZeptoMail sozlanmagan): kod', 'Режим разработки (ZeptoMail не настроен): код', 'Dev mode (ZeptoMail not set up): code')} {devCode}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading || (sent ? code.length !== 6 : mismatch || password.length < 8 || !email)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-200 text-slate-900 text-xs font-semibold disabled:opacity-50"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {sent ? tr('Tasdiqlash', 'Подтвердить', 'Confirm') : tr('Kod yuborish', 'Отправить код', 'Send code')}
        </button>
        <button type="button" onClick={onCancel} className="text-[11px] text-slate-400 hover:text-white px-1">
          {tr('Bekor qilish', 'Отмена', 'Cancel')}
        </button>
      </div>
    </form>
  );
}

/** Changes the email login's password (asks for the current one). */
function EmailPasswordForm({ onDone, onCancel }: { onDone: (message: string) => void; onCancel: () => void }) {
  const { tr } = useLanguage();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const mismatch = repeat.length > 0 && repeat !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await postEmailAuth({ action: 'change-password', currentPassword, password });
      if (data.success) onDone(tr('Email paroli yangilandi', 'Пароль email обновлён', 'Email password updated'));
      else showToast('error', data.error || tr('Bajarilmadi', 'Не удалось', 'Something went wrong'));
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-[11px] text-slate-400 space-y-1">
          <span>{tr('Joriy parol', 'Текущий пароль', 'Current password')}</span>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required className={fieldClass} />
        </label>
        <label className="text-[11px] text-slate-400 space-y-1">
          <span>{tr('Yangi parol', 'Новый пароль', 'New password')}</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required className={fieldClass} />
        </label>
        <label className="text-[11px] text-slate-400 space-y-1">
          <span>{tr('Parolni takrorlang', 'Повторите пароль', 'Repeat password')}</span>
          <input type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required className={fieldClass} />
        </label>
      </div>
      {mismatch && <p className="text-[11px] text-rose-400">{tr('Parollar mos emas', 'Пароли не совпадают', 'Passwords don’t match')}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading || mismatch || password.length < 8} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-200 text-slate-900 text-xs font-semibold disabled:opacity-50">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {tr('Saqlash', 'Сохранить', 'Save')}
        </button>
        <button type="button" onClick={onCancel} className="text-[11px] text-slate-400 hover:text-white px-1">
          {tr('Bekor qilish', 'Отмена', 'Cancel')}
        </button>
      </div>
    </form>
  );
}
