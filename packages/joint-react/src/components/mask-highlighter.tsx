import { memo, useEffect, useId } from 'react'
import { useCellId } from '../hooks/use-cell-id'
import { usePaper } from '../hooks/use-paper'
import { highlighters } from '@joint/core'

interface MaskHighlighterProps extends React.SVGProps<SVGPathElement> {
  readonly layer?: string
  readonly selector?: string
}

const DEFAULT_MASK_HIGHLIGHTER_PROPS: MaskHighlighterProps = {
  stroke: '#4666E5',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  fill: 'none',
}
export function Component(props: MaskHighlighterProps) {
  const { layer, selector, ...svgAttributes } = props
  const id = useCellId()
  const paper = usePaper()
  const highlighterId = useId()
  useEffect(() => {
    if (!paper) return

    // Find the cell view corresponding to the current element
    const cellView = paper.findViewByModel(id)
    const highlighter = highlighters.mask.add(cellView, { selector }, highlighterId, {
      layer,
      attrs: {
        ...DEFAULT_MASK_HIGHLIGHTER_PROPS,
        ...svgAttributes,
      },
    })
    return () => {
      highlighter.remove()
    }
  }, [highlighterId, id, layer, paper, selector, svgAttributes])
  return null
}

export const MaskHighlighter = memo(Component)
