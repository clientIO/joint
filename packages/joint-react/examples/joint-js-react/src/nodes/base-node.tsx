import { CSSProperties, PropsWithChildren, useCallback } from 'react'
import { compose } from '../compose'
import { dia } from '@joint/core'
import { useElementAutoSize } from '../../../../src'

export interface NodeProps<T> extends PropsWithChildren {
  className?: string
  onClick?: (item: T) => void
  pressValue?: T
  isSelected?: boolean
  style?: CSSProperties
  id?: dia.Cell.ID
}
const EDGE_SIZE = 10 // px
// eslint-disable-next-line react-refresh/only-export-components
export const CLIP_PATH_STYLE: CSSProperties = {
  clipPath: `polygon(
  0px ${EDGE_SIZE}px,
  ${EDGE_SIZE}px 0px,
  calc(100% - ${EDGE_SIZE}px) 0px,
  100% ${EDGE_SIZE}px,
  100% calc(100% - ${EDGE_SIZE}px),
  calc(100% - ${EDGE_SIZE}px) 100%,
  ${EDGE_SIZE}px 100%,
  0px calc(100% - ${EDGE_SIZE}px)
)`,
}
export function BaseNode<T>({
  children,
  className,
  onClick,
  pressValue,
  isSelected,
  style,
  id,
}: NodeProps<T>) {
  const onPress = useCallback(() => onClick?.(pressValue as unknown as T), [onClick, pressValue])
  const divRef = useElementAutoSize<HTMLDivElement>(id)

  return (
    <div
      ref={divRef}
      style={{ ...CLIP_PATH_STYLE, ...style }}
      onMouseDown={onPress}
      className={compose(
        // Use one of your custom colors here:
        'text-primaryText flex items-center justify-center cursor-move transition-all duration-500 flex-col',
        isSelected ? 'bg-primary' : 'bg-white',
        // The polygon clip path for the “ticket” corners:

        className
      )}
    >
      <div className="py-4 px-4 flex flex-col flex-1">{children}</div>
    </div>
  )
}
