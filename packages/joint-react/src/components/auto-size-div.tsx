import { forwardRef } from 'react'
import { useCellId } from '../hooks/use-cell-id'
import { useCombinedRefs } from '../hooks/use-combined-refs'
import { useElementAutoSize } from '../hooks/use-element-auto-size'
/**
 * Joint js div with auto sizing parent node based on this div.
 * When this div changes, it will automatically resize the parent node element (change width and height of parent cell).
 *
 * It uses all properties as HTMLDivElement.
 */
function Component(
  props: Readonly<React.HTMLAttributes<HTMLDivElement>>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>
) {
  const id = useCellId()
  const divElement = useElementAutoSize<HTMLDivElement>(id)

  const combinedRef = useCombinedRefs(divElement, forwardedRef)
  return <div {...props} ref={combinedRef} />
}

export const AutoSizeDiv = forwardRef(Component)
