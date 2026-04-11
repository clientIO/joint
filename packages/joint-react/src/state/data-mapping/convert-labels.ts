import { type dia } from '@joint/core';
import type { LinkLabel } from '../../types/data-types';
import { linkLabel } from '../../presets/link-labels';

/**
 * Converts a simplified LinkLabel record to an array of JointJS labels.
 * @param labels - Record of simplified label definitions keyed by label ID
 * @param labelStyle - Optional style defaults for label properties
 * @returns Array of full JointJS label definitions with IDs
 */
export function convertLabels(
  labels: Record<string, LinkLabel>,
  labelStyle?: Partial<LinkLabel>
): Array<dia.Link.Label & { id: string }> {
  return Object.entries(labels).map(([id, rawLabel]) => {
    const label = labelStyle ? { ...labelStyle, ...rawLabel } : rawLabel;
    return {
      id,
      ...linkLabel(label),
    };
  });
}
