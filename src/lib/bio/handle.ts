/*
 * Bio page handles (urls.uz/b/<handle>): lowercase Latin letters and digits.
 * Handles of 5 characters or fewer are held back to be sold separately later.
 * Shared by the builder (live hint) and the server (enforcement).
 */

export const HANDLE_MIN_LENGTH = 6;
export const HANDLE_MAX_LENGTH = 30;

/** What the input keeps while typing: lowercase letters and digits only. */
export function cleanHandle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, HANDLE_MAX_LENGTH);
}

export type HandleProblem = { code: 'HANDLE_INVALID' | 'HANDLE_TOO_SHORT'; message: string };

/** Why a new handle can't be used, or null when it can. */
export function handleProblem(handle: string): HandleProblem | null {
  if (!/^[a-z0-9]+$/.test(handle) || handle.length > HANDLE_MAX_LENGTH) {
    return { code: 'HANDLE_INVALID', message: `Handle faqat lotin harflari va raqamlardan iborat bo‘lishi kerak (${HANDLE_MIN_LENGTH}–${HANDLE_MAX_LENGTH} ta belgi).` };
  }
  if (handle.length < HANDLE_MIN_LENGTH) {
    return {
      code: 'HANDLE_TOO_SHORT',
      message: `Handle kamida ${HANDLE_MIN_LENGTH} ta belgidan iborat bo‘lishi kerak. ${HANDLE_MIN_LENGTH - 1} va undan qisqa nomlar tez orada alohida to‘lov asosida taqdim etiladi.`,
    };
  }
  return null;
}
