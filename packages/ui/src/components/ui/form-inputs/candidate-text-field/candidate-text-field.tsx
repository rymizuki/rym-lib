import { ChangeEvent, ComponentProps, useEffect, useRef } from 'react'

import { useBackdrop } from '~/hooks/backdrop'

import { TextField } from '../text-field'
import { CandidateMenu } from './candidate-menu'
import { useInput } from './hooks/input'
import { useOutput } from './hooks/output'
import { useCandidateLoader } from './hooks/use-candidate-loader'
import {
  CandidateTextFieldChangeHandler,
  Item,
  LoaderFunction,
} from './interfaces'

type Props = Pick<
  ComponentProps<typeof TextField>,
  'label' | 'name' | 'hint'
> & {
  defaultValue?: Item
  readOnly?: boolean
  loader: LoaderFunction
  onChange?: CandidateTextFieldChangeHandler
}

export const CandidateTextField = ({
  name,
  label,
  hint,
  defaultValue,
  readOnly,
  loader: executor,
  onChange,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const backdrop = useBackdrop(ref)
  const input = useInput()
  const output = useOutput()
  const loader = useCandidateLoader(executor)

  // initialize
  useEffect(() => {
    function onInputInit(item: Item | undefined) {
      console.debug('[CandidateTextField]', name, 'onInputInit', item)
      output.init(item)
      loader.exec('')
    }

    function onInputSetValue(value: string) {
      console.debug('[CandidateTextField]', name, 'onInputSetValue', value)
      loader.exec(value)
    }

    function onOutputInit(item: Item | undefined) {
      console.debug('[CandidateTextField]', name, 'onOutputInit', item)
    }

    function onOutputSetValue(item: Item) {
      console.debug('[CandidateTextField]', name, 'onOutputSetValue', item)
      // input.init(item)
      onChange?.(item)
    }

    function onBackdropInactive() {
      console.debug('[CandidateTextField]', name, 'onBackdropInactive')
      input.focusOut()
    }

    function onLoaderStartLoading() {
      // console.debug('[CandidateTextField]', 'start loading')
    }

    function onLoaderEndLoading(items: Item[]) {
      console.debug('[CandidateTextField]', name, 'end loading', items)
    }

    input.on('init', onInputInit)
    input.on('value', onInputSetValue)

    output.on('init', onOutputInit)
    output.on('value', onOutputSetValue)

    backdrop.on('inactivate', onBackdropInactive)

    loader.on('loading', onLoaderStartLoading)
    loader.on('loaded', onLoaderEndLoading)

    return () => {
      input.off('init', onInputInit)
      input.off('value', onInputSetValue)
      output.off('init', onOutputInit)
      output.off('value', onOutputSetValue)
      loader.off('loading', onLoaderStartLoading)
      loader.off('loaded', onLoaderEndLoading)
      backdrop.off('inactivate', onBackdropInactive)
    }
  }, [defaultValue])

  useEffect(() => {
    input.init(defaultValue)
  }, [defaultValue])

  const handleInputFocusIn = () => {
    backdrop.activate()
    input.focusIn()
  }

  const handleInputChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value
    input.setValue(value)
  }

  const handleSelectItem = (item: Item) => {
    output.setValue(item)
    backdrop.inactivate()
  }

  return (
    <div ref={ref}>
      <input ref={output.ref} type="hidden" name={name} value={output.value} />
      <TextField
        ref={input.ref}
        key={`${input.focused}-${output.value}`}
        label={label}
        hint={hint}
        value={input.value}
        readOnly={readOnly}
        onChange={handleInputChange}
        onFocus={handleInputFocusIn}
      />
      {input.focused && (
        <CandidateMenu items={loader.data ?? []} onSelect={handleSelectItem} />
      )}
    </div>
  )
}
