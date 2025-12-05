import type { dia } from '@joint/core';
import type { GraphElement } from '../../types/element-types';
import type { OmitWithoutIndexSignature } from '../../types';
import type { GraphLink } from '../../types/link-types';
import type { OnPaperRenderElement } from '../../hooks/use-element-views';
import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';
import type { PaperEvents } from '../../types/event.types';

export interface OnLoadOptions {
  readonly paper: dia.Paper;
  readonly graph: dia.Graph;
}

type ReactPaperOptionsBase = OmitWithoutIndexSignature<dia.Paper.Options, 'frozen' | 'defaultLink'>;
export interface ReactPaperOptions extends ReactPaperOptionsBase {
  /**
   * Default link for the paper - for example if there is new element added, this will be used as default.
   */
  readonly defaultLink?:
    | ((cellView: dia.CellView, magnet: SVGElement) => dia.Link | GraphLink)
    | dia.Link
    | GraphLink;
}

export type RenderElement<ElementItem extends GraphElement = GraphElement> = (
  element: ElementItem
) => ReactNode;

/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export interface PaperProps<ElementItem extends GraphElement = GraphElement>
  extends ReactPaperOptions,
    PropsWithChildren,
    PaperEvents {
  /**
   * A function that renders the element.
   * 
   * Note: JointJS works with SVG by default, so `renderElement` is appended inside an SVG node.
   * To render HTML elements, use the experimental `useHTMLOverlay` prop or an SVG `foreignObject`.
   * 
   * This is called when the data from `elementSelector` changes.
   * @example
   * Example with `global component`:
   * ```tsx
   * type BaseElementWithData = InferElement<typeof initialElements>
   * function RenderElement({ label }: BaseElementWithData) {
   *  return <HTMLElement className="node">{label}</HTMLElement>
   * }
   * ```
   * @example
   * Example with `local component`:
   * ```tsx
   * 
  type BaseElementWithData = InferElement<typeof initialElements>
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
      (element) => <HTMLElement className="node">{element.label}</HTMLElement>,
      []
  )
   * ```
   */

  readonly renderElement?: RenderElement<ElementItem>;
  /**
   * Event called when all elements are properly measured (has all elements width and height greater than 1 - default).
   * In react, we cannot detect jointjs paper render:done event properly, so we use this special event to check if all elements are measured.
   * It is useful for like onLoad event to do some layout or other operations with `graph` or `paper`.
   */
  readonly onElementsSizeReady?: (options: OnLoadOptions) => void;

  /**
   * Event called when the paper is resized.
   * It is useful for like onLoad event to do some layout or other operations with `graph` or `paper`.
   */
  readonly onElementsSizeChange?: (options: OnLoadOptions) => void;

  /**
   * The style of the paper element.
   */
  readonly style?: CSSProperties;
  /**
   * Class name of the paper element.
   */
  readonly className?: string;
  /**
   * The scale of the paper. It's useful to create for example a zoom feature or minimap Paper.
   */

  readonly scale?: number;

  /**
   * The threshold for click events in pixels.
   * If the mouse moves more than this distance, it will be considered a drag event.
   * @default 10
   */
  readonly clickThreshold?: number;

  /**
   * Enabled if renderElements is render to pure HTML elements.
   * By default, `joint/react` renderElements to SVG elements, so for using HTML elements without this prop, you need to use `foreignObject` element.
   * @experimental - this feature is still experimental and there are known issues with HTML elements rendering. Use at your own risk.
   * @default false
   */
  readonly useHTMLOverlay?: boolean;

  /**
   * A function that is called when the paper is ready.
   * @param element - The element that is being rendered
   * @param portalElement  - The portal element that is being rendered
   * @returns
   */
  readonly onRenderElement?: OnPaperRenderElement;
}
