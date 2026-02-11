import type { dia } from '@joint/core';
import { createElementsSizeObserver } from '../create-elements-size-observer';
import type { GraphElement } from '../../types/element-types';

/**
 * Helper to capture the ResizeObserver callback so we can trigger it manually in tests.
 */
function setupResizeObserverMock() {
  let capturedCallback: ResizeObserverCallback | null = null;

  globalThis.ResizeObserver = jest.fn().mockImplementation((callback: ResizeObserverCallback) => {
    capturedCallback = callback;
    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
  });

  return {
    triggerResize(entries: Array<Partial<ResizeObserverEntry>>) {
      if (!capturedCallback) throw new Error('ResizeObserver not created yet');
      capturedCallback(entries as ResizeObserverEntry[], {} as ResizeObserver);
    },
  };
}

function createEntry(
  target: Element,
  inlineSize: number,
  blockSize: number
): Partial<ResizeObserverEntry> {
  return {
    target,
    borderBoxSize: [{ inlineSize, blockSize } as ResizeObserverSize],
  };
}

describe('createElementsSizeObserver', () => {
  it('should not propagate 0x0 size to the model when element becomes hidden', () => {
    const mock = setupResizeObserverMock();
    const onBatchUpdate = jest.fn();

    const elementId = 'element-1';
    let currentWidth = 100;
    let currentHeight = 50;

    const elements: Record<dia.Cell.ID, GraphElement> = {
      [elementId]: {
        x: 10,
        y: 20,
        width: currentWidth,
        height: currentHeight,
        type: 'ReactElement',
      },
    };

    const observer = createElementsSizeObserver({
      getCellTransform: () => ({
        width: currentWidth,
        height: currentHeight,
        x: 10,
        y: 20,
        angle: 0,
        element: { id: elementId } as dia.Element,
      }),
      getPublicSnapshot: () => ({ elements, links: {} }),
      onBatchUpdate,
    });

    const domElement = document.createElement('div');
    observer.add({ id: elementId, element: domElement });

    // Step 1: First valid resize (simulates initial measurement)
    mock.triggerResize([createEntry(domElement, 100, 50)]);
    // No change because measured size equals current cell size
    expect(onBatchUpdate).not.toHaveBeenCalled();

    // Step 2: Resize to a different valid size so lastWidth/lastHeight are set
    mock.triggerResize([createEntry(domElement, 120, 60)]);
    expect(onBatchUpdate).toHaveBeenCalledTimes(1);
    onBatchUpdate.mockClear();

    // Update current to reflect the change
    currentWidth = 120;
    currentHeight = 60;
    elements[elementId] = { ...elements[elementId], width: 120, height: 60 };

    // Step 3: Element becomes hidden → ResizeObserver fires with 0x0
    mock.triggerResize([createEntry(domElement, 0, 0)]);

    // The 0x0 size should NOT be propagated to the model
    expect(onBatchUpdate).not.toHaveBeenCalled();

    observer.clean();
  });

  it('should propagate valid non-zero size changes', () => {
    const mock = setupResizeObserverMock();
    const onBatchUpdate = jest.fn();

    const elementId = 'element-1';

    const elements: Record<dia.Cell.ID, GraphElement> = {
      [elementId]: {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      },
    };

    const observer = createElementsSizeObserver({
      getCellTransform: () => ({
        width: 100,
        height: 50,
        x: 10,
        y: 20,
        angle: 0,
        element: { id: elementId } as dia.Element,
      }),
      getPublicSnapshot: () => ({ elements, links: {} }),
      onBatchUpdate,
    });

    const domElement = document.createElement('div');
    observer.add({ id: elementId, element: domElement });

    // Simulate ResizeObserver firing with a valid new size
    mock.triggerResize([createEntry(domElement, 200, 100)]);

    // Valid size change SHOULD be propagated
    expect(onBatchUpdate).toHaveBeenCalledTimes(1);
    const [[updatedElements]] = onBatchUpdate.mock.calls;
    expect(updatedElements[elementId].width).toBe(200);
    expect(updatedElements[elementId].height).toBe(100);

    observer.clean();
  });

  it('should not propagate size when only width is 0', () => {
    const mock = setupResizeObserverMock();
    const onBatchUpdate = jest.fn();

    const elementId = 'element-1';

    const elements: Record<dia.Cell.ID, GraphElement> = {
      [elementId]: {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      },
    };

    const observer = createElementsSizeObserver({
      getCellTransform: () => ({
        width: 100,
        height: 50,
        x: 10,
        y: 20,
        angle: 0,
        element: { id: elementId } as dia.Element,
      }),
      getPublicSnapshot: () => ({ elements, links: {} }),
      onBatchUpdate,
    });

    const domElement = document.createElement('div');
    observer.add({ id: elementId, element: domElement });

    // Simulate ResizeObserver firing with 0 width (element collapsed horizontally)
    mock.triggerResize([createEntry(domElement, 0, 50)]);

    // 0-width size should NOT be propagated
    expect(onBatchUpdate).not.toHaveBeenCalled();

    observer.clean();
  });

  it('should not propagate size when only height is 0', () => {
    const mock = setupResizeObserverMock();
    const onBatchUpdate = jest.fn();

    const elementId = 'element-1';

    const elements: Record<dia.Cell.ID, GraphElement> = {
      [elementId]: {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        type: 'ReactElement',
      },
    };

    const observer = createElementsSizeObserver({
      getCellTransform: () => ({
        width: 100,
        height: 50,
        x: 10,
        y: 20,
        angle: 0,
        element: { id: elementId } as dia.Element,
      }),
      getPublicSnapshot: () => ({ elements, links: {} }),
      onBatchUpdate,
    });

    const domElement = document.createElement('div');
    observer.add({ id: elementId, element: domElement });

    // Simulate ResizeObserver firing with 0 height (element collapsed vertically)
    mock.triggerResize([createEntry(domElement, 100, 0)]);

    // 0-height size should NOT be propagated
    expect(onBatchUpdate).not.toHaveBeenCalled();

    observer.clean();
  });
});
