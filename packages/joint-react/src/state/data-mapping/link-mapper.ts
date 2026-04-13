import { type dia } from '@joint/core';
import type { LinkRecord } from '../../types/data-types';
import { LINK_MODEL_TYPE } from '../../models/link-model';
import { convertLabels } from './convert-labels';
import { mergeLabelsFromAttributes } from './convert-labels-reverse';
import { linkStyle } from '../../presets/link-style';
import { isRecord } from '../../utils/is';
import type { CellAttributes } from '.';

/**
 * Forward mapper: converts a LinkRecord to JointJS cell attributes.
 *
 * - `labelMap` → converted to native `labels` array, stored on the model for reverse mapping.
 * - `labels` (array) → passed through as-is (native JointJS format).
 * - Both present → throws an error.
 * - `style` → converted to SVG `attrs` via `linkStyle`.
 *
 * All fields are stored directly on the model (1:1 mapping, no `presentation` wrapper).
 */
export function mapLinkToAttributes<LinkData extends object = Record<string, unknown>>(
  link: LinkRecord<LinkData>
): CellAttributes {
  if (!isRecord(link)) {
    throw new Error('Invalid link data: expected an object with link properties.');
  }

  const {
    data = {} as LinkData,
    type = LINK_MODEL_TYPE,
    // Link style
    style,
    // Labels
    labelMap,
    labels,
    ...linkAttributes
  } = link;

  const attributes: CellAttributes = {
    ...linkAttributes,
    type,
    data,
  };

  // style/attrs dual-format: if `style` is present, `attrs` will be generated from it.
  if (style) {
    attributes.attrs = linkStyle(style);
    attributes.style = style;
  }

  // labelMap/labels dual-format: if `labelMap` is present, `labels` will be generated from it.
  if (labelMap) {
    if (labels) {
      throw new Error('Cannot use both "labelMap" and "labels" on the same link.');
    }
    attributes.labels = convertLabels(labelMap, link.labelStyle);
    attributes.labelMap = labelMap;
  } else if (labels) {
    attributes.labels = labels;
  }

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
    // Metadata (default-provided key tracking)
    metadata,
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

  // Remove keys that came from defaults (not user-provided) to prevent round-trip pollution.
  const omit = metadata?.omit;
  if (omit) {
    for (const key of omit) {
      Reflect.deleteProperty(linkRecord, key);
    }
  }

  return { ...linkRecord };
}

export type MapAttributesToLink<LinkData extends object = Record<string, unknown>> =
  typeof mapAttributesToLink<LinkData>;

export type MapLinkToAttributes<LinkData extends object = Record<string, unknown>> =
  typeof mapLinkToAttributes<LinkData>;
