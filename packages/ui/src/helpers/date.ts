import dayjs from 'dayjs'

type DateInput = string | Date

export function toISOString(input: DateInput) {
  return dayjs(input).toISOString()
}

export function toFormat(input: DateInput, format?: string) {
  return dayjs(input).format(format)
}

export function parseDate(input: DateInput, format?: string) {
  return dayjs(input, format).toDate()
}
