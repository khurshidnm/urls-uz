'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Official Telegram Login Widget. Telegram redirects to data-auth-url with
 * signed user data, which the server verifies before creating a session.
 * The bot's domain must be registered with @BotFather (/setdomain).
 */
export default function TelegramLoginButton() {
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'urlsuzbot';
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-auth-url', `${window.location.origin}/api/auth/telegram/callback`);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [botUsername]);

  return <div ref={containerRef} className="flex justify-center min-h-[40px]" />;
}
