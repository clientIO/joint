import { dia } from '@joint/core'
import { useElements } from '../../../../src'
import { elementsSelector } from '../types'
import { ElementExplorer } from './element-explorer'
import { MiniMap } from './minimap'
import { NoDataPlaceholder } from './no-data-placeholder'

export function ElementsExplorer({
  selectedId,
  setSelectedId,
  isMinimapEnabled,
}: {
  selectedId?: dia.Cell.ID
  setSelectedId: (id: dia.Cell.ID) => void
  isMinimapEnabled: boolean
  setIsMinimapEnabled: (enabled: boolean) => void
}) {
  const elements = useElements(elementsSelector)
  const hasElements = elements.length > 0
  if (!hasElements) {
    return null
  }
  return (
    <div className="flex w-80 flex-col max-w-80 min-w-80 overflow-hidden">
      <span className="text-xs text-white/30 mx-3 mb-0.5">Elements Explorer</span>

      {hasElements ? (
        <div className="flex flex-col overflow-y-auto min-h-96">
          {elements.map((element) => {
            return (
              <ElementExplorer
                setSelectedId={setSelectedId}
                isSelected={selectedId === element.id}
                key={element.id}
                element={element}
              />
            )
          })}
        </div>
      ) : (
        <NoDataPlaceholder setSelectedId={setSelectedId} />
      )}

      {isMinimapEnabled && <MiniMap selectedId={selectedId} />}
    </div>
  )
}
