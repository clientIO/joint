import { type dia } from '@joint/core';
import type { LinkAttributes, WithType } from '../../types/cell.types';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import { linkAttributes } from '../../presets/link-attributes';
import { mergeLabelsFromAttributes } from './convert-labels-reverse';

/**
 * Forward mapper using the React default link type.
 * @param link
 */
export function mapLinkToAttributes<LinkData = unknown>(
  link: LinkAttributes & WithType & { readonly data?: LinkData }
): dia.Cell.JSON {
  const attributes = linkAttributes(link) as dia.Cell.JSON;
  if (!attributes.type) attributes.type = LINK_MODEL_TYPE;
  return attributes;
}

/**
 * Converts JointJS link attributes back to a link record.
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
): LinkAttributes & { readonly data?: LinkData } {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
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

  return { ...linkRecord } as LinkAttributes & { readonly data?: LinkData };
}

export type MapAttributesToLink<LinkData = unknown> = typeof mapAttributesToLink<LinkData>;

export type MapLinkToAttributes<LinkData = unknown> = typeof mapLinkToAttributes<LinkData>;
