import type { anchors, connectionPoints, dia, shapes } from '@joint/core';
import type { MarkerPreset } from '../theme/link-theme';

/**
 * Link endpoint definition.
 *
 * - A string is an element ID (connects to the element's center).
 * - An object with `x` and `y` connects to a fixed point on the canvas.
 *
 * Port, anchor, connectionPoint and magnet are specified via separate
 * top-level properties on {@link GraphLink} (e.g. `sourcePort`, `sourceAnchor`).
 * @group Graph
 */
export type GraphLinkEnd =
  | dia.Cell.ID
  | { readonly x: number; readonly y: number };

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
   * Font size of the label text.
   */
  readonly fontSize?: number;
  /**
   * Font family of the label text.
   */
  readonly fontFamily?: string;
  /**
   * CSS class name applied to the label text element.
   */
  readonly className?: string;
  /**
   * Stroke color of the label background rectangle.
   */
  readonly backgroundStroke?: string;
  /**
   * Stroke width of the label background rectangle.
   */
  readonly backgroundStrokeWidth?: number;
  /**
   * Border radius of the label background rectangle.
   */
  readonly backgroundBorderRadius?: number;
  /**
   * Opacity of the label background rectangle (0–1).
   */
  readonly backgroundOpacity?: number;
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
   * Source element id or point.
   */
  readonly source: GraphLinkEnd;
  /**
   * Target element id or point.
   */
  readonly target: GraphLinkEnd;
  /**
   * Source port id.
   */
  readonly sourcePort?: string;
  /**
   * Target port id.
   */
  readonly targetPort?: string;
  /**
   * Source anchor definition.
   * @see https://docs.jointjs.com/learn/features/links/anchors
   */
  readonly sourceAnchor?: anchors.AnchorJSON;
  /**
   * Target anchor definition.
   * @see https://docs.jointjs.com/learn/features/links/anchors
   */
  readonly targetAnchor?: anchors.AnchorJSON;
  /**
   * Source connection point definition.
   * @see https://docs.jointjs.com/learn/features/links/connection-points
   */
  readonly sourceConnectionPoint?: connectionPoints.ConnectionPointJSON;
  /**
   * Target connection point definition.
   * @see https://docs.jointjs.com/learn/features/links/connection-points
   */
  readonly targetConnectionPoint?: connectionPoints.ConnectionPointJSON;
  /**
   * Source magnet selector.
   * CSS selector of the SVG element used as the connection magnet on the source.
   */
  readonly sourceMagnet?: string;
  /**
   * Target magnet selector.
   * CSS selector of the SVG element used as the connection magnet on the target.
   */
  readonly targetMagnet?: string;
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
   * Buffer in pixels added to the link's hit area for easier interaction.
   */
  readonly wrapperBuffer?: number;
  /**
   * Stroke color of the link wrapper (outline).
   * Set to a visible color to create a double-line effect.
   * @default 'transparent'
   */
  readonly wrapperColor?: string;
  /**
   * Source marker preset name or custom marker definition.
   * Use 'none' for no marker.
   * @default 'none'
   */
  readonly sourceMarker?: MarkerPreset | dia.SVGMarkerJSON;
  /**
   * Target marker preset name or custom marker definition.
   * Use 'none' for no marker.
   * @default 'none'
   */
  readonly targetMarker?: MarkerPreset | dia.SVGMarkerJSON;
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
  /**
   * Stroke line cap for the link line.
   * @default ''
   */
  readonly lineCap?: 'butt' | 'round' | 'square';
  /**
   * Stroke line join for the link line.
   * @default ''
   */
  readonly lineJoin?: 'miter' | 'round' | 'bevel';
}
