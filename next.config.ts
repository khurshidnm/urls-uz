import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy. Without nonces (pages stay statically cacheable),
 * so inline scripts are allowed, but scripts, frames and connections are
 * limited to this site and the few services it uses:
 * Telegram's login widget (script + iframe) and Google Fonts.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://telegram.org${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Avatars, bio images and QR logos can come from any https host; uploads are data: URIs
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "frame-src https://oauth.telegram.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Nobody may frame urls.uz (clickjacking)
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Browsers only honor HSTS over https, so it's harmless on local http
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
  // The Telegram login popup reports back to its opener
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
