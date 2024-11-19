// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StyleProps<T extends (...args: any[]) => any> = NonNullable<
  Parameters<T>[0]
>

export type RecordCommand<T, K extends keyof T> = {
  type: 'create' | 'update' | 'delete'
  record: Pick<T, K>
}

export function isNonNullable<T>(
  value: T | undefined | null | false | 0 | '',
): value is Exclude<T, undefined | null | false | 0 | ''> {
  return !!value
}
