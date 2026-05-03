import { type dia } from '@joint/core';
import type { LinkJSONInit, LinkRecord } from '../../types/cell.types';
import { linkAttributes } from '../../presets/link-attributes';
import { mergeLabelsFromAttributes } from './convert-labels-reverse';

/**
 * Forward mapper using the React default link type.
 * @param link
 */
export function mapLinkToAttributes(link: LinkJSONInit): dia.Link.JSONInit {
  const attributes = linkAttributes(link) as dia.Link.JSONInit;
  // `data` is a @joint/react concept — defaulted here, not in framework-neutral presets.
  attributes.data ??= {};
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
): LinkRecord<LinkData> {
  const {
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

  return { ...linkRecord } as LinkRecord<LinkData>;
}

/** Function signature that maps raw JointJS link attributes to a `LinkRecord`. */
export type MapAttributesToLink<LinkData = unknown> = typeof mapAttributesToLink<LinkData>;

/** Function signature that maps a `LinkRecord` back to JointJS link attributes. */
export type MapLinkToAttributes = typeof mapLinkToAttributes;
