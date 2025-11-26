import { createPortsStore } from '../create-ports-store';
import type { PortElementsCacheEntry } from '../create-ports-data';
import type { Vectorizer } from '@joint/core';

describe('create-ports-store', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  it('should create a ports store', () => {
    const store = createPortsStore();

    expect(store).toBeDefined();
    expect(store).toHaveProperty('getPortElement');
    expect(store).toHaveProperty('onRenderPorts');
    expect(store).toHaveProperty('subscribe');
    expect(store).toHaveProperty('destroy');
  });

  it('should get port element after setting', () => {
    const store = createPortsStore();
    const cellId = 'cell-1';
    const portId = 'port-1';
    const mockElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const portElementsCache: Record<string, PortElementsCacheEntry> = {
      [portId]: {
        portElement: mockElement as unknown as Vectorizer,
        portSelectors: {
          'react-port-portal': mockElement,
        },
        portContentElement: mockElement as unknown as Vectorizer,
      },
    };

    store.onRenderPorts(cellId, portElementsCache);
    const element = store.getPortElement(cellId, portId);

    expect(element).toBe(mockElement);
  });

  it('should return undefined for non-existent port', () => {
    const store = createPortsStore();
    const element = store.getPortElement('cell-1', 'port-1');

    expect(element).toBeUndefined();
  });

  it('should subscribe to port changes', async () => {
    const store = createPortsStore();
    const subscriber = jest.fn();

    const unsubscribe = store.subscribe(subscriber);
    store.onRenderPorts('cell-1', {});

    // Wait for async notification
    await Promise.resolve();
    jest.runAllTimers();

    expect(subscriber).toHaveBeenCalled();
    unsubscribe();
  });

  it('should unsubscribe correctly', () => {
    const store = createPortsStore();
    const subscriber = jest.fn();

    const unsubscribe = store.subscribe(subscriber);
    unsubscribe();
    store.onRenderPorts('cell-1', {});

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should clear ports on destroy', () => {
    const store = createPortsStore();
    const cellId = 'cell-1';
    const portId = 'port-1';
    const mockElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const portElementsCache: Record<string, PortElementsCacheEntry> = {
      [portId]: {
        portElement: mockElement as unknown as Vectorizer,
        portSelectors: {
          'react-port-portal': mockElement,
        },
        portContentElement: mockElement as unknown as Vectorizer,
      },
    };

    store.onRenderPorts(cellId, portElementsCache);
    store.destroy();

    const element = store.getPortElement(cellId, portId);
    expect(element).toBeUndefined();
  });

  it('should handle multiple ports for same cell', () => {
    const store = createPortsStore();
    const cellId = 'cell-1';
    const port1Element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const port2Element = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const portElementsCache: Record<string, PortElementsCacheEntry> = {
      'port-1': {
        portElement: port1Element as unknown as Vectorizer,
        portSelectors: {
          'react-port-portal': port1Element,
        },
        portContentElement: port1Element as unknown as Vectorizer,
      },
      'port-2': {
        portElement: port2Element as unknown as Vectorizer,
        portSelectors: {
          'react-port-portal': port2Element,
        },
        portContentElement: port2Element as unknown as Vectorizer,
      },
    };

    store.onRenderPorts(cellId, portElementsCache);

    expect(store.getPortElement(cellId, 'port-1')).toBe(port1Element);
    expect(store.getPortElement(cellId, 'port-2')).toBe(port2Element);
  });
});
