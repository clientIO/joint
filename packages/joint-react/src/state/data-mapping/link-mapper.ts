import { type dia } from '@joint/core';
import type { LinkRecord } from '../../types/data-types';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import { linkAttributes } from '../../presets/link-attributes';
import { mergeLabelsFromAttributes } from './convert-labels-reverse';
import type { CellAttributes } from '.';

/** Forward mapper using the React default link type. */
export function mapLinkToAttributes<LinkData extends object = Record<string, unknown>>(
  link: LinkRecord<LinkData>
): CellAttributes {
  const attributes = linkAttributes(link) as CellAttributes;
  if (!attributes.type) attributes.type = LINK_MODEL_TYPE;
  return attributes;
}

/**
 * Converts JointJS link attributes back to a LinkRecord.
 *
 * - `style` on model → return in record.
 * - `labelMap` on model → return `labelMap` (merge updated positions from native `labels`).
 * - No `labelMap` → return `labels` as-is.
 *
 * 1:1 mapping — no `presentation` wrapper.
 */
export function mapAttributesToLink<LinkData extends object = Record<string, unknown>>(
  attributes: dia.Link.Attributes
): LinkRecord<LinkData> {
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

  return { ...linkRecord };
}

export type MapAttributesToLink<LinkData extends object = Record<string, unknown>> =
  typeof mapAttributesToLink<LinkData>;

export type MapLinkToAttributes<LinkData extends object = Record<string, unknown>> =
  typeof mapLinkToAttributes<LinkData>;
