type Tr = (uz: string, ru: string, en: string) => string;

/** Outcome of connecting a login method, as the user should hear it. */
export function connectMessage(name: string, outcome: string | undefined, tr: Tr): string {
  if (outcome === 'merged')
    return tr(
      `${name} ulandi. U orqali ochilgan akkauntdagi havolalar, QR kodlar va sozlamalar shu akkauntga ko‘chirildi.`,
      `${name} подключён. Ссылки, QR-коды и настройки из аккаунта, открытого через него, перенесены в этот аккаунт.`,
      `${name} connected. Links, QR codes and settings from the account it opened were moved into this one.`
    );
  if (outcome === 'already-connected') return tr(`${name} bu akkauntga allaqachon ulangan.`, `${name} уже подключён к этому аккаунту.`, `${name} is already connected to this account.`);
  return tr(`${name} ulandi. Endi u orqali ham shu akkauntga kirasiz.`, `${name} подключён. Теперь через него тоже можно войти в этот аккаунт.`, `${name} connected. You can now sign in to this account with it too.`);
}
