import {
  forwardRef,
  InputHTMLAttributes,
  ReactElement,
  useEffect,
  useState,
} from 'react'

import { sva } from '@styled-system/css'

import { Icon, IconName } from '../../features'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'readOnly'> & {
  label?: string
  hint?: string | ReactElement
  endIcon?: IconName
  readOnly?: boolean | 'no-color'
}

export const TextField = forwardRef<HTMLInputElement, Props>(
  ({ label, endIcon, hint, readOnly, ...props }, ref) => {
    const [value, setValue] = useState(props.defaultValue || props.value || '')
    const [focus, setFocus] = useState<boolean>(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFocusIn = (ev: any) => {
      setFocus(true)
      props.onFocus?.(ev)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFocusOut = (ev: any) => {
      setFocus(false)
      setValue(ev.target.value)
      props.onBlur?.(ev)
    }

    useEffect(() => {
      if (!ref || !('current' in ref) || !ref.current) return
      function onFocus() {
        setFocus(true)
      }
      const element = ref.current
      element.addEventListener('focus', onFocus)
      return () => element.removeEventListener('focus', onFocus)
    }, [ref])

    const active = focus
      ? true
      : value
        ? true
        : props.defaultValue
          ? true
          : props.value
            ? true
            : false

    const c = style({
      focus,
      active,
      readOnly: readOnly && readOnly !== 'no-color',
    })

    return (
      <div className={c.root}>
        <div className={c.formControl}>
          <div className={c.field}>
            {label && <label className={c.label}>{label}</label>}
            <input
              {...props}
              ref={ref}
              key={`${props.name}-${props.defaultValue}`}
              className={c.control}
              readOnly={readOnly ? true : false}
              onFocus={handleFocusIn}
              onBlur={handleFocusOut}
            />
            {endIcon && (
              <div className={c.after_icon}>
                <Icon name={endIcon} />
              </div>
            )}
          </div>
        </div>
        {hint && <p className={c.hint}>{hint}</p>}
      </div>
    )
  },
)

const style = sva({
  slots: [
    'root',
    'formControl',
    'field',
    'label',
    'control',
    'after_icon',
    'hint',
  ],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
    },
    formControl: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      paddingTop: '1.5rem',
      _before: {
        content: '""',
        position: 'absolute',
        left: '0',
        bottom: '-1px',
        width: '100%',
        verticalAlign: 'inherit',
        borderStyle: 'solid',
        borderWidth: 'thin 0 0 0',
        textDecoration: 'inherit',
        transition: '0.3s cubic-bezier(0.25, 0.8, 0.5, 1)',
      },
      _after: {
        backgroundColor: 'currentColor',
        borderStyle: 'solid',
        borderWidth: 'thin 0 thin 0',
        bottom: '-1px',
        content: '""',
        left: '0',
        position: 'absolute',
        transition: '0.3s cubic-bezier(0.25, 0.8, 0.5, 1)',
        width: '100%',
        textDecoration: 'inherit',
        verticalAlign: 'inherit',
      },
    },
    field: {
      position: 'relative',
      display: 'flex',
      borderBottom: '1px solid 0000006b',
      width: '100%',
    },
    label: {
      fontSize: '1rem',
      minHeight: '8px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      height: '20px',
      lineHeight: '20px',
      position: 'absolute',
      left: 0,
      right: 'auto',
      transformOrigin: 'top left',
      transition: '0.3s cubic-bezier(0.25, 0.8, 0.5, 1)',
    },
    control: {
      flex: '1 1 auto',
      lineHeight: '20px',
      padding: '8px 0 8px',
      width: '100%',
      maxWidth: '100%',
      minWidth: '0px',
      minHeight: '32px',
      boxShadow: 'none',
      color: '#000000de',
      userSelect: 'none',
      fontSize: 'sm',
      outline: 0,
    },
    after_icon: {
      position: 'absolute',
      top: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      width: '1.5rem',
      height: '100%',
    },
    hint: {
      marginTop: '0.5rem',
      fontSize: 'sm',
      color: 'gray.500',
    },
  },
  variants: {
    focus: {
      false: {
        formControl: {
          _before: {
            borderColor: '#0000006b',
          },
          _after: {
            borderColor: 'currentColor',
            transform: 'scaleX(0)',
          },
        },
        label: {
          color: '#00000099',
        },
      },
      true: {
        formControl: {
          _before: {
            borderColor: 'rgba(0, 0, 0, 0.87)',
          },
          _after: {
            color: '#1976d2',
            caretColor: '#1976d2',
            transform: 'scaleX(1)',
          },
        },
        label: {
          color: '#1976d2',
          caretColor: '#1976d2',
        },
      },
    },
    active: {
      false: {
        label: {
          top: '6px',
          maxWidth: '90%',
        },
        control: {
          opacity: 0,
        },
      },
      true: {
        label: {
          top: '0',
          maxWidth: '133%',
          transform: 'translateY(-18px) scale(0.75)',
          pointerEvents: 'none',
        },
        control: {
          opacity: 1,
        },
      },
    },
    readOnly: {
      true: {
        control: {
          color: 'gray.500',
        },
      },
      false: {},
    },
  },
  defaultVariants: {
    active: false,
    focus: false,
  },
})
