export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

export function isNotEmpty<T>(value: null | undefined | T[]) {
  return !isEmpty(value)
}

export function isEmpty<T>(value: null | undefined | T[]) {
  if (value === null) return true
  if (value === undefined) return true
  return value.length === 0
}
