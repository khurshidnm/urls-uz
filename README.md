# urls.uz — Next-Generation URL Shortener & Link Ecosystem

<div align="center">
  <p><strong>Zamonaviy havola ekotizimi · Smart Deep Links · Dinamik QR Studio · Link-in-Bio · O‘zbekiston Analitikasi</strong></p>
  <p>Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, and Embedded SQLite.</p>
</div>

---

## 🌟 Asosiy Xususiyatlar (Key Features)

### 1. ⚡️ Smart Deep Links (Mobil Ilovalarda Ochish)
- Telegram kanallar (`t.me/...` → `tg://resolve?domain=...`) va guruh havolalarini brauzerda qotib qolmasdan to‘g‘ridan-to‘g‘ri **Telegram** ilovasida ochish.
- **Instagram** profillari (`instagram://user?username=...`), **YouTube** videolari (`vnd.youtube://...`), va **WhatsApp** chatlarini mahalliy ilovalarda bir zumda ochish.
- Konversiyani oshiruvchi avtomatik ilova scheme tahlili va veb-sayt fallback zaxirasi.

### 2. 🎨 Dinamik QR Kod Studio
- Markaziy logotiplar (Telegram, Instagram, YouTube, Globe).
- Maxsus brend ranglari (Obsidian, Telegram Blue, Emerald, Crimson, Dark Invert) hamda ixtiyoriy HEX color picker.
- Ramkalar va Call-To-Action matnlari: `"SCAN ME"`, `"BUYURTMA BERISH"`, `"TELEGRAM KANAL"`.
- Yuqori sifatli PNG formatida yuklab olish va chop etish.
- **Dinamik yo‘naltirish**: QR-kod chop etilgandan keyin ham havolani boshqaruv panelidan o‘zgartirish imkoniyati.

### 3. 📱 Link-in-Bio (@handle Shaxsiy Sahifa)
- Instagram, TikTok va Telegram profili uchun mobilga moslashtirilgan mikro-landing sahifa: `urls.uz/b/@nomingiz`.
- Shaxsiy avatar, verified tasdiqlash nishoni, bio tavsif va ijtimoiy tarmoqlar tasmasi.
- 5 xil zamonaviy mavzular: *Midnight Obsidian*, *Uzbekistan Emerald*, *Cyberpunk Neon*, *Frosted Glass*, *Golden Sunset*.
- Har bir tugma uchun alohida bosishlar tahlili va interaktiv QR ulashish oynasi.

### 4. 🇺🇿 O‘zbekiston Viloyatlari & Global Analitika
- O‘zbekistonning 14 ta maʼmuriy hududi bo‘yicha aniq taqsimot:
  *(Toshkent shahri, Samarqand, Farg‘ona, Andijon, Buxoro, Namangan, Qashqadaryo, Xorazm, Navoiy, Surxondaryo, Jizzax, Sirdaryo, Qoraqalpog‘iston)*.
- Manbalar (Telegram, Instagram, Google, Direct, YouTube).
- Qurilmalar (Mobile, Desktop, Tablet) va Operatsion tizimlar (iOS, Android, Windows, macOS).
- CSV formatida to‘liq hisobotni yuklab olish.

### 5. 🛡 Xavfsizlik & Smart Link Boshqaruvi
- **Parol bilan himoyalash**: Shaxsiy yoki korporativ havolalarni PIN kod orqali himoyalash.
- **Amal qilish muddati**: Belgilangan vaqtdan keyin havolani avtomatik to‘xtatish.
- **Maksimal bosish limiti**: Cheklangan aksiyalar uchun (masalan, dastlabki 100 kishi).
- **UTM Campaign Builder**: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`.
- **Device Targeting**: iOS foydalanuvchilarini App Store, Android foydalanuvchilarini esa Google Play sahifasiga alohida yo‘naltirish.

### 6. 🌐 Ko‘p tilli interfeys (Multi-Language)
- 🇺🇿 **O‘zbekcha** (Lotin)
- 🇷🇺 **Русский**
- 🇬🇧 **English**

### 7. 💳 O‘zbekiston To‘lov Tizimlari
- **Payme**, **Click**, **Uzum Bank**, va **Uzcard/Humo/Visa** to‘lov interfeysi.
- Tarif rejalari: *Bepul (0 UZS)*, *Pro (49,000 UZS/oy)*, *Biznes (149,000 UZS/oy)*.

### 8. 💻 Dasturchilar uchun REST API
- API kalitlar yaratish va boshqarish.
- Boshqaruv panelida to‘g‘ridan-to‘g‘ri brauzer orqali sinovchi **API Playground**.
- cURL, JavaScript (Fetch), va Python uchun tayyor kod namunalari.

---

## 🚀 Ishga Tushirish (Quick Start)

### 1. Talablar:
- Node.js 18+ yoki 20+

### 2. O‘rnatish:
```bash
git clone https://github.com/khurshidnm/urls-uz.git
cd urls-uz
npm install
```

### 3. Serverni ishga tushirish:
```bash
npm run dev
```
Brauzerda [http://localhost:3000](http://localhost:3000) (yoki bo‘sh port) manzilini oching.

### 4. Loyihani yig‘ish (Production Build):
```bash
npm run build
npm start
```

---

## 📂 Loyiha Strukturasi (Architecture)

```
urls-uz/
├── data/                      # Mahalliy SQLite maʼlumotlar bazasi (WAL rejimida)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Global til va autentifikatsiya provayderlari
│   │   ├── page.tsx           # Bosh landing sahifa (Hero shortener, QR, Bio, Tariflar)
│   │   ├── globals.css        # Premium dark dizayn tizimi, gradientlar, glassmorphism
│   │   ├── [slug]/            # Smart yo‘naltirish dvigateli (Deep link, parol, geo tahlil)
│   │   ├── b/[handle]/        # Ommaviy Link-in-Bio sahifasi (mobil moslashuvchan)
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # Boshqaruv paneli — KPIlar va umumiy statistika
│   │   │   ├── links/         # Havolalarni boshqarish, tahrirlash, o‘chirish
│   │   │   ├── qr/            # Dinamik QR Kod Studio
│   │   │   ├── bio/           # Link-in-Bio konstruktori (jonli telefon simulyatori)
│   │   │   ├── analytics/     # O‘zbekiston viloyatlari bo‘yicha chuqur tahlil
│   │   │   ├── api-keys/      # REST API kalitlar va Playground
│   │   │   ├── billing/       # Tariflar va Click/Payme to‘lov simulyatori
│   │   │   └── settings/      # Profil, til va maxsus domen sozlamalari
│   │   └── api/               # REST API yo‘nalishlari (/links, /bio, /analytics, /api-keys)
│   ├── components/
│   │   ├── ui/                # QrCanvas, Modal, Button, Badge, Icons
│   │   ├── landing/           # Navbar, Hero, ShortenCard, Features, Pricing, Footer
│   │   └── dashboard/         # Sidebar, Topbar, CreateLinkModal
│   └── lib/
│       ├── db.ts              # SQLite maʼlumotlar qatlami va sxema initsializatsiyasi
│       ├── deep-link.ts       # Telegram/Instagram/YouTube deep link aniqlovchi
│       ├── geo.ts             # O‘zbekiston 14 ta hududini aniqlovchi
│       ├── translations.ts    # O‘zbekcha, Ruscha, Inglizcha lug‘at
│       ├── language-context.tsx# Ko‘p tilli React context
│       ├── auth-context.tsx   # Foydalanuvchi va tarif konteksti
│       └── utils.ts           # Yordamchi utilitalar
└── package.json
```

---

## 📡 REST API Namunasi

### Havola yaratish (Create Short Link)
```bash
curl -X POST https://urls.uz/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "destination_url": "https://t.me/urls_uz",
    "slug": "telegram",
    "open_in_app": true,
    "utm_source": "telegram",
    "utm_campaign": "promo2026"
  }'
```

### Javob (Response):
```json
{
  "success": true,
  "link": {
    "id": "link_21dc9ec14f8a",
    "slug": "telegram",
    "destination_url": "https://t.me/urls_uz",
    "open_in_app": 1,
    "click_count": 0
  }
}
```

---

## 📄 Litsenziya
MIT © [urls.uz](https://urls.uz) — Barcha huquqlar himoyalangan.
