import { type dia, util } from '@joint/core';
import type { LiteralUnion } from '../types';

/**
 * A simplified link label, text plus optional styling, that {@link linkLabel}
 * expands into the raw `dia.Link.Label` markup and attrs JointJS expects.
 * @group Types
 */
export interface LinkLabel {
  /** The text shown on the link. */
  text: string;
  /** Where the label sits along the link: 0–1 is a fraction of the path, values above 1 are an absolute distance in px. @default 0.5 */
  position?: number;
  /** Shift the label off the path. A number nudges it perpendicular to the line; `{ x, y }` moves it freely. */
  offset?: number | { x: number; y: number };
  /** Text color. Empty inherits the theme default. @default '' */
  color?: string;
  /** Fill color of the label background. Empty inherits the theme default. @default '' */
  backgroundColor?: string;
  /**
   * Padding between the text and the edge of its background. A number applies to
   * both axes; an object sets each axis. @default `{ horizontal: 4, vertical: 2 }`
   */
  backgroundPadding?: number | { horizontal?: number; vertical?: number };
  /** Font size of the label text, in px. Empty inherits the theme default. @default '' */
  fontSize?: number;
  /** Font family of the label text. Empty inherits the theme default. @default '' */
  fontFamily?: string;
  /** Extra CSS class added to the label text element. @default '' */
  className?: string;
  /** Outline (stroke) color of the label background. Empty for no outline. @default '' */
  backgroundOutline?: string;
  /** Outline (stroke) width of the label background, in px. @default '' */
  backgroundOutlineWidth?: number;
  /** Corner radius of the label background, in px. Applies to the `'rect'` shape. @default 4 */
  backgroundBorderRadius?: number;
  /** Opacity of the label background, from 0 (transparent) to 1 (opaque). */
  backgroundOpacity?: number;
  /** Extra CSS class added to the label background element. @default '' */
  backgroundClassName?: string;
  /** Background outline shape: `'rect'`, `'ellipse'`, or a raw SVG path `d` string. @default 'rect' */
  backgroundShape?: LiteralUnion<'rect' | 'ellipse'>;
}

const defaultLabelStyle = {
  color: '' as string,
  fontSize: '' as number | string,
  fontFamily: '' as string,
  backgroundColor: '' as string,
  backgroundOutline: '' as string,
  backgroundOutlineWidth: '' as number | string,
  backgroundBorderRadius: 4,
  backgroundPadding: { horizontal: 4, vertical: 2 } as { readonly horizontal: number; readonly vertical: number },
  position: 0.5,
  className: '',
  backgroundClassName: '',
} as const;

/**
 * Converts a simplified {@link LinkLabel} (text, color, position, …) into the
 * `dia.Link.Label` JSON JointJS expects in a link's `labels` array.
 * @param label - The simplified link label to convert.
 * @returns A JointJS label entry ready to drop into `link.labels`.
 * @example
 * ```ts
 * import { LinkModel, linkLabel } from '@joint/react';
 *
 * const link = new LinkModel({
 *   source: { id: 'a' },
 *   target: { id: 'b' },
 *   labels: [linkLabel({ text: 'flows to', color: '#333', position: 0.5 })],
 * });
 * ```
 * @group Presets
 */
export function linkLabel(label: LinkLabel): dia.Link.Label {
  const {
    text,
    position = defaultLabelStyle.position,
    offset,
    color = defaultLabelStyle.color,
    fontSize = defaultLabelStyle.fontSize,
    fontFamily = defaultLabelStyle.fontFamily,
    backgroundColor = defaultLabelStyle.backgroundColor,
    backgroundPadding = defaultLabelStyle.backgroundPadding,
    backgroundOutline = defaultLabelStyle.backgroundOutline,
    backgroundOutlineWidth = defaultLabelStyle.backgroundOutlineWidth,
    backgroundBorderRadius = defaultLabelStyle.backgroundBorderRadius,
    backgroundOpacity,
    className = defaultLabelStyle.className,
    backgroundClassName = defaultLabelStyle.backgroundClassName,
    backgroundShape = 'rect',
  } = label;

  const ph = typeof backgroundPadding === 'number' ? backgroundPadding : backgroundPadding.horizontal ?? 0;
  const pv = typeof backgroundPadding === 'number' ? backgroundPadding : backgroundPadding.vertical ?? 0;

  const labelTextAttributes: Record<string, unknown> = {
    text,
    style: { fill: color, fontSize, fontFamily },
    textAnchor: 'middle',
    textVerticalAnchor: 'middle',
    pointerEvents: 'none',
  };

  const labelBackgroundAttributes: Record<string, unknown> = {
    style: {
      fill: backgroundColor,
      stroke: backgroundOutline,
      strokeWidth: backgroundOutlineWidth,
    },
  };

  let bodyTagName: string;
  if (backgroundShape === 'rect') {
    bodyTagName = 'rect';
    labelBackgroundAttributes.ref = 'label';
    labelBackgroundAttributes.rx = backgroundBorderRadius;
    labelBackgroundAttributes.ry = backgroundBorderRadius;
    labelBackgroundAttributes.x = `calc(x - ${ph})`;
    labelBackgroundAttributes.y = `calc(y - ${pv})`;
    labelBackgroundAttributes.width = `calc(w + ${ph * 2})`;
    labelBackgroundAttributes.height = `calc(h + ${pv * 2})`;
  } else if (backgroundShape === 'ellipse') {
    bodyTagName = 'ellipse';
    labelBackgroundAttributes.ref = 'label';
    labelBackgroundAttributes.cx = '0';
    labelBackgroundAttributes.cy = '0';
    labelBackgroundAttributes.rx = `calc(0.5 * w + ${ph})`;
    labelBackgroundAttributes.ry = `calc(0.5 * h + ${pv})`;
  } else {
    bodyTagName = 'path';
    labelBackgroundAttributes.d = backgroundShape;
    if (util.isCalcExpression(backgroundShape)) {
      labelBackgroundAttributes.ref = 'label';
    }
  }

  if (backgroundOpacity !== undefined) {
    labelBackgroundAttributes.opacity = backgroundOpacity;
  }

  const labelPosition: Record<string, unknown> = { distance: position };
  if (offset !== undefined) labelPosition.offset = offset;

  return {
    markup: [
      {
        tagName: bodyTagName,
        selector: 'labelBackground',
        className: `jj-link-label-bg ${backgroundClassName}`.trim(),
      },
      {
        tagName: 'text',
        selector: 'label',
        className: `jj-link-label ${className}`.trim(),
      },
    ],
    attrs: {
      label: labelTextAttributes,
      labelBackground: labelBackgroundAttributes,
    },
    position: labelPosition,
  };
}

/**
 * Converts a keyed map of {@link LinkLabel} definitions into the array of JointJS
 * labels a link expects, running each through {@link linkLabel}. The map key
 * becomes the label's stable `id`, so you can address a label later without
 * relying on array order.
 * @param labels - The map of label id to its simplified definition.
 * @param labelStyle - Shared styling merged into every label before its own values.
 * @returns The labels array — each entry is a JointJS label whose `id` is its map key.
 * @example
 * ```ts
 * import { LinkModel, linkLabels } from '@joint/react';
 *
 * const link = new LinkModel({
 *   source: { id: 'a' },
 *   target: { id: 'b' },
 *   labels: linkLabels(
 *     { name: { text: 'orders' }, card: { text: '1..*', position: 0.9 } },
 *     { fontSize: 12 } // applied to every label
 *   ),
 * });
 * ```
 * @group Presets
 */
export function linkLabels(
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
