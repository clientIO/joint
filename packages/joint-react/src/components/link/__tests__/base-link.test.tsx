/* eslint-disable unicorn/consistent-function-scoping */
 
import { render, waitFor } from '@testing-library/react';
import { getTestGraph, paperRenderLinkWrapper } from '../../../utils/test-wrappers';
import { dia } from '@joint/core';
import { BaseLink } from '../base-link';

describe('BaseLink', () => {
  const getTestWrapper = () => {
    const graph = getTestGraph();
    return {
      graph,
      wrapper: paperRenderLinkWrapper({
        graphProviderProps: {
          graph,
          elements: [
            {
              id: 'element-1',
              x: 0,
              y: 0,
              width: 100,
              height: 100,
            },
            {
              id: 'element-2',
              x: 200,
              y: 200,
              width: 100,
              height: 100,
            },
          ],
          links: [
            {
              id: 'link-1',
              source: 'element-1',
              target: 'element-2',
            },
          ],
        },
      }),
    };
  };

  it('should set stroke attribute correctly', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(<BaseLink stroke="blue" />, { wrapper });
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      expect(link).toBeInstanceOf(dia.Link);
      const line = link.attr('line');
      expect(line?.stroke).toBe('blue');
    });
    unmount();
  });

  it('should set strokeWidth attribute correctly', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(<BaseLink strokeWidth={3} />, { wrapper });
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.strokeWidth).toBe(3);
    });
    unmount();
  });

  it('should set strokeDasharray attribute correctly', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(<BaseLink strokeDasharray="5,5" />, { wrapper });
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.strokeDasharray).toBe('5,5');
    });
    unmount();
  });

  it('should set strokeDashoffset attribute correctly', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(<BaseLink strokeDashoffset={10} />, { wrapper });
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.strokeDashoffset).toBe(10);
    });
    unmount();
  });

  it('should set strokeLinecap attribute correctly', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(<BaseLink strokeLinecap="round" />, { wrapper });
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.strokeLinecap).toBe('round');
    });
    unmount();
  });

  it('should set strokeLinejoin attribute correctly', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(<BaseLink strokeLinejoin="bevel" />, { wrapper });
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.strokeLinejoin).toBe('bevel');
    });
    unmount();
  });

  it('should set fill attribute correctly', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(<BaseLink fill="red" />, { wrapper });
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.fill).toBe('red');
    });
    unmount();
  });

  it('should set opacity attribute correctly', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(<BaseLink opacity={0.5} />, { wrapper });
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.opacity).toBe(0.5);
    });
    unmount();
  });

  it('should set multiple attributes correctly', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(
      <BaseLink stroke="green" strokeWidth={4} strokeDasharray="10,5" opacity={0.8} />,
      { wrapper }
    );
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.stroke).toBe('green');
      expect(line?.strokeWidth).toBe(4);
      expect(line?.strokeDasharray).toBe('10,5');
      expect(line?.opacity).toBe(0.8);
    });
    unmount();
  });

  it('should restore default attributes on unmount', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { unmount } = render(<BaseLink stroke="blue" strokeWidth={5} />, { wrapper });
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.stroke).toBe('blue');
      expect(line?.strokeWidth).toBe(5);
    });
    unmount();

    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.stroke).toBe('#333333');
    });
  });

  it('should update attributes when props change', async () => {
    const { graph, wrapper } = getTestWrapper();
    const { rerender } = render(<BaseLink stroke="red" />, { wrapper });
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.stroke).toBe('red');
    });

    rerender(<BaseLink stroke="purple" strokeWidth={6} />);
    await waitFor(() => {
      const link = graph.getCell('link-1');
      if (!link) {
        throw new Error('Link not found in graph');
      }
      const line = link.attr('line');
      expect(line?.stroke).toBe('purple');
      expect(line?.strokeWidth).toBe(6);
    });
  });
});
