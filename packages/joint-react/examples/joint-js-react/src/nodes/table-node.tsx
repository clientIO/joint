import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useElementEffect, useSetElement } from '../../../../src'
import { TableElement } from '../types'
import { BaseNode, NodeProps } from './base-node'
import { compose } from '../compose'

interface Props<T> extends TableElement {
  isSelected?: boolean
  className?: string
  onClick?: NodeProps<T>['onClick']
  pressValue?: NodeProps<T>['pressValue']
}

let uniqueRowName = 0
export function TableNode<T>(props: Props<T>) {
  const {
    data: { columns, rows },
    className,
    isSelected,
    onClick,
    pressValue,
    id,
  } = props

  const inputRef = useRef<HTMLInputElement>(null)
  const setElementData = useSetElement<TableElement>(id, 'data')
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const hasSelectedSomeItem =
    selectedRowIndex !== null && selectedRowIndex >= 0 && selectedRowIndex < rows.length
  useLayoutEffect(() => {
    if (isSelected) {
      inputRef.current?.focus()
    }
  }, [isSelected])

  const addRow = useCallback(() => {
    // TODO: FIX Typescript inside useSetElement
    setElementData((data) => {
      setSelectedRowIndex(data.rows.length)
      return {
        ...data,
        rows: [...data.rows, Array(data.columns.length).fill(`Row ${uniqueRowName++}`)],
      }
    })
  }, [setElementData])

  const removeRow = useCallback(() => {
    setElementData((data) => {
      const newRows = data.rows.filter((_, index) => index !== selectedRowIndex)
      return {
        ...data,
        rows: newRows,
      }
    })
  }, [selectedRowIndex, setElementData])
  const hasRows = rows.length > 0

  const rowsCount = rows.length
  useElementEffect(
    id,
    (element) => {
      console.log({ isSelected })

      const portSpacing = 45 // Space between ports
      const startY = 80 // First port position

      const ports = {
        groups: {
          out: {
            position: {
              name: 'line',
              args: {
                start: { x: 'calc(w)', y: startY },
                end: { x: 'calc(w)' },
              },
            },
            attrs: {
              circle: {
                r: 6,
                magnet: 'active',
                cursor: 'pointer',
                fill: '#000000',
                stroke: '#FFFFFF',
                strokeWidth: 1.5,
              },
            },
          },
          in: {
            position: {
              name: 'line',
              args: {
                start: { x: 0, y: startY },
                end: { x: 0 },
              },
            },
            attrs: {
              circle: {
                r: 6,
                magnet: 'passive', // Allows connections but doesn't initiate them

                fill: '#FFFFFF',
                stroke: '#000000',
                strokeWidth: 1.5,
              },
            },
          },
        },
        items: rows.flatMap((item, index) => [
          {
            id: `in-${item}`,
            group: 'in',
            args: {
              y: startY + index * portSpacing,
            },
          },
          {
            id: `out-${item}`,
            group: 'out',
            args: {
              y: startY + index * portSpacing,
            },
          },
        ]),
      }
      element.set('ports', ports)
    },
    [isSelected, rowsCount]
  )

  if (!hasRows) {
    return (
      <BaseNode
        id={id}
        style={{
          width: columns.length * 110,
          height: 'auto',
        }}
        className={className}
        isSelected={isSelected}
        pressValue={pressValue}
        onClick={onClick}
      >
        <div className={compose('text-center m-4', isSelected && 'text-white')}>No Rows found!</div>
        <button onClick={addRow} className="btn  bg-primaryText/50 text-white">
          Add row
        </button>
      </BaseNode>
    )
  }
  return (
    <BaseNode
      id={id}
      style={{
        width: columns.length * 110,
        height: 'auto',
      }}
      className={className}
      isSelected={isSelected}
      pressValue={pressValue}
      onClick={onClick}
    >
      <div className="overflow-x-auto overflow-y-auto max-h-96">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isSelected = selectedRowIndex === index
              return (
                <tr
                  onClick={() => setSelectedRowIndex(index)}
                  className={compose('cursor-pointer', isSelected && 'bg-base-200')}
                  key={index}
                >
                  {row.map((cell, index) => (
                    <td key={index}>{cell}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {isSelected && (
        <div className="flex flex-row items-center w-full justify-end mt-2">
          <div className="flex flex-1">
            {hasSelectedSomeItem && (
              <button onClick={removeRow} className="btn  bg-primaryText/50 text-white">
                Remove row
              </button>
            )}
          </div>
          <button onClick={addRow} className="btn  bg-primaryText/50 text-white">
            Add row
          </button>
        </div>
      )}
    </BaseNode>
  )
}
