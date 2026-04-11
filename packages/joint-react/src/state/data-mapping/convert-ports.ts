import { type dia } from '@joint/core';
import type { ElementPort } from '../../types/data-types';
import { elementPort } from '../../presets/element-port';

const PORT_GROUP = 'main';

/**
 * Converts a simplified ElementPort record to the full JointJS ports object.
 * @param ports - Record of simplified port definitions keyed by port ID
 * @param portStyle - Optional style defaults for port properties
 * @returns The full JointJS ports object with groups and items
 */
export function convertPorts(ports: Record<string, ElementPort>, portStyle?: Partial<ElementPort>): {
  groups: Record<string, dia.Element.PortGroup>;
  items: dia.Element.Port[];
} {
  return {
    groups: {
      [PORT_GROUP]: {
        position: { name: 'absolute' },
      },
    },
    items: Object.entries(ports).map(([id, rawPort]) => {
      const port = portStyle ? { ...portStyle, ...rawPort } : rawPort;
      return {
        id,
        group: PORT_GROUP,
        ...elementPort(port)
      };
    }),
  };
}
