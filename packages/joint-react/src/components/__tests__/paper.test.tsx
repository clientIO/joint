 
import { render, waitFor } from '@testing-library/react'
import { GraphProvider } from '../graph-provider'
import { PaperProvider } from '../paper-provider'
import { Paper } from '../paper'

describe('paper', () => {
  it('should render paper component without errors', async () => {
    const { asFragment, getByText } = render(
      <GraphProvider>
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
