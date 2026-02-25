import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';

/**
 * Filters cellData to only include keys present in previousData.
 * Uses new values from cellData where available, falls back to previousData values otherwise.
 * @param cellData - The cell data extracted from the graph
 * @param previousData - The previous data state whose keys define which properties to keep
 * @returns The filtered data with only properties from the previous data state
 */
export function pickPreviousKeys<T extends GraphElement | GraphLink>(
  cellData: Record<string, unknown>,
  previousData: T
): T {
  const filtered: Record<string, unknown> = {};
  const previousRecord = previousData as Record<string, unknown>;
  for (const key in previousRecord) {
    if (Object.prototype.hasOwnProperty.call(previousRecord, key)) {
      filtered[key] = key in cellData ? cellData[key] : previousRecord[key];
    }
  }
  return filtered as T;
}
