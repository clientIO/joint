import { util } from '@joint/core';
import { linkLabels } from './link-labels';
import { linkStyle } from './link-style';
import type { dia } from '@joint/core';
import type { LinkStyle } from './link-style';
import type { LinkLabel } from './link-labels';

/**
 * Extra declarative link fields the React presets understand on top of a native
 * `dia.Link.Attributes`: `style`, `labelMap`, and `labelStyle`.
 * @group Types
 */
export interface LinkPresetAttributes {
  /** Visual styling for the link's line and markers, expanded into `attrs` by {@link linkStyle}. */
  style?: LinkStyle;
  /** Labels keyed by id; each value is a {@link LinkLabel} expanded by {@link linkLabels}, and its key becomes the label's stable `id`. */
  labelMap?: Record<string, LinkLabel>;
  /** Shared {@link LinkLabel} styling merged into every `labelMap` entry before that entry's own values. */
  labelStyle?: Partial<LinkLabel>;
}

/**
 * A link description for {@link linkAttributes}: native `dia.Link.Attributes`
 * plus the React preset shorthands `style`, `labelMap`, and `labelStyle`. No
 * `type` is required.
 * @expand
 * @group Types
 */
export interface LinkAttributes extends dia.Link.Attributes, LinkPresetAttributes {}

/**
 * Expands the declarative React link shorthand (`style`, `labelMap`) into the
 * native attributes JointJS understands, so you can describe a link with the
 * friendly preset fields instead of raw `attrs` and `labels`.
 *
 * - `style` → SVG `attrs` via {@link linkStyle}.
 * - `labelMap` → a native `labels` array via {@link linkLabels}.
 * - `labels` (array) → passed through unchanged.
 * @param link - The link record to convert.
 * @returns JointJS-compatible cell attributes.
 * @throws When `link` is not an object, or when both `labelMap` and `labels` are set on the same link.
 * @example
 * Expand the declarative preset input into native attributes and hand them to
 * a cell model:
 * ```tsx
 * import { LinkModel, linkAttributes } from '@joint/react';
 *
 * const link = new LinkModel(
 *   linkAttributes({
 *     source: { id: 'a' },
 *     target: { id: 'b' },
 *     style: { color: '#333', width: 2 },           // preset shorthand
 *     labelMap: { mid: { text: 'edge', position: 0.5 } },
 *   })
 * );
 * ```
 * @group Presets
 */
export function linkAttributes(link: LinkAttributes): dia.Link.Attributes {
  if (!util.isObject(link)) {
    throw new TypeError('Invalid link data: expected an object with link properties.');
  }

  const { style, labelMap, labels, ...attributes } = link;

  if (style) {
    attributes.attrs = linkStyle(style);
    attributes.style = style;
  }

  if (labelMap) {
    if (labels) {
      throw new Error('Cannot use both "labelMap" and "labels" on the same link.');
    }
    attributes.labels = linkLabels(labelMap, link.labelStyle);
    attributes.labelMap = labelMap;
  } else if (labels) {
    attributes.labels = labels;
  }

  return attributes;
}
