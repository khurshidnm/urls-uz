import type { Locale } from '@/lib/translations';

/**
 * Russian and English for the messages the API sends (they are written in
 * Uzbek on the server), plus the few generic errors the pages show. The page translates them when it shows them, so the
 * API stays in one language and every error is still read in the visitor's.
 * `{0}`, `{1}`, ... stand for the changing parts (numbers, names).
 */
const MESSAGES: [uz: string, ru: string, en: string][] = [
  // Requests and limits
  ['So‘rov JSON formatida bo‘lishi kerak', 'Запрос должен быть в формате JSON', 'The request must be JSON'],
  ['Noto‘g‘ri so‘rov', 'Неверный запрос', 'Invalid request'],
  ['Noto‘g‘ri amal', 'Неверное действие', 'Invalid action'],
  ['Tarmoq xatosi yuz berdi', 'Ошибка сети', 'Network error'],
  ['Xatolik yuz berdi', 'Произошла ошибка', 'Something went wrong'],
  ['Maʼlumotlarni yuklab bo‘lmadi', 'Не удалось загрузить данные', 'Couldn’t load the data'],
  ['Juda ko‘p urinish. {0} soniyadan keyin qayta urinib ko‘ring.', 'Слишком много попыток. Повторите через {0} с.', 'Too many attempts. Try again in {0} s.'],
  ['Juda ko‘p so‘rov. {0} soniyadan keyin qayta urinib ko‘ring.', 'Слишком много запросов. Повторите через {0} с.', 'Too many requests. Try again in {0} s.'],
  ['Juda ko‘p so‘rov, biroz kuting', 'Слишком много запросов, подождите немного', 'Too many requests, please wait a moment'],
  ['Faqat super admin ruxsatiga ega.', 'Доступно только супер-администратору.', 'Super admins only.'],

  // Sign-in, sign-up, accounts
  ['Ismingizni kiriting', 'Введите имя', 'Enter your name'],
  ['Ko‘pi bilan {0} ta belgi', 'Не более {0} символов', 'At most {0} characters'],
  ['Kod 6 ta raqamdan iborat', 'Код состоит из 6 цифр', 'The code has 6 digits'],
  ['Email yoki parol noto‘g‘ri', 'Неверный email или пароль', 'Wrong email or password'],
  ['Login yoki parol noto‘g‘ri', 'Неверный логин или пароль', 'Wrong login or password'],
  ['Xat yuborib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.', 'Не удалось отправить письмо. Попробуйте чуть позже.', 'Couldn’t send the email. Please try again shortly.'],
  ['Xat yuborib bo‘lmadi', 'Не удалось отправить письмо', 'Couldn’t send the email'],
  ['Email manzil noto‘g‘ri', 'Неверный email', 'Invalid email address'],
  ['Kod noto‘g‘ri yoki muddati o‘tgan', 'Код неверный или устарел', 'The code is wrong or has expired'],
  ['Bu email allaqachon ro‘yxatdan o‘tgan. Kirish oynasidan kiring.', 'Этот email уже зарегистрирован. Войдите через окно входа.', 'This email is already registered. Please sign in.'],
  ['Bu email akkauntingizga allaqachon ulangan', 'Этот email уже привязан к вашему аккаунту', 'This email is already connected to your account'],
  ['Akkauntga email ulanmagan', 'К аккаунту не привязан email', 'No email is connected to this account'],
  ['Joriy parol noto‘g‘ri', 'Неверный текущий пароль', 'The current password is wrong'],
  ['Parol kamida 8 ta belgidan iborat bo‘lsin', 'Пароль должен быть не короче 8 символов', 'The password must be at least 8 characters'],
  ['Parol ko‘pi bilan 128 ta belgi', 'Пароль — не более 128 символов', 'The password can be at most 128 characters'],
  ['Parolni kiriting', 'Введите пароль', 'Enter the password'],
  ['Kod noto‘g‘ri', 'Неверный код', 'Wrong code'],
  ['Xavfsizlik tekshiruvi muvaffaqiyatsiz (state). Qayta urinib ko‘ring.', 'Проверка безопасности не пройдена. Попробуйте ещё раз.', 'Security check failed. Please try again.'],
  ['Google OAuth sozlanmagan', 'Вход через Google не настроен', 'Google sign-in isn’t set up'],
  ['Telegram xavfsizlik imzosi noto‘g‘ri yoki muddati o‘tgan', 'Подпись Telegram неверна или устарела', 'The Telegram signature is invalid or expired'],
  ['Telegram xavfsizlik imzosi noto‘g‘ri', 'Подпись Telegram неверна', 'The Telegram signature is invalid'],
  ['Telefon raqam noto‘g‘ri', 'Неверный номер телефона', 'Invalid phone number'],
  ['Kod yuborib bo‘lmadi. Raqamda Telegram mavjudligini tekshiring.', 'Не удалось отправить код. Проверьте, что на номере есть Telegram.', 'Couldn’t send the code. Check that this number has Telegram.'],
  ['Telegram Gateway bilan bog‘lanib bo‘lmadi', 'Не удалось связаться с Telegram Gateway', 'Couldn’t reach Telegram Gateway'],
  ['Telefon orqali kirish hozircha mavjud emas', 'Вход по телефону пока недоступен', 'Phone sign-in isn’t available yet'],
  ['Kod muddati tugagan. Yangi kod so‘rang.', 'Срок кода истёк. Запросите новый.', 'The code has expired. Request a new one.'],
  ['Kiritilgan tasdiqlash kodi noto‘g‘ri', 'Неверный код подтверждения', 'Wrong verification code'],
  ['Kirish usuli topilmadi', 'Способ входа не найден', 'Sign-in method not found'],
  ['Oxirgi kirish usulini uzib bo‘lmaydi: akkauntga kira olmay qolasiz.', 'Нельзя отключить последний способ входа: вы потеряете доступ к аккаунту.', 'You can’t remove your last sign-in method: you’d be locked out.'],
  ['Akkauntingiz ish maydoni topilmadi', 'Рабочее пространство аккаунта не найдено', 'Your account’s workspace wasn’t found'],
  ['Ikkala akkauntda ham bio sahifa bor. Ulardan birini o‘chiring va qayta ulang.', 'В обоих аккаунтах есть bio-страница. Удалите одну и подключите снова.', 'Both accounts have a bio page. Delete one and connect again.'],
  ['Ikki bosqichli himoya allaqachon yoqilgan.', 'Двухфакторная защита уже включена.', 'Two-factor authentication is already on.'],
  ['Kod noto‘g‘ri. Ilovadagi joriy kodni kiriting.', 'Неверный код. Введите текущий код из приложения.', 'Wrong code. Enter the current code from the app.'],
  ['Kod noto‘g‘ri yoki muddati o‘tgan. Ilovadagi yangi kodni kiriting.', 'Код неверный или устарел. Введите новый код из приложения.', 'The code is wrong or expired. Enter a new code from the app.'],

  // API keys
  ['API kalitlarni boshqarish uchun tizimga kiring.', 'Войдите, чтобы управлять API-ключами.', 'Sign in to manage API keys.'],
  ['REST API kalitlari faqat Pro va Biznes tariflarida mavjud.', 'Ключи REST API доступны только на тарифах Pro и Бизнес.', 'REST API keys are available on the Pro and Business plans only.'],
  ['REST API faqat Pro va Biznes tariflarida mavjud.', 'REST API доступен только на тарифах Pro и Бизнес.', 'The REST API is available on the Pro and Business plans only.'],
  ['API kalit noto‘g‘ri yoki bekor qilingan.', 'API-ключ неверный или отозван.', 'The API key is invalid or revoked.'],

  // Links
  ['Havolani qisqartirish uchun tizimga kiring.', 'Войдите, чтобы сократить ссылку.', 'Sign in to shorten links.'],
  ['Havola topilmadi', 'Ссылка не найдена', 'Link not found'],
  ['"{0}" nomli havola topilmadi', 'Ссылка «{0}» не найдена', 'Link "{0}" not found'],
  ['Kiritilgan parol noto‘g‘ri', 'Неверный пароль', 'Wrong password'],
  ['Demo rejimida havolani o‘zgartirish cheklangan.', 'В демо-режиме нельзя менять ссылки.', 'Links can’t be changed in demo mode.'],
  ['Demo rejimida havolani o‘chirish cheklangan.', 'В демо-режиме нельзя удалять ссылки.', 'Links can’t be deleted in demo mode.'],
  ['Demo rejimida havolalarni o‘zgartirib bo‘lmaydi.', 'В демо-режиме нельзя менять ссылки.', 'Links can’t be changed in demo mode.'],
  ['Slug 3–50 ta belgi (faqat harf, raqam, tire yoki tagchiziq) bo‘lishi lozim', 'Адрес — 3–50 символов (буквы, цифры, дефис или подчёркивание)', 'The slug must be 3–50 characters (letters, digits, dashes or underscores)'],
  ['Bu slug allaqachon boshqa havola uchun band qilingan', 'Этот адрес уже занят другой ссылкой', 'This slug is already taken by another link'],
  ['Tizimga kiring', 'Войдите в систему', 'Please sign in'],
  ['Slug kiritilmadi', 'Адрес не указан', 'No slug entered'],
  ['Ushbu slug tizim marshruti sifatida band qilingan', 'Этот адрес зарезервирован системой', 'This slug is reserved by the system'],
  ['Tekshirishda xatolik yuz berdi', 'Ошибка проверки', 'Couldn’t check'],
  ['Slug mavjud va foydalanish mumkin', 'Адрес свободен', 'This slug is available'],
  ['Yaroqsiz slug formati. Kamida 3 ta belgi (harf, raqam, tire) bo‘lishi lozim.', 'Неверный адрес. Минимум 3 символа (буквы, цифры, дефис).', 'Invalid slug. Use at least 3 characters (letters, digits, dashes).'],
  ['Ushbu qisqa havola (slug) allaqachon band qilingan. Boshqa nom tanlang.', 'Этот короткий адрес уже занят. Выберите другой.', 'This short link is already taken. Choose another.'],
  ['Ushbu slug allaqachon band qilingan.', 'Этот адрес уже занят.', 'This slug is already taken.'],
  ['Bu havola QR kodga tegishli: manzilni QR studiyada o‘zgartiring.', 'Эта ссылка принадлежит QR-коду: меняйте адрес в QR-студии.', 'This link belongs to a QR code: change the address in the QR studio.'],
  [
    'Tarifingizda ko‘pi bilan {0} ta faol havola bo‘lishi mumkin ({1}). Yangi havola uchun eskilarini arxivlang yoki o‘chiring. Cheksiz imkoniyatlar Pro tarifda tez kunda ishga tushadi!',
    'На вашем тарифе — не более {0} активных ссылок ({1}). Архивируйте или удалите старые. Безлимит появится на тарифе Pro!',
    'Your plan allows up to {0} active links ({1}). Archive or delete old ones to add more. Unlimited links are coming with Pro!',
  ],
  [
    'Tarifingizda {0} ta Smart Deep Link bo‘lishi mumkin ({1} ishlatilgan). Mavjud deep linkni o‘chiring yoki oddiy havola sifatida saqlang. Cheksiz imkoniyatlar Pro tarifda tez kunda ishga tushadi!',
    'На вашем тарифе — {0} Smart Deep Link ({1} использовано). Удалите существующий или сохраните как обычную ссылку. Безлимит появится на тарифе Pro!',
    'Your plan allows {0} Smart Deep Links ({1} used). Delete one or save this as a regular link. Unlimited is coming with Pro!',
  ],
  [
    'Tarifingizda {0} ta qurilmalar bo‘yicha yo‘naltiruvchi havola bo‘lishi mumkin ({1} ishlatilgan). Cheksiz imkoniyatlar Pro tarifda tez kunda ishga tushadi!',
    'На вашем тарифе — {0} ссылок с переадресацией по устройству ({1} использовано). Безлимит появится на тарифе Pro!',
    'Your plan allows {0} device-routed links ({1} used). Unlimited is coming with Pro!',
  ],

  // Phishing filter
  ['Fishing xavfi: Ushbu havola xavfsizlik filtri tomonidan bloklandi.', 'Риск фишинга: ссылка заблокирована фильтром безопасности.', 'Phishing risk: this link was blocked by the security filter.'],
  ['Manzilda login yoki parol (…@) bo‘lishi mumkin emas: bu fishing usuli.', 'В адресе не может быть логина или пароля (…@): это приём фишинга.', 'The address can’t contain a login or password (…@): that’s a phishing trick.'],
  ['Xavfsizlik qoidasi: To‘g‘ridan-to‘g‘ri IP manzillarga havola qisqartirish taqiqlangan (Fishingdan himoya).', 'Правило безопасности: нельзя сокращать ссылки на IP-адреса (защита от фишинга).', 'Security rule: links to bare IP addresses can’t be shortened (phishing protection).'],
  ['Ushbu havola O‘zbekiston to‘lov tizimlari va banklariga taqlid qiluvchi fishing belgilariga ega.', 'Ссылка похожа на фишинг под платёжные системы и банки Узбекистана.', 'This link looks like phishing imitating Uzbek payment systems and banks.'],
  ['{0} havolalarini qayta-qisqartirish (loop) mumkin emas.', 'Нельзя повторно сокращать ссылки {0} (петля).', '{0} links can’t be shortened again (loop).'],
  ['Kiritilgan URL manzil formati noto‘g‘ri.', 'Неверный формат URL.', 'Invalid URL format.'],
  ['URL manzil formati noto‘g‘ri', 'Неверный формат URL', 'Invalid URL format'],
  ['Havolalar http(s)://, tg:, mailto: yoki tel: bilan boshlanishi kerak', 'Ссылки должны начинаться с http(s)://, tg:, mailto: или tel:', 'Links must start with http(s)://, tg:, mailto: or tel:'],

  // Link form fields
  ['Sana formati noto‘g‘ri', 'Неверный формат даты', 'Invalid date format'],
  ['Amal qilish muddati kelajakdagi vaqt bo‘lishi lozim', 'Срок действия должен быть в будущем', 'The expiry date must be in the future'],
  ['Butun son bo‘lishi kerak', 'Должно быть целое число', 'Must be a whole number'],
  ['Musbat son bo‘lishi kerak', 'Должно быть положительное число', 'Must be a positive number'],
  ['Teg ko‘pi bilan 40 ta belgi', 'Тег — не более 40 символов', 'A tag can be at most 40 characters'],
  ['Ko‘pi bilan 20 ta teg', 'Не более 20 тегов', 'At most 20 tags'],
  ['Rang HEX formatida bo‘lishi kerak', 'Цвет должен быть в формате HEX', 'The colour must be a HEX value'],
  ['Logo manzili noto‘g‘ri', 'Неверный адрес логотипа', 'Invalid logo address'],
  ['Logo hajmi 100 KB dan oshmasligi kerak', 'Логотип — не больше 100 КБ', 'The logo must be 100 KB or smaller'],
  ['Nom bo‘sh bo‘lmasin', 'Название не может быть пустым', 'The name can’t be empty'],
  ['O‘zgartirish uchun kamida bitta maydon yuboring', 'Укажите хотя бы одно поле для изменения', 'Send at least one field to change'],
  ['Kamida bitta havola tanlang', 'Выберите хотя бы одну ссылку', 'Select at least one link'],
  ['Bir martada ko‘pi bilan 100 ta havola', 'Не более 100 ссылок за раз', 'At most 100 links at a time'],

  // Folders
  ['Papka topilmadi', 'Папка не найдена', 'Folder not found'],
  ['Papka yaratish uchun tizimga kiring.', 'Войдите, чтобы создать папку.', 'Sign in to create folders.'],
  ['Bu nomdagi papka allaqachon mavjud', 'Папка с таким названием уже есть', 'A folder with this name already exists'],
  ['Demo rejimida papkalarni o‘zgartirib bo‘lmaydi.', 'В демо-режиме нельзя менять папки.', 'Folders can’t be changed in demo mode.'],

  // Bio page
  ['Demo rejimida bio sahifani saqlash cheklangan. Bepul versiyadan foydalanish uchun ro‘yxatdan o‘ting.', 'В демо-режиме нельзя сохранить bio-страницу. Зарегистрируйтесь, чтобы пользоваться бесплатной версией.', 'The bio page can’t be saved in demo mode. Sign up to use the free plan.'],
  ['Tarifingizda faqat {0} ta tugma saqlandi.', 'На вашем тарифе сохранено только {0} кнопок.', 'Only {0} buttons were saved on your plan.'],
  ['Handle faqat lotin harflari va raqamlardan iborat bo‘lishi kerak ({0} ta belgi).', 'Имя — только латинские буквы и цифры ({0} символов).', 'The handle can only use Latin letters and digits ({0} characters).'],
  ['Handle faqat lotin harflari va raqamlardan iborat bo‘lishi kerak', 'Имя — только латинские буквы и цифры', 'The handle can only use Latin letters and digits'],
  [
    'Handle kamida {0} ta belgidan iborat bo‘lishi kerak. {1} va undan qisqa nomlar tez orada alohida to‘lov asosida taqdim etiladi.',
    'Имя — не короче {0} символов. Имена из {1} символов и короче скоро станут доступны за отдельную плату.',
    'The handle needs at least {0} characters. Handles of {1} characters or fewer will be offered for a one-time fee soon.',
  ],
  ['Avatar manzili noto‘g‘ri', 'Неверный адрес аватара', 'Invalid avatar address'],
  ['Rasm hajmi 100 KB dan oshmasligi kerak', 'Изображение — не больше 100 КБ', 'The image must be 100 KB or smaller'],
  ['{0} havolasi noto‘g‘ri', 'Неверная ссылка {0}', 'Invalid {0} link'],
  ['Tugma nomi bo‘sh bo‘lmasin', 'Название кнопки не может быть пустым', 'The button label can’t be empty'],

  // QR codes
  ['QR kodni saqlash uchun tizimga kiring.', 'Войдите, чтобы сохранить QR-код.', 'Sign in to save QR codes.'],
  ['QR kod topilmadi', 'QR-код не найден', 'QR code not found'],
  ['Demo rejimida QR kodlarni o‘zgartirish cheklangan.', 'В демо-режиме нельзя менять QR-коды.', 'QR codes can’t be changed in demo mode.'],
  ['QR kod nomini kiriting', 'Введите название QR-кода', 'Enter a name for the QR code'],
  ['Nom ko‘pi bilan 100 ta belgi', 'Название — не более 100 символов', 'The name can be at most 100 characters'],
  ['Wi-Fi QR kodlari faqat statik bo‘ladi: telefon tarmoq ma’lumotini QR ichidan o‘qiydi.', 'Wi-Fi QR-коды только статические: телефон читает данные сети прямо из QR.', 'Wi-Fi QR codes are always static: the phone reads the network details from the QR itself.'],
  ['Qisqa havola band bo‘lib qoldi, qayta urinib ko‘ring.', 'Короткая ссылка оказалась занята, попробуйте ещё раз.', 'The short link was just taken, please try again.'],
  ['Dinamik QR kodni statikka aylantirib bo‘lmaydi: chop etilgan nusxalar ishlamay qoladi.', 'Динамический QR-код нельзя сделать статическим: напечатанные копии перестанут работать.', 'A dynamic QR code can’t become static: printed copies would stop working.'],
  ['Wi-Fi tarmoq nomini kiriting', 'Введите название Wi-Fi сети', 'Enter the Wi-Fi network name'],
  ['Tadbir nomini kiriting', 'Введите название события', 'Enter the event name'],
  ['Matn kiriting', 'Введите текст', 'Enter some text'],
  ['URL kiriting', 'Введите URL', 'Enter a URL'],
];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const COMPILED = MESSAGES.map(([uz, ru, en]) => {
  if (!uz.includes('{0}')) return { exact: uz, ru, en };
  // "{0}" etc. match any text; the captured parts are put back into the translation
  const pattern = new RegExp(`^${escape(uz).replace(/\\\{(\d)\\\}/g, '(.+?)')}$`);
  return { pattern, ru, en };
});

/** The message in the visitor's language (unknown or Uzbek: returned as is). */
export function translateServerMessage(message: string, locale: Locale): string {
  if (locale === 'uz' || !message) return message;
  const text = message.trim();
  for (const entry of COMPILED) {
    const target = locale === 'ru' ? entry.ru : entry.en;
    if ('exact' in entry && entry.exact === text) return target;
    if ('pattern' in entry && entry.pattern) {
      const match = entry.pattern.exec(text);
      if (match) return target.replace(/\{(\d)\}/g, (_, i) => match[Number(i) + 1] ?? '');
    }
  }
  return message;
}
