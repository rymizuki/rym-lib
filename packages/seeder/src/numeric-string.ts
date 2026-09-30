const INTEGER_STRING = /^-?\d+$/

export const isIntegerString = (value: unknown): value is string =>
  typeof value === 'string' && INTEGER_STRING.test(value)
