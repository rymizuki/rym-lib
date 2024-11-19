import { toFormat, toISOString } from '~/helpers/date'

type Props = {
  children: string | Date
  format?: string
}

export const DateTime = ({ children, format }: Props) => {
  return (
    <time dateTime={toISOString(children)}>{toFormat(children, format)}</time>
  )
}
