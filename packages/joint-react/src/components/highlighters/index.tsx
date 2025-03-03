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
export type { OnAddHighlighter, CustomHighlighterProps } from './custom';

const Component = {
  Mask,
  Opacity,
  Stroke,
  Custom,
};

/**
 * Highlighter components.
 * @group Components
 *
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
 *
 * * @example
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
  export const Mask = Component.Mask;
  export const Opacity = Component.Opacity;
  export const Stroke = Component.Stroke;
  export const Custom = Component.Custom;
}
