/** Outcome of connecting a login method, as the user should hear it. */
export function connectMessage(name: string, outcome: string | undefined): string {
  if (outcome === 'merged') return `${name} ulandi. U orqali ochilgan akkauntdagi havolalar, QR kodlar va sozlamalar shu akkauntga ko‘chirildi.`;
  if (outcome === 'already-connected') return `${name} bu akkauntga allaqachon ulangan.`;
  return `${name} ulandi. Endi u orqali ham shu akkauntga kirasiz.`;
}
