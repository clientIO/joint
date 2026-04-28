import { type dia } from '@joint/core';
import type { BaseLinkRecord, WithType } from '../../types/cell.types';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import { linkAttributes } from '../../presets/link-attributes';
import { mergeLabelsFromAttributes } from './convert-labels-reverse';
import type { CellAttributes } from '.';

/**
 * Forward mapper using the React default link type.
 * @param link
 */
export function mapLinkToAttributes<LinkData = unknown>(
  link: BaseLinkRecord & WithType & { readonly data?: LinkData }
): CellAttributes {
  const attributes = linkAttributes(link) as CellAttributes;
  if (!attributes.type) attributes.type = LINK_MODEL_TYPE;
  return attributes;
}

/**
 * Link record produced by {@link mapAttributesToLink}.
 *
 * Wider than {@link import('../../types/cell.types').LinkRecord} — `type` is
 * optional (only present when the cell is a custom subclass) and the user
 * `data` field is opaque until the consumer narrows it. This shape is what the
 * controlled-mode pipeline actually emits when reading from a `dia.Cell`.
 */
export type MappedLinkRecord<LinkData = unknown> = BaseLinkRecord &
  Partial<WithType> & { readonly data?: LinkData };

/**
 * Converts JointJS link attributes back to a LinkRecord.
 *
 * - `style` on model → return in record.
 * - `labelMap` on model → return `labelMap` (merge updated positions from native `labels`).
 * - No `labelMap` → return `labels` as-is.
 *
 * 1:1 mapping — no `presentation` wrapper.
 * @param attributes
 */
export function mapAttributesToLink<LinkData = unknown>(
  attributes: dia.Link.Attributes
): MappedLinkRecord<LinkData> {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    type,
    // Labels
    labelMap,
    labels,
    // Link style
    style,
    attrs,
    // 1:1 mapping of all other fields directly on the model
    ...linkRecord
  } = attributes;

  // style/attrs dual-format: if `style` is present, `attrs` was generated from it.
  if (style) {
    linkRecord.style = style;
  } else if (attrs) {
    linkRecord.attrs = attrs;
  }

  // labelMap/labels dual-format: if `labelMap` is present, `labels` was generated from it.
  if (labelMap && Array.isArray(labels)) {
    linkRecord.labelMap = mergeLabelsFromAttributes(labelMap, labels);
  } else if (Array.isArray(labels)) {
    linkRecord.labels = labels;
  }

  // Only a custom type should be included in the link record.
  if (type && type !== LINK_MODEL_TYPE) {
    linkRecord.type = type;
  }

  return { ...linkRecord } as MappedLinkRecord<LinkData>;
}

export type MapAttributesToLink<LinkData = unknown> =
  typeof mapAttributesToLink<LinkData>;

export type MapLinkToAttributes<LinkData = unknown> =
  typeof mapLinkToAttributes<LinkData>;
