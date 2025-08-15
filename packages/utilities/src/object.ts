export function recursiveExcludeEmptyValue<T extends Record<string, any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
  value: T,
): T {
  const ret: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const prop in value) {
    if (!Object.prototype.hasOwnProperty.call(value, prop)) {
      continue
    }
    if (value[prop] === '') {
      continue
    }
    const element = value[prop]
    if (Array.isArray(element)) {
      ret[prop] = element.map((item: unknown) =>
        typeof item === 'object'
          ? recursiveExcludeEmptyValue(item as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          : item,
      )
    } else if (element instanceof Date) {
      ret[prop] = element
    } else if (typeof element === 'object') {
      ret[prop] = recursiveExcludeEmptyValue(element)
    } else {
      ret[prop] = element
    }
  }
  return ret
}

type ArrayElement<A> = A extends Array<infer R> ? R : never

export function pick<
  T extends Record<string, unknown>,
  K extends [] | [keyof T, ...(keyof T)[]],
>(input: T, props: K): Pick<T, ArrayElement<K>> {
  return keys(input)
    .filter((prop) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (props as any[]).includes(prop)
    })
    .reduce((prev, prop) => {
      prev[prop] = input[prop]
      return prev
    }, {} as Partial<T>) as Pick<T, ArrayElement<K>>
}

export function keys<T extends Record<string, unknown>>(input: T): (keyof T)[] {
  return Object.keys(input) as (keyof T)[]
}

export function omit<
  T extends Record<string, unknown>,
  K extends [] | [keyof T, ...(keyof T)[]],
>(input: T, props: K): Omit<T, ArrayElement<K>> {
  return keys(input)
    .filter((prop) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (props as any[]).includes(prop) === false
    })
    .reduce((prev, prop) => {
      prev[prop] = input[prop]
      return prev
    }, {} as Partial<T>) as Omit<T, ArrayElement<K>>
}
