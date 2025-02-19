import { dia } from '@joint/core'
import { useGraph } from '@joint/react'
import { compose } from '../compose'

interface Props {
  selectedId?: dia.Cell.ID
  setSelectedId: (id?: dia.Cell.ID) => void
  isMinimapEnabled: boolean
  setIsMinimapEnabled: (enabled: boolean) => void
}
export function ToolBar(props: Props) {
  const { selectedId, setSelectedId, isMinimapEnabled, setIsMinimapEnabled } = props
  const graph = useGraph()

  function duplicateSelection() {
    if (!selectedId) {
      alert('There must be a selected node to duplicate')
      return
    }
    const cell = graph.getCell(selectedId)
    const { x, y } = cell.position()
    const newCell = cell.clone()
    const OFFSET = 15
    newCell.set('position', { x: x + OFFSET, y: y + OFFSET })
    graph.addCell(newCell)
    setSelectedId(newCell.id)
  }

  function deleteSelection() {
    if (!selectedId) {
      alert('There must be a selected node to delete')
      return
    }
    graph.getCell(selectedId).remove()
    // set selection to last element
    const elements = graph.getElements()
    if (elements.length === 0) {
      setSelectedId(undefined)
      return
    }
    setSelectedId(elements[elements.length - 1].id)
  }

  const isDisabled = !selectedId
  return (
    <ul className="my-4 mx-2 mt-0 menu menu-vertical lg:menu-horizontal bg-base-200 rounded-box">
      <li className={compose(isDisabled && 'disabled')}>
        <a onClick={duplicateSelection}>Duplicate</a>
      </li>
      <li className={compose(isDisabled && 'disabled')}>
        <a onClick={deleteSelection}>Delete</a>
      </li>
      <li>
        <a onClick={() => setIsMinimapEnabled(!isMinimapEnabled)}>
          {isMinimapEnabled ? 'Disable Minimap' : 'Enable Minimap'}
        </a>
      </li>
    </ul>
  )
}
