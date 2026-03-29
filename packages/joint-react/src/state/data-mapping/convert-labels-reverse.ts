import type { dia } from '@joint/core';
import type { LinkRecordLabel } from '../../types/data-types';
import type { Mutable } from '../../types';

/**
 * Merges JointJS label positions back into flat label data.
 *
 * For each JointJS label with a stored `id`, the `position.distance` and
 * `position.offset` values (which may have been updated by interactive
 * `labelMove`) are merged into the corresponding {@link LinkRecordLabel}.
 * When `offset` is absent in the JointJS label, it is removed from the
 * flat label to avoid stale values.
 * @param dataLabels - The original flat label Record (from `cell.data.labels`)
 * @param attributeLabels - The JointJS labels array (from `cell.attributes.labels`)
 * @returns A new Record with merged position/offset values
 */
export function mergeLabelsFromAttributes(
  dataLabels: Record<string, LinkRecordLabel>,
  attributeLabels: dia.Link.Label[],
): Record<string, LinkRecordLabel> {
  const mergedLabels: Record<string, LinkRecordLabel> = {};
  for (const attributeLabel of attributeLabels) {
    const { id } = (attributeLabel as dia.Link.Label & { id?: string });
    if (!id || !(id in dataLabels)) continue;
    const flatLabel: Mutable<LinkRecordLabel> = { ...dataLabels[id] };
    const pos = attributeLabel.position as dia.Link.LabelPosition | undefined;
    if (pos) {
      if (pos.distance === undefined) {
        delete flatLabel.position;
      } else {
        flatLabel.position = pos.distance;
      }
      if (pos.offset === undefined) {
        delete flatLabel.offset;
      } else {
        flatLabel.offset = pos.offset;
      }
    }
    mergedLabels[id] = flatLabel;
  }
  return mergedLabels;
}
