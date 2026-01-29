import type { dia } from '@joint/core';

/**
 * Cache entry for batched port updates.
 */
export interface PortUpdateCacheEntry {
  /** Ports to add or update by port ID */
  ports?: Map<string, dia.Element.Port>;
  /** Port IDs to remove */
  portsToRemove?: Set<string>;
  /** Port groups to add or update by group ID */
  groups?: Map<string, dia.Element.PortGroup>;
  /** Port group IDs to remove */
  groupsToRemove?: Set<string>;
}

/**
 * Merges port item updates into the current ports array.
 * @param currentPorts - Current port items array
 * @param entry - Cache entry containing port updates
 * @returns Merged port items array
 */
export function mergePortItems(
  currentPorts: dia.Element.Port[],
  entry: PortUpdateCacheEntry
): dia.Element.Port[] {
  // Start with current ports, filter out removed ones
  const filteredPorts = entry.portsToRemove
    ? currentPorts.filter((port) => {
        const portId = port.id;
        if (!portId) {
          return true;
        }
        return !entry.portsToRemove!.has(portId);
      })
    : [...currentPorts];

  // Add/update ports
  if (!entry.ports) {
    return filteredPorts;
  }

  const mergedPorts = [...filteredPorts];
  for (const [portId, portData] of entry.ports) {
    const existingIndex = mergedPorts.findIndex((port) => port.id === portId);
    if (existingIndex === -1) {
      mergedPorts.push(portData);
      continue;
    }
    mergedPorts[existingIndex] = portData;
  }

  return mergedPorts;
}

/**
 * Merges port group updates into the current groups object.
 * @param currentGroups - Current port groups object
 * @param entry - Cache entry containing port updates
 * @returns Merged port groups object
 */
export function mergePortGroups(
  currentGroups: Record<string, dia.Element.PortGroup> | undefined,
  entry: PortUpdateCacheEntry
): Record<string, dia.Element.PortGroup> {
  const mergedGroups = { ...currentGroups };

  // Remove groups
  if (entry.groupsToRemove) {
    for (const groupId of entry.groupsToRemove) {
      if (groupId) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete mergedGroups[groupId];
      }
    }
  }

  // Add/update groups
  if (entry.groups) {
    for (const [groupId, groupData] of entry.groups) {
      mergedGroups[groupId] = groupData;
    }
  }

  return mergedGroups;
}

/**
 * Merges port updates into the current ports structure.
 * @param currentPorts - Current port items array
 * @param currentGroups - Current port groups object
 * @param entry - Cache entry containing port updates
 * @returns Merged ports and groups
 */
export function mergePortUpdates(
  currentPorts: dia.Element.Port[],
  currentGroups: Record<string, dia.Element.PortGroup> | undefined,
  entry: PortUpdateCacheEntry
): {
  readonly ports: dia.Element.Port[];
  readonly groups: Record<string, dia.Element.PortGroup>;
} {
  return {
    ports: mergePortItems(currentPorts, entry),
    groups: mergePortGroups(currentGroups, entry),
  };
}

/**
 * Sets a port on a port cache entry.
 * @param entry
 * @param portId
 * @param portData
 */
export function setPort(entry: PortUpdateCacheEntry, portId: string, portData: dia.Element.Port): void {
  entry.ports = entry.ports ?? new Map();
  entry.ports.set(portId, portData);
}

/**
 * Marks a port for removal on a port cache entry.
 * @param entry
 * @param portId
 */
export function removePort(entry: PortUpdateCacheEntry, portId: string): void {
  entry.portsToRemove = entry.portsToRemove ?? new Set();
  entry.portsToRemove.add(portId);
}

/**
 * Sets a port group on a port cache entry.
 * @param entry
 * @param groupId
 * @param groupData
 */
export function setPortGroup(entry: PortUpdateCacheEntry, groupId: string, groupData: dia.Element.PortGroup): void {
  entry.groups = entry.groups ?? new Map();
  entry.groups.set(groupId, groupData);
}

/**
 * Marks a port group for removal on a port cache entry.
 * @param entry
 * @param groupId
 */
export function removePortGroup(entry: PortUpdateCacheEntry, groupId: string): void {
  entry.groupsToRemove = entry.groupsToRemove ?? new Set();
  entry.groupsToRemove.add(groupId);
}
