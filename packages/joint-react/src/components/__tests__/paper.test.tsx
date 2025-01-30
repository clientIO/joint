/* eslint-disable react-perf/jsx-no-new-array-as-prop */
import { render, waitFor } from '@testing-library/react'
import { GraphProvider } from '../graph-provider'
import { PaperProvider } from '../paper-provider'
import { Paper } from '../paper'

describe('paper', () => {
  it('should render paper component without errors', async () => {
    const { asFragment, getByText } = render(
      <GraphProvider
        cells={[
          {
            id: '1',
            type: 'standard.Rectangle',
            position: { x: 10, y: 100 },
            attrs: { label: { text: 'testing-rectangle1' } },
          },
          {
            id: '2',
            type: 'standard.Rectangle',
            position: { x: 10, y: 100 },
            attrs: { label: { text: 'testing-rectangle2' } },
          },
          {
            type: 'standard.Link',
            source: { id: '1' },
            target: { id: '2' },
          },
        ]}
      >
        <PaperProvider>
          <Paper />
        </PaperProvider>
      </GraphProvider>
    )

    await waitFor(async () => {
      expect(getByText('testing-rectangle1')).toBeDefined()
      expect(getByText('testing-rectangle2')).toBeDefined()
      const fragment = asFragment()
      // remove model-id as it's auto-generated id from jointjs/core
      for (const element of fragment.querySelectorAll('[model-id]')) {
        element.removeAttribute('model-id')
      }
      expect(fragment).toMatchSnapshot()
    })
  })

  it('should call onReady with the paper instance upon mount', async () => {
    const onReadyMock = jest.fn()
    render(
      <GraphProvider>
        <PaperProvider>
          <Paper onReady={onReadyMock} />
        </PaperProvider>
      </GraphProvider>
    )
    await waitFor(() => {
      expect(onReadyMock).toHaveBeenCalledTimes(1)
      expect(onReadyMock.mock.calls[0][0].el).toBeDefined()
    })
  })
})
