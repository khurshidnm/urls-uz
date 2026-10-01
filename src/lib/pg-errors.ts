/** Postgres unique_violation (23505), possibly wrapped by the driver or ORM. */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return (e?.code ?? e?.cause?.code) === '23505';
}
