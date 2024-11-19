import { ReactElement, ReactNode, useState } from 'react'

import { sva } from '@styled-system/css'

import { Clickable } from './clickable'
import { Flex, FlexItem } from './flex'
import { Icon } from './icon'
import { Spacer } from './spacer'

type Props = {
  opener: ReactElement
  content: ReactNode
}

export const Collapse = ({ opener, content }: Props) => {
  const [collapsed, setCollapsedState] = useState<boolean>(true)

  const handleClickOpener = () => {
    setCollapsedState((state) => !state)
  }

  const c = style()

  return (
    <div className={c.root}>
      <div className={c.opener}>
        <Clickable fullWidth onClick={handleClickOpener}>
          <Flex>
            <FlexItem grow>{opener}</FlexItem>
            <FlexItem fixed>
              <span className={c.opener__icon}>
                <Icon name={!collapsed ? 'chevron-up' : 'chevron-down'} />
              </span>
            </FlexItem>
          </Flex>
        </Clickable>
      </div>
      {!collapsed && (
        <div className={c.content}>
          <Spacer size="sm">{content}</Spacer>
        </div>
      )}
    </div>
  )
}

const style = sva({
  slots: ['root', 'opener', 'opener__icon', 'content'],
  base: {
    root: {},
    opener: {},
    opener__icon: {
      fontSize: 'xs',
    },
    content: {},
  },
})
