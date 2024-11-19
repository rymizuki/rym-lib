import { ReactElement } from 'react'

import { css, sva } from '@styled-system/css'

export const Table = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<string, any>,
>({
  columns,
  data,
  scrollable,
}: {
  data?: T[]
  columns: {
    label?: string
    prop?: keyof T
    fixed?: boolean
    render?: (row: T) => ReactElement | null | ''
  }[]
  scrollable?: boolean
}) => {
  const c = style({ scrollable })
  const raw = style.raw({})
  const fixed_columns = columns.filter(({ fixed }) => fixed === true)
  const loose_columns = columns.filter(({ fixed }) => fixed !== true)
  return (
    <div className={c.root}>
      <div className={c.scroller}>
        <table className={c.table}>
          <thead>
            <tr className={c.tr}>
              {loose_columns.map(({ label }, index) => (
                <th key={index} className={c.th}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((row, index) => (
              <tr key={index} className={c.tr}>
                {loose_columns.map(({ prop, render }, index) => (
                  <td key={index} className={c.td}>
                    {prop ? row[prop] : render ? render(row) : ''}
                  </td>
                ))}
                {fixed_columns.map(({ prop, render }, index) => (
                  <td
                    key={index}
                    className={c.td}
                    style={{ width: '6rem', maxWidth: 'fit-content' }}
                  >
                    {prop ? row[prop] : render ? render(row) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {scrollable && fixed_columns.length > 0 && (
        <table
          className={css(
            raw.table,
            css.raw({
              position: 'absolute',
              top: 0,
              right: 0,
              width: '6rem',
              maxWidth: 'fit-content',
              minWidth: 'auto',
              background: 'white',
            }),
          )}
        >
          <thead>
            <tr className={c.tr}>
              {fixed_columns.map(({ label }, index) => (
                <th key={index} className={c.th}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((row, index) => (
              <tr key={index} className={c.tr}>
                {fixed_columns.map(({ prop, render }, index) => (
                  <td key={index} className={c.td}>
                    {prop ? row[prop] : render ? render(row) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const style = sva({
  slots: ['root', 'scroller', 'table', 'tr', 'th', 'td'],
  base: {
    root: {
      position: 'relative',
    },
    scroller: {},
    table: {
      width: '100%',
      minWidth: '100%',
      borderSpacing: '0',
    },
    tr: {},
    th: {
      height: '48px',
      padding: '0 16px',
      fontSize: '0.75rem',
      textAlign: 'left',
      borderBottom: 'thin solid rgba(0, 0, 0, 0.12)',
      color: '#00000099',
      userSelect: 'none',
    },
    td: {
      height: '48px',
      padding: '0 16px',
      fontSize: '0.875rem',
      textAlign: 'left',
      transition: 'height 0.2s cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  variants: {
    scrollable: {
      true: {
        root: {},
        scroller: {
          overflow: 'auto',
        },
        table: {
          width: 'max-content',
        },
      },
      false: {},
    },
  },
  defaultVariants: {
    scrollable: false,
  },
})
