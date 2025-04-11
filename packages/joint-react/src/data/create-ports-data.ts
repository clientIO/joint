import { util, type dia, type Vectorizer } from '@joint/core';

export const PORTAL_SELECTOR = 'react-port-portal';

export interface PortElementsCacheEntry {
  portElement: Vectorizer;
  portLabelElement?: Vectorizer | null;
  portSelectors: Record<string, SVGElement | SVGElement[]>;
  portLabelSelectors?: Record<string, SVGElement | SVGElement[]>;
  portContentElement: Vectorizer;
  portContentSelectors?: Record<string, SVGElement | SVGElement[]>;
}
/**
 * Helper function to get the id of a port element.
 * @param cellId - The id of the cell.
 * @param portId - The id of the port.
 * @returns The id of the port element.
 * @group utils
 * @category Port
 * @description
 * This function is used to get the id of a port element.
 */
function getId(cellId: dia.Cell.ID, portId: string) {
  return `${cellId}-${portId}`;
}
/**
 * Creates a data structure to manage port elements in a JointJS graph.
 * @returns An object with methods to set, get, clear, and delete port elements.
 * @group Data
 * @category Port
 */
export function createPortsData() {
  const data = {
    ports: new Map<string, SVGElement>(),
  };

  return {
    set(cellId: dia.Cell.ID, portElementsCache: Record<string, PortElementsCacheEntry>) {
      for (const portId in portElementsCache) {
        const { portSelectors } = portElementsCache[portId];
        const portalElement = portSelectors[PORTAL_SELECTOR];
        if (!portalElement) {
          throw new Error(
            `Portal element not found for port id: ${portId} via ${PORTAL_SELECTOR} selector`
          );
        }
        const element = Array.isArray(portalElement) ? portalElement[0] : portalElement;
        const id = getId(cellId, portId);
        if (util.isEqual(data.ports.get(id), element)) {
          continue;
        }
        data.ports.set(id, element);
      }
    },
    get(cellId: dia.Cell.ID, portId: string) {
      const id = getId(cellId, portId);
      return data.ports.get(id);
    },
    clear() {
      data.ports.clear();
    },
  };
}
