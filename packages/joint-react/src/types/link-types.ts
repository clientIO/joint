import type { dia, shapes } from '@joint/core';
import type { MarkerPreset } from '../theme/link-theme';

export interface StandardLinkShapesTypeMapper {
  'standard.DoubleLink': shapes.standard.DoubleLinkSelectors;
  'standard.ShadowLink': shapes.standard.ShadowLinkSelectors;
  'standard.Link': shapes.standard.LinkSelectors;
}

export type StandardLinkShapesType = keyof StandardLinkShapesTypeMapper;
/**
 * Simplified label definition for graph links.
 * @group Graph
 */
export interface GraphLinkLabel {
  /**
   * Label text content.
   */
  readonly text: string;
  /**
   * Position along the link. A number between 0 and 1 is a ratio,
   * a number greater than 1 is an absolute distance in pixels.
   */
  readonly position?: number;
  /**
   * Text color.
   */
  readonly color?: string;
  /**
   * Background color of the label rectangle.
   */
  readonly backgroundColor?: string;
  /**
   * Padding between the text and the background rectangle.
   * A single number applies uniform padding, or use `{ x, y }` for horizontal/vertical.
   * @default { x: 4, y: 2 }
   */
  readonly backgroundPadding?: number | { readonly x: number; readonly y: number };
  /**
   * CSS class name applied to the label text element.
   */
  readonly className?: string;
  /**
   * CSS class name applied to the label background rectangle.
   */
  readonly backgroundClassName?: string;
}

/**
 * Base interface for graph link.
 * It's a subset of `dia.Link` with some additional properties.
 * @group Graph
 * @see @see https://docs.jointjs.com/learn/features/shapes/links/#dialink
 */
export interface GraphLink extends Record<string, unknown> {
  /**
   * Source element id or endpoint definition.
   */
  readonly source: dia.Cell.ID | dia.Link.EndJSON;
  /**
   * Target element id or endpoint definition.
   */
  readonly target: dia.Cell.ID | dia.Link.EndJSON;
  /**
   * Optional link type.
   * @default 'standard.Link'
   */
  readonly type?: string;
  /**
   * Z index of the link.
   */
  readonly z?: number;
  /**
   * Layer id for the link.
   */
  readonly layer?: string;
  /**
   * Optional link markup.
   */
  readonly markup?: dia.MarkupJSON;
  /**
   * Default label configuration.
   */
  readonly defaultLabel?: dia.Link.Label;
  /**
   * Link labels.
   */
  readonly labels?: GraphLinkLabel[];
  /**
   * Link vertices (waypoints).
   */
  readonly vertices?: dia.Link.Vertex[];
  /**
   * Link router configuration.
   */
  readonly router?: unknown;
  /**
   * Link connector configuration.
   */
  readonly connector?: unknown;
  /**
   * Attributes of the link.
   */
  readonly attrs?: dia.Cell.Selectors;
  /**
   * Stroke color of the link line.
   * @default '#333333'
   */
  readonly color?: string;
  /**
   * Stroke width of the link line.
   * @default 2
   */
  readonly width?: number;
  /**
   * Source marker preset name or custom marker definition.
   * Use 'none' or null for no marker.
   * @default 'none'
   */
  readonly sourceMarker?: MarkerPreset | dia.SVGMarkerJSON | null;
  /**
   * Target marker preset name or custom marker definition.
   * Use 'none' or null for no marker.
   * @default 'none'
   */
  readonly targetMarker?: MarkerPreset | dia.SVGMarkerJSON | null;
  /**
   * CSS class name to apply to the link line.
   * @default ''
   */
  readonly className?: string;
  /**
   * Stroke dash pattern for the link line (e.g., '5,5' for dashed).
   * @default ''
   */
  readonly pattern?: string;
}
