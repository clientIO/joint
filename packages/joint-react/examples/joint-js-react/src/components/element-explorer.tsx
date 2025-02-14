import { dia } from '@joint/core'
import { compose } from '../compose'
import { Element } from '../types'
import { useSetElement } from '../../../../src'
import { CLIP_PATH_STYLE } from '../nodes/base-node'
import { useEffect, useMemo, useRef } from 'react'
import { GenericDataExplorer } from './generic-data-explorer'

interface Props {
  element: Element
  isSelected: boolean
  setSelectedId: (id: dia.Cell.ID) => void
}
export function ElementExplorer(props: Props) {
  const {
    element: { componentType, data, id },
    setSelectedId,
    isSelected,
  } = props
  const divElement = useRef<HTMLDivElement>(null)
  const setElementData = useSetElement(id, 'data')
  useEffect(() => {
    // scroll to element when isSelected
    if (!isSelected || !divElement.current) {
      return
    }
    divElement.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [isSelected])

  const clonedData = useMemo(() => JSON.parse(JSON.stringify(data ?? '')), [data])
  return (
    <div
      ref={divElement}
      onClick={() => setSelectedId(id)}
      style={CLIP_PATH_STYLE}
      className={compose(
        'px-4 py-2 rounded-md my-1 mx-3 flex flex-col transition-all duration-500 cursor-pointer text-sm',
        isSelected ? 'bg-primary' : 'bg-white'
      )}
    >
      <h2 className="text-sm font-bold">
        {componentType} {props.element.id}
      </h2>
      <GenericDataExplorer data={clonedData} setData={setElementData} />
    </div>
  )
}
