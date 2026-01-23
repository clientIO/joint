import type { dia } from '@joint/core';

/**
 * Position options for link labels.
 * Similar to Joint.js label position system.
 */
export interface LinkLabelPosition {
  /**
   * Distance along the link (0-1 for relative, or absolute pixels with absoluteDistance: true).
   * 0 = start, 0.5 = middle, 1 = end
   */
  readonly distance?: number;
  /**
   * Offset from the link path.
   * Can be a number (perpendicular offset) or an object with x and y (absolute offset).
   */
  readonly offset?: number | { readonly x: number; readonly y: number };
  /**
   * Rotation angle in degrees.
   */
  readonly angle?: number;
  /**
   * Additional position arguments (e.g., absoluteDistance, reverseDistance, absoluteOffset).
   */
  readonly args?: Record<string, unknown>;
}

/**
 * Props for the LinkLabel component.
 */
export interface LinkLabelProps {
  /**
   * Position of the label along the link.
   */
  readonly position: LinkLabelPosition;
  /**
   * Optional unique identifier for the label.
   * If not provided, the label will be identified by its index in the labels array.
   */
  readonly id?: string;
  /**
   * Children to render inside the label portal.
   */
  readonly children?: React.ReactNode;
  /**
   * Label attributes.
   */
  readonly attrs?: dia.Link.Label['attrs'];
  /**
   * Label size.
   */
  readonly size?: dia.Link.Label['size'];
}
