import { ComponentProps, useEffect, useRef, useState } from 'react'

import { sva } from '@styled-system/css'

import { useBackdrop } from '~/hooks/backdrop'

import { Clickable } from '../../features'
import { Card } from '../card'
import { TextField } from './text-field'

interface SelectFieldChangeHandler {
  (value: Option['value']): void
}

type Option = { label?: string; value: string | number }
type Props = Omit<
  ComponentProps<typeof TextField>,
  'defaultValue' | 'label' | 'type' | 'onChange' | 'readOnly'
> & {
  label?: string
  defaultValue?: string | number
  options: Option[]
  readOnly?: boolean
  onChange?: SelectFieldChangeHandler
}

export type { SelectFieldChangeHandler }

export const SelectField = ({
  label,
  options,
  defaultValue,
  hint,
  onChange,
  ...props
}: Props) => {
  const button = useRef<null | HTMLDivElement>(null)
  const input = useRef<null | HTMLInputElement>(null)
  const backdrop = useBackdrop(button)
  const [visible, setVisible] = useState<boolean>(false)
  const [value, setValue] = useState<string | number>(
    options.find(({ value }) => value === defaultValue)?.label ?? '',
  )

  const handleFocusIn = () => {
    setVisible(true)
    backdrop.activate()
  }

  const handleSelect = (option: Option) => {
    if (!input.current) return
    input.current.value = `${option.value}`
    setValue(`${option.label ?? option.value}`)
    onChange?.(option.value)
    setVisible(false)
  }

  useEffect(() => {
    if (!button.current) return
    if (!visible) return

    function onBackdropInactive() {
      setVisible(false)
    }

    backdrop.on('inactivate', onBackdropInactive)

    return () => {
      backdrop.off('inactivate', onBackdropInactive)
    }
  }, [button, visible])

  // defaultValueが更新されたらinputも更新する
  useEffect(() => {
    if (!input.current) return
    if (!defaultValue) return
    input.current.value = '' + defaultValue
  }, [input, defaultValue])

  const c = style({})

  return (
    <div className={c.root} ref={button}>
      <input ref={input} type="hidden" {...props} />
      <TextField
        label={label}
        endIcon="caret-down"
        defaultValue={value}
        hint={hint}
        onFocus={handleFocusIn}
        readOnly="no-color"
      />
      {visible && (
        <div className={c.menu}>
          <Card elevation="1">
            {options.map((option) => (
              <Clickable
                key={option.value}
                fullWidth
                onClick={() => handleSelect(option)}
              >
                <div className={c.button}>
                  {option.label ?? `${option.value}`}
                </div>
              </Clickable>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}

const style = sva({
  slots: ['root', 'menu', 'menu__item', 'menu__item__content', 'button'],
  base: {
    root: {
      position: 'relative',
    },
    menu: {
      position: 'absolute',
      width: 'fit-content',
      padding: '0.5rem 0',
      zIndex: 100,
    },
    menu__item: {
      width: '100%',
      padding: '0.8rem 1rem',
      _hover: {
        background: '#f5f5f5',
      },
    },
    button: {
      position: 'relative',
      display: 'block',
      minWidth: '10rem',
      padding: '0.4rem 0.8rem',
      fontSize: 'sm',
      _hover: {
        _after: {
          content: '""',
          display: 'block',
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
          opacity: '0.6',
        },
      },
    },
  },
})
