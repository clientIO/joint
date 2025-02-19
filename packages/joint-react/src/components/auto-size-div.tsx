import type { CSSProperties } from 'react'
import { forwardRef } from 'react'
import { useCellId } from '../hooks/use-cell-id'
import { useCombinedRefs } from '../hooks/use-combined-refs'
import { useSyncSizeWithElement } from '../hooks/use-sync-size-with-element'
const FO_STYLE: CSSProperties = {
  overflow: 'visible',
  position: 'relative',
}

{
  /* <g model-id="2" data-type="react" id="j_3" class="joint-cell joint-type-react joint-element joint-theme-default" transform="translate(100,200)"><foreignObject joint-selector="fo" id="v-6" width="122" height="40.5" style="overflow: visible; position: relative;"><div joint-selector="portal" id="v-7" style="width: 100%; height: 100%;"><div class="node">Node 2</div></div></foreignObject></g> */
}
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
  const divElement = useSyncSizeWithElement<HTMLDivElement>()

  const combinedRef = useCombinedRefs(divElement, forwardedRef)
  return (
    <foreignObject style={FO_STYLE}>
      <div {...props} ref={combinedRef} />
    </foreignObject>
  )
}

export const AutoSizeDiv = forwardRef(Component)
