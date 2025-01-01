import { ReactNode, useEffect, useState } from 'react'

import { sva } from '@styled-system/css'

import { StyleProps } from '~/helpers/types'

type Props = StyleProps<typeof style> & {
  children: string | ReactNode
  as?: 'span' | 'p'
  maxLength?: number
}

export const Text = ({ children, maxLength, as = 'span', ...props }: Props) => {
  const [value, setValue] = useState<string | ReactNode>(children)
  const Element = as

  useEffect(() => {
    if (typeof children !== 'string') return
    setValue(maxLength ? ellipsis(children, maxLength) : children)
  }, [children, maxLength])

  const c = style(props)

  return <Element className={c.root}>{value}</Element>
}

function ellipsis(text: string, maxLength: number) {
  const length = countMultiByteString(text)
  if (length <= maxLength) {
    return text
  }
  return `${sliceMultiByteString(text, maxLength)}...`
}

function countMultiByteString(text: string) {
  let length = 0
  for (let index = 0; index < text.length; index++) {
    length += (text[index] ?? '').match(/[ -~]/) ? 0.5 : 1
  }
  return length
}

function sliceMultiByteString(text: string, maxLength: number) {
  let output = ''
  let length = 0
  let index = 0
  while (length < maxLength) {
    const fragment = text[index]
    if (!fragment) {
      break
    }
    const isMultiByte = !fragment.match(/[ -~]/)
    output += fragment
    length += !isMultiByte ? 0.5 : 1
    index++
  }
  return output
}

const style = sva({
  slots: ['root'],
  base: {
    root: {},
  },
  variants: {
    preWrap: {
      true: {
        root: {
          whiteSpace: 'pre-wrap',
        },
      },
      false: {
        root: {
          whiteSpace: 'normal',
        },
      },
    },
    size: {
      sm: {
        root: {
          fontSize: 'sm',
        },
      },
      md: {
        root: {
          fontSize: 'md',
        },
      },
      lg: {
        root: {
          fontSize: 'lg',
        },
      },
    },
    color: {
      default: {
        root: {
          color: 'inherit',
        },
      },
      primary: {
        root: {
          color: '{colors.text.primary}',
        },
      },
      danger: {
        root: {
          color: '{colors.text.danger}',
        },
      },
      inactive: {
        root: {
          color: '{colors.text.inactive}',
        },
      },
      inherit: {
        root: {
          color: 'inherit',
        },
      },
    },
  },
  defaultVariants: {
    preWrap: false,
  },
})
