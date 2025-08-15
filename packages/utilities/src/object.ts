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
      ret[prop] = element.map((item: unknown) => {
        if (item && typeof item === 'object' && item !== null) {
          const objItem = item as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
          if (objItem instanceof Date) {
            return objItem
          }
          return recursiveExcludeEmptyValue(objItem)
        }
        return item
      })
    } else if (element && typeof element === 'object' && element !== null) {
      const objElement = element as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
      if (objElement instanceof Date) {
        ret[prop] = objElement
      } else {
        ret[prop] = recursiveExcludeEmptyValue(objElement)
      }
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
