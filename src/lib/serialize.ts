/** `T` with every Date replaced by its ISO string, as it looks after JSON serialization. */
export type Jsonified<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Jsonified<U>[]
    : T extends object
      ? { [K in keyof T]: Jsonified<T[K]> }
      : T;

/**
 * Server components hand data to client components in exactly the shape the
 * JSON API returns (dates as ISO strings), so client code sees one format.
 */
export function toClientJson<T>(value: T): Jsonified<T> {
  // JSON.stringify(undefined) is undefined, which JSON.parse can't read (e.g. a user without a bio page)
  if (value === undefined) return undefined as Jsonified<T>;
  return JSON.parse(JSON.stringify(value));
}
