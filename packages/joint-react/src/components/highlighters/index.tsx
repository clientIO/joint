/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
/* eslint-disable prefer-destructuring */
import { Mask } from './mask';
import { Opacity } from './opacity';
import { Stroke } from './stroke';
import { Custom } from './custom';

export type { MaskHighlighterProps } from './mask';
export type { OpacityHighlighterProps } from './opacity';
export type { StrokeHighlighterProps } from './stroke';
export type { OnCreateHighlighter as OnAddHighlighter, CustomHighlighterProps } from './custom';

const Component = {
  Mask,
  Opacity,
  Stroke,
  Custom,
};

/**
 * Highlighter components.
 * @group Components
 * @example
 * ```tsx
 * import { Highlighter } from '@joint/react'
 * return <Highlighter.Mask />
 * ```
 * @example
 * ```tsx
 * import { Highlighter } from '@joint/react'
 * return <Highlighter.Opacity />
 * ```
 * @example
 * ```tsx
 * import { Highlighter } from '@joint/react'
 * return <Highlighter.Stroke />
 * ```
 * @example
 * ```tsx
 * import { Highlighter } from '@joint/react'
 * return <Highlighter.Custom />
 * ```
 */
export namespace Highlighter {
  /**
   * Mask highlighter component.
   * Adds a stroke around an arbitrary cell view's SVG node.
   * @see https://docs.jointjs.com/api/highlighters/#mask
   * @group Components
   * @example
   * ```tsx
   * import { Highlighter } from '@joint/react'
   * return <Highlighter.Mask />
   * ```
   */
  export const Mask = Component.Mask;
  /**
   * Opacity highlighter component.
   * Changes the opacity of an arbitrary cell view's SVG node.
   * @see https://docs.jointjs.com/api/highlighters/#opacity
   * @group Components
   * @example
   * ```tsx
   * import { Highlighter } from '@joint/react'
   * return <Highlighter.Opacity />
   * ```
   */
  export const Opacity = Component.Opacity;
  /**
   * Stroke highlighter component.
   * Adds a stroke around an arbitrary cell view's SVG node.
   * @see https://docs.jointjs.com/api/highlighters/#stroke
   * @group Components
   * @example
   * ```tsx
   * import { Highlighter } from '@joint/react'
   * return <Highlighter.Stroke />
   * ```
   */
  export const Stroke = Component.Stroke;

  /**
   * Custom highlighter component.
   * Allows to create a custom highlighter.
   * @group Components
   * @example
   * ```tsx
   * import { Highlighter } from '@joint/react'
   * return <Highlighter.Custom />
   * ```
   */

  export const Custom = Component.Custom;
}
