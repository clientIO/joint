import type { dia } from '@joint/core';
import { createPortsData, type PortElementsCacheEntry } from './create-ports-data';
import { subscribeHandler } from '../utils/subscriber-handler';

export type OnPaperRenderPorts = (
  cellId: dia.Cell.ID,
  portElementsCache: Record<string, PortElementsCacheEntry>
) => void;

export interface PortsStore {
  /**
   * Get port element
   */
  readonly getPortElement: (cellId: dia.Cell.ID, portId: string) => SVGElement | undefined;
  /**
   * Set port element
   */
  readonly onRenderPorts: OnPaperRenderPorts;
  /**
   * Subscribes to port element changes.
   */
  readonly subscribe: (onPortChange: () => void) => () => void;
  /**
   * Destroys the store and unsubscribes from events.
   * @returns Destroy function to unsubscribe from port element changes.
   */
  readonly destroy: () => void;
}

/**
 * Create a store to manage port elements in a JointJS paper.
 * @private
 * @group Data
 * @category Port
 * @returns A store object with methods to get and set port elements.
 * @example
 */
export function createPortsStore(): PortsStore {
  const portElements = createPortsData();
  const portEvents = subscribeHandler();
  return {
    subscribe: portEvents.subscribe,
    getPortElement(cellId, portId) {
      const portElement = portElements.get(cellId, portId);
      if (!portElement) {
        return;
      }
      return portElement;
    },
    onRenderPorts(cellId, portElementsCache) {
      portElements.set(cellId, portElementsCache);
      portEvents.notifySubscribers();
    },
    destroy() {
      portElements.clear();
    },
  };
}
