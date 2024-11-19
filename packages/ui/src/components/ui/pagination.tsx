import { ComponentProps } from 'react'

import { Flex, FlexItem } from '../features'
import { Button } from './button'

type Props = {
  size?: ComponentProps<typeof Button>['size']
  pagination: {
    current: number
    rows: number
    hasNext: boolean
  }
  onPaginate: (page: number) => void
}

export const Pagination = ({ pagination, size, onPaginate }: Props) => {
  const hasPrev = pagination.current !== 1
  const hasNext = pagination.hasNext

  const handleClickPrev = () => {
    onPaginate(pagination.current - 1)
  }
  const handleClickNext = () => {
    onPaginate(pagination.current + 1)
  }

  return (
    <div>
      <Flex alignItems="center" justifyContent="center">
        <FlexItem fixed>
          <Button onClick={handleClickPrev} disabled={!hasPrev} size={size}>
            前へ
          </Button>
        </FlexItem>
        <FlexItem fixed>
          <Button onClick={handleClickNext} disabled={!hasNext} size={size}>
            次へ
          </Button>
        </FlexItem>
      </Flex>
    </div>
  )
}
