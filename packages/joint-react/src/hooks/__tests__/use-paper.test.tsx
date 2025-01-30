import { GraphProvider } from '../../components/graph-provider'
import { PaperProvider } from '../../components/paper-provider'
import { usePaper } from '../use-paper'
import { renderHook } from '@testing-library/react'

describe('use-paper', () => {
  it('should create a new paper when no PaperProvider is present', () => {
    const { result } = renderHook(() => usePaper(), {
      wrapper: GraphProvider,
    })
    expect(result.current.el).toBeDefined()
  })

  it('should return the paper from the context if it is present', () => {
    const { result } = renderHook(() => usePaper(), {
      wrapper: ({ children }) => (
        <GraphProvider>
          <PaperProvider>{children}</PaperProvider>
        </GraphProvider>
      ),
    })
    expect(result.current.el).toBeDefined()
  })
})
