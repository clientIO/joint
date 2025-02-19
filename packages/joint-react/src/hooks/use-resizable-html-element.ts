import { useRef } from 'react'

export function useResizableHtmlElement<T extends HTMLElement>() {
  const htmlElement = useRef<T>(null)

  return htmlElement
}
