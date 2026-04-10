import { useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import { useNodesMeasuredEffect } from '../use-node-measured-effect';
import { useMeasureNode } from '../use-measure-node';
import type { ElementsMeasuredEvent } from '../../types/event.types';
import { useElementId } from '../use-element-id';

function createMockResizeEntry(target: Element): ResizeObserverEntry {
  return {
    target,
    borderBoxSize: [{ inlineSize: 80, blockSize: 40 }],
    contentBoxSize: [{ inlineSize: 80, blockSize: 40 }],
    contentRect: { width: 80, height: 40, x: 0, y: 0, top: 0, left: 0, bottom: 40, right: 80 },
    devicePixelContentBoxSize: [],
  } as unknown as ResizeObserverEntry;
}

const PAPER_ID = 'measured-test-paper';

const ELEMENTS_WITH_SIZE: Record<
  string,
  Readonly<{ label: string; size: { width: number; height: number } }>
> = {
  a: { label: 'A', size: { width: 100, height: 50 } },
  b: { label: 'B', size: { width: 120, height: 60 } },
};

const ELEMENTS_WITHOUT_SIZE: Record<string, Readonly<{ label: string }>> = {
  a: { label: 'A' },
  b: { label: 'B' },
};

function RenderElement() {
  const id = useElementId();
  return <div>{id}</div>;
}

function RenderMeasuredElement() {
  const id = useElementId();
  const nodeRef = useRef<SVGRectElement>(null);
  useMeasureNode(nodeRef);
  return <rect ref={nodeRef} width={80} height={40} data-testid={id} />;
}

function Listener({ callback }: Readonly<{ callback: (event: ElementsMeasuredEvent) => void }>) {
  useNodesMeasuredEffect(PAPER_ID, callback);
  return null;
}

describe('useNodesMeasuredEffect', () => {
  it('fires with isInitial true for elements with explicit size (no useMeasureNode)', async () => {
    const callback = jest.fn();

    render(
      <GraphProvider elements={ELEMENTS_WITH_SIZE}>
        <Listener callback={callback} />
        <Paper id={PAPER_ID} renderElement={RenderElement} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });

    const firstCall = callback.mock.calls[0][0] as ElementsMeasuredEvent;
    expect(firstCall.isInitial).toBe(true);
    expect(firstCall.paper).toBeDefined();
    expect(firstCall.graph).toBeDefined();
  });

  it('fires with isInitial true for elements measured via useMeasureNode', async () => {
    const callback = jest.fn();

    // Mock ResizeObserver to trigger callback on observe with measured dimensions
    let resizeCallback: ResizeObserverCallback | null = null;
    const mockObserve = jest.fn().mockImplementation((target: Element) => {
      queueMicrotask(() => {
        resizeCallback?.([createMockResizeEntry(target)], {} as ResizeObserver);
      });
    });
    globalThis.ResizeObserver = jest.fn().mockImplementation((cb: ResizeObserverCallback) => {
      resizeCallback = cb;
      return { observe: mockObserve, unobserve: jest.fn(), disconnect: jest.fn() };
    });

    render(
      <GraphProvider elements={ELEMENTS_WITHOUT_SIZE}>
        <Listener callback={callback} />
        <Paper id={PAPER_ID} renderElement={RenderMeasuredElement} />
      </GraphProvider>
    );

    await waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });

    const firstCall = callback.mock.calls[0][0] as ElementsMeasuredEvent;
    expect(firstCall.isInitial).toBe(true);
    expect(firstCall.paper).toBeDefined();
    expect(firstCall.graph).toBeDefined();
  });
});
