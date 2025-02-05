import React from 'react'
import { render } from '@testing-library/react'
import { GraphProvider } from '../graph-provider'
import { dia } from '@joint/core'
import { GraphContext } from '../../context/graph-context'
import type { GraphStore } from '../../hooks/use-create-graph-store'

describe('graph-provider', () => {
  it('should render children and match snapshot', () => {
    const { asFragment, getByText } = render(
      <GraphProvider>
        <div>Child Content</div>
      </GraphProvider>
    )
    expect(getByText('Child Content')).toMatchSnapshot()
    expect(asFragment()).toMatchSnapshot()
  })

  it('should provide a graph instance in context', () => {
    let contextGraph: GraphStore | undefined
    function TestComponent() {
      contextGraph = React.useContext(GraphContext)
      return null
    }
    render(
      <GraphProvider>
        <TestComponent />
      </GraphProvider>
    )
    expect(contextGraph).toBeInstanceOf(dia.Graph)
  })
})
