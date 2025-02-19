import { useLayoutEffect, useRef } from 'react'
import { useSetElement } from '@joint/react'
import { AlertElement } from '../types'
import { BaseNode, NodeProps } from './base-node'

interface Props<T> extends AlertElement {
  isSelected?: boolean
  className?: string
  onClick?: NodeProps<T>['onClick']
  pressValue?: NodeProps<T>['pressValue']
}

export function AlertNode<T>(props: Props<T>) {
  const {
    data: { textValue, title, subtitle, isError },
    className,
    isSelected,
    onClick,
    pressValue,
    id,
  } = props

  const inputRef = useRef<HTMLInputElement>(null)
  const setElementData = useSetElement(id, 'data')

  useLayoutEffect(() => {
    if (isSelected) {
      inputRef.current?.focus()
    }
  }, [isSelected])

  let svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 shrink-0 stroke-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )

  if (isError) {
    svg = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  }

  return (
    <BaseNode
      id={id}
      style={{
        width: 250,
        height: 'auto',
      }}
      className={className}
      isSelected={isSelected}
      pressValue={pressValue}
      onClick={onClick}
    >
      <div className="relative flex flex-row items-start">
        <span className="mt-0.5">{svg}</span>
        <div className="flex flex-col">
          <span className="font-bold ml-2">{title}</span>
          <span className="text-sm ml-2">{subtitle}</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={textValue}
        placeholder="Alert text"
        className="input input-bordered w-full max-w-xs mt-4 h-10"
        onChange={(event) => {
          const textValue = event.target.value
          setElementData({ ...props.data, textValue })
        }}
      />
    </BaseNode>
  )
}
