import { sva } from '@styled-system/css'

import { StyleProps } from '~/helpers/types'

import { Clickable, ClickableProps } from '../features'

type Props = ClickableProps & Omit<StyleProps<typeof style>, 'disabled'>

export const Button = ({
  children,
  size,
  color,
  variant,
  slim,
  fullWidth,
  ...props
}: Props) => {
  const c = style({
    disabled: 'disabled' in props && props.disabled,
    size,
    color,
    slim,
    variant,
    fullWidth,
  })
  return (
    <Clickable {...props} fullWidth={fullWidth}>
      <span className={c.root}>
        <span className={c.inner}>{children}</span>
      </span>
    </Clickable>
  )
}

const style = sva({
  slots: ['root', 'inner'],
  base: {
    root: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      borderRadius: '0.4rem',
      overflow: 'hidden',
      _before: {
        position: 'absolute',
        top: '0',
        left: '0',
        content: '""',
        width: '100%',
        height: '100%',
        zIndex: 1,
        backgroundColor: 'currentColor',
        transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.6, 1)',
        opacity: 0,
      },
    },
    inner: {
      display: 'inline-block',
      fontWeight: 'normal',
      textAlign: 'center',
      width: '100%',
    },
  },
  variants: {
    disabled: {
      true: {
        root: {
          cursor: 'default',
          _hover: {
            _before: {
              opacity: 0,
            },
          },
        },
      },
      false: {
        root: {
          cursor: 'pointer',
          _hover: {
            _before: {
              opacity: '0.08',
            },
          },
        },
      },
    },
    size: {
      sm: {
        root: {
          height: '28px',
          minWidth: '52px',
          padding: '0 0.5rem',
        },
        inner: {
          fontSize: '0.75rem',
        },
      },
      md: {
        root: {
          height: '36px',
          minWidth: '64px',
          padding: '0 1rem',
        },
        inner: {
          fontSize: '0.85rem',
        },
      },
    },
    color: {
      default: {
        root: {
          backgroundColor: 'slate.50',
          color: 'gray.700',
        },
      },
      primary: {
        root: {
          backgroundColor: 'blue.700',
          color: 'white',
        },
      },
      danger: {
        root: {
          backgroundColor: 'red.600',
          color: 'white',
        },
      },
    },
    variant: {
      default: {
        root: {
          boxShadow:
            '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12)',
        },
      },
      text: {
        root: {
          background: 'transparent',
          boxShadow: 'none',
        },
      },
    },
    slim: {
      true: {},
      false: {},
    },
    fullWidth: {
      true: {
        root: {
          width: '100%',
        },
      },
      false: {
        root: {
          width: 'fit-content',
        },
      },
    },
  },
  compoundVariants: [
    // variant=default,disabled=true
    {
      color: 'default',
      disabled: true,
      variant: 'default',
      css: {
        root: {
          backgroundColor: 'gray.200',
          color: 'gray.500',
        },
      },
    },
    {
      color: 'primary',
      disabled: true,
      variant: 'default',
      css: {
        root: {},
      },
    },
    {
      color: 'danger',
      disabled: true,
      variant: 'default',
      css: {},
    },

    // variant=text
    {
      variant: 'text',
      css: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    {
      color: 'default',
      disabled: true,
      variant: 'text',
      css: {
        root: {
          color: 'gray.400',
        },
      },
    },
    {
      variant: 'text',
      color: 'danger',
      css: {
        root: {
          color: 'text.danger',
        },
      },
    },
    {
      size: 'md',
      slim: true,
      css: {
        root: {
          minWidth: '2.5rem',
          padding: '0',
        },
      },
    },
  ],
  defaultVariants: {
    disabled: false,
    size: 'md',
    color: 'default',
    variant: 'default',
  },
})
