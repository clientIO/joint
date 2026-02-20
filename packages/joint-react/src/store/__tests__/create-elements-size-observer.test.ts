/* eslint-disable prefer-destructuring */
/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable @typescript-eslint/no-require-imports */
import type { dia } from '@joint/core';
import type { GraphStoreSnapshot } from '../graph-store';
import type { GraphElement } from '../../types/element-types';
import type { GraphStoreObserver } from '../create-elements-size-observer';

// Mock ResizeObserver for testing
// eslint-disable-next-line sonarjs/public-static-readonly
let mockResizeObserverInstances: MockResizeObserver[] = [];

class MockResizeObserver {
  private callback: ResizeObserverCallback;
  private observedElements = new Map<Element, ResizeObserverEntry>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    mockResizeObserverInstances.push(this);
  }

  observe(target: Element) {
    // Simulate an entry with initial size
    const entry = this.createEntry(target, 100, 50);
    this.observedElements.set(target, entry);
  }

  unobserve(target: Element) {
    this.observedElements.delete(target);
  }

  disconnect() {
    this.observedElements.clear();
  }

  // Test helper to simulate resize
  triggerResize(target: Element, width: number, height: number) {
    const entry = this.createEntry(target, width, height);
    this.observedElements.set(target, entry);
    this.callback([entry], this as unknown as ResizeObserver);
  }

  // Test helper to trigger callback for all observed elements
  triggerAllCallbacks() {
    const entries = [...this.observedElements.values()];
    if (entries.length > 0) {
      this.callback(entries, this as unknown as ResizeObserver);
    }
  }

  private createEntry(target: Element, width: number, height: number): ResizeObserverEntry {
    return {
      target,
      contentRect: {
        width,
        height,
        top: 0,
        left: 0,
        bottom: height,
        right: width,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      },
      borderBoxSize: [{ inlineSize: width, blockSize: height }],
      contentBoxSize: [{ inlineSize: width, blockSize: height }],
      devicePixelContentBoxSize: [{ inlineSize: width, blockSize: height }],
    } as ResizeObserverEntry;
  }

  static getLastInstance(): MockResizeObserver | undefined {
    return mockResizeObserverInstances.at(-1);
  }

  static clearInstances() {
    mockResizeObserverInstances = [];
  }
}

// Replace global ResizeObserver with mock
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe('createElementsSizeObserver', () => {
  let observer: GraphStoreObserver;
  let mockOnBatchUpdate: jest.Mock;
  let mockGetCellTransform: jest.Mock;
  let mockGetPublicSnapshot: jest.Mock;
  let mockElements: Record<dia.Cell.ID, GraphElement>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let createElementsSizeObserver: any;

  beforeEach(() => {
    MockResizeObserver.clearInstances();

    // Reset modules and reimport to ensure the mock is used
    jest.resetModules();
    // Re-assign the mock after reset to ensure it's used
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    // eslint-disable-next-line unicorn/prefer-module
    createElementsSizeObserver =
      require('../create-elements-size-observer').createElementsSizeObserver;

    mockElements = {
      'element-1': { x: 0, y: 0, width: 1, height: 1, type: 'ReactElement' },
      'element-2': { x: 100, y: 100, width: 1, height: 1, type: 'ReactElement' },
    };

    mockOnBatchUpdate = jest.fn();
    mockGetCellTransform = jest.fn((id: dia.Cell.ID) => ({
      width: 1,
      height: 1,
      x: 0,
      y: 0,
      angle: 0,
      element: { id } as dia.Element,
    }));
    mockGetPublicSnapshot = jest.fn(
      () =>
        ({
          elements: mockElements,
          links: {},
        }) as GraphStoreSnapshot
    );

    observer = createElementsSizeObserver({
      onBatchUpdate: mockOnBatchUpdate,
      getCellTransform: mockGetCellTransform,
      getPublicSnapshot: mockGetPublicSnapshot,
    });
  });

  afterEach(() => {
    observer.clean();
  });

  describe('add', () => {
    it('should register element with ResizeObserver', () => {
      const element = document.createElement('div');

      observer.add({ id: 'element-1', element });

      expect(observer.has('element-1')).toBe(true);
    });

    it('should return cleanup function that unregisters element', () => {
      const element = document.createElement('div');

      const cleanup = observer.add({ id: 'element-1', element });
      expect(observer.has('element-1')).toBe(true);

      cleanup();
      expect(observer.has('element-1')).toBe(false);
    });

    it('should handle multiple elements', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');

      observer.add({ id: 'element-1', element: element1 });
      observer.add({ id: 'element-2', element: element2 });

      expect(observer.has('element-1')).toBe(true);
      expect(observer.has('element-2')).toBe(true);
    });

    it('should process ResizeObserver callback when element is added', () => {
      const element = document.createElement('div');

      observer.add({ id: 'element-1', element });

      // Trigger resize via ResizeObserver (simulates browser behavior)
      const resizeObserver = MockResizeObserver.getLastInstance();
      expect(resizeObserver).toBeDefined();
      resizeObserver?.triggerResize(element, 100, 50);

      expect(mockOnBatchUpdate).toHaveBeenCalledTimes(1);

      const updateCall = mockOnBatchUpdate.mock.calls[0][0];
      expect(updateCall['element-1']).toBeDefined();
      expect(updateCall['element-1'].width).toBe(100);
      expect(updateCall['element-1'].height).toBe(50);
    });

    it('should handle multiple elements with ResizeObserver', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');

      observer.add({ id: 'element-1', element: element1 });
      observer.add({ id: 'element-2', element: element2 });

      // Trigger resize for both elements
      const resizeObserver = MockResizeObserver.getLastInstance();
      resizeObserver?.triggerResize(element1, 100, 50);
      resizeObserver?.triggerResize(element2, 200, 100);

      expect(mockOnBatchUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('ResizeObserver callback', () => {
    it('should process size changes from ResizeObserver', () => {
      const element = document.createElement('div');

      observer.add({ id: 'element-1', element });

      const resizeObserver = MockResizeObserver.getLastInstance();
      expect(resizeObserver).toBeDefined();

      // Trigger initial resize
      resizeObserver?.triggerResize(element, 100, 50);
      expect(mockOnBatchUpdate).toHaveBeenCalledTimes(1);

      // Trigger resize to a different size
      resizeObserver?.triggerResize(element, 200, 100);

      // Should be called again for the resize
      expect(mockOnBatchUpdate).toHaveBeenCalledTimes(2);
    });

    it('should not update if size has not changed significantly', () => {
      const element = document.createElement('div');

      observer.add({ id: 'element-1', element });

      const resizeObserver = MockResizeObserver.getLastInstance();

      // Trigger initial resize
      resizeObserver?.triggerResize(element, 100, 50);
      expect(mockOnBatchUpdate).toHaveBeenCalledTimes(1);
      mockOnBatchUpdate.mockClear();

      // Trigger resize with same size (within epsilon of 0.5)
      resizeObserver?.triggerResize(element, 100.1, 50.1);

      // Should not trigger update because change is within epsilon
      expect(mockOnBatchUpdate).not.toHaveBeenCalled();
    });

    it('should use transform function when provided', () => {
      const element = document.createElement('div');
      const transform = jest.fn(({ width, height }) => ({
        width: width + 20,
        height: height + 20,
      }));

      observer.add({ id: 'element-1', element, transform });

      const resizeObserver = MockResizeObserver.getLastInstance();
      resizeObserver?.triggerResize(element, 100, 50);

      expect(transform).toHaveBeenCalled();

      const updateCall = mockOnBatchUpdate.mock.calls[0][0];
      expect(updateCall['element-1'].width).toBe(120); // 100 + 20
      expect(updateCall['element-1'].height).toBe(70); // 50 + 20
    });
  });

  describe('clean', () => {
    it('should remove all observed elements', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');

      observer.add({ id: 'element-1', element: element1 });
      observer.add({ id: 'element-2', element: element2 });

      expect(observer.has('element-1')).toBe(true);
      expect(observer.has('element-2')).toBe(true);

      observer.clean();

      expect(observer.has('element-1')).toBe(false);
      expect(observer.has('element-2')).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for registered elements', () => {
      const element = document.createElement('div');
      observer.add({ id: 'element-1', element });

      expect(observer.has('element-1')).toBe(true);
    });

    it('should return false for unregistered elements', () => {
      expect(observer.has('non-existent')).toBe(false);
    });
  });
});
