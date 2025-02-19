import { ReactElement, useGraph } from '@joint/react'

export function NoDataPlaceholder({ setSelectedId }: { setSelectedId: (id: number) => void }) {
  const graph = useGraph()
  return (
    <div className="text-white/30 text-center flex flex-1 items-center justify-center flex-col h-full">
      No elements
      <button
        onClick={() => {
          graph.addCell(
            new ReactElement<Element>({
              id: '1',
              position: { x: 100, y: 100 },
              componentType: 'alert',
              data: {
                title: 'Warning text',
                subtitle: 'This is a subtitle for the warning',
                textValue: 'hello',
              },
            })
          )
          setSelectedId(1)
        }}
        className="btn btn-primary h-8 mt-2"
      >
        Add Element
      </button>
    </div>
  )
}
