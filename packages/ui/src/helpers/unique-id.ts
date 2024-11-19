function zeroPadding(value: number, length: number) {
  return (Array(length).join('0') + value).slice(-length)
}

let count = 0
export const uniqueId = (prefix?: string) => {
  return `${prefix ? `${prefix}_` : ''}${zeroPadding(++count, 3)}`
}
