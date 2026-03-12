import type { dia } from '@joint/core';
import type { FlatElementData } from '../../types/element-types';
import type { OmitWithoutIndexSignature } from '../../types';
import type { FlatLinkData } from '../../types/link-types';
import type { PortalSelector } from '../../models/react-paper.types';
import type { OnPaperRenderElement } from '../../hooks/use-element-views';
import type { ElementsMeasuredEvent } from '../../types/event.types';
import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';

type ReactPaperOptionsBase = OmitWithoutIndexSignature<
  dia.Paper.Options,
  'frozen' | 'defaultLink' | 'autoFreeze' | 'viewManagement'
>;
export interface ReactPaperOptions extends ReactPaperOptionsBase {
  /**
   * Default link for the paper - for example if there is new element added, this will be used as default.
   */
  readonly defaultLink?:
    | ((cellView: dia.CellView, magnet: SVGElement) => dia.Link | Partial<FlatLinkData>)
    | dia.Link
    | Partial<FlatLinkData>;
}

export type RenderElement<ElementData = FlatElementData> = (element: ElementData) => ReactNode;

export type RenderLink<LinkData = FlatLinkData> = (link: LinkData) => ReactNode;

/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export interface PaperProps<ElementData = FlatElementData>
  extends ReactPaperOptions,
    PropsWithChildren {
  /**
   * Width of the paper host element.
   *
   * Precedence for width is:
   * 1. `width` prop
   * 2. `style.width`
   * 3. CSS width from `className`
   *
   * When this prop is omitted, the Paper component falls back to `style.width`.
   * If both are omitted, width is left unset so host CSS can size the paper.
   */
  readonly width?: dia.Paper.Dimension;
  /**
   * Height of the paper host element.
   *
   * Precedence for height is:
   * 1. `height` prop
   * 2. `style.height`
   * 3. CSS height from `className`
   *
   * When this prop is omitted, the Paper component falls back to `style.height`.
   * If both are omitted, height is left unset so host CSS can size the paper.
   */
  readonly height?: dia.Paper.Dimension;
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

  readonly renderElement?: RenderElement<ElementData>;
  /**
   * A function that renders the link.
   *
   * Note: JointJS works with SVG by default, so `renderLink` content is appended inside an SVG node.
   * To render HTML elements, use an SVG `foreignObject`.
   *
   * This is called when the link data changes.
   * @example
   * Example with `global component`:
   * ```tsx
   * function RenderLink({ id, ...data }) {
   *   return (
   *     <>
   *       <BaseLink attrs={{ line: { stroke: 'blue' } }} />
   *       <LinkLabel position={{ distance: 0.5 }}>
   *         <text>Label</text>
   *       </LinkLabel>
   *     </>
   *   );
   * }
   * ```
   * @example
   * Example with `local component`:
   * ```tsx
   * const renderLink: RenderLink<BaseLinkWithData> = useCallback(
   *   (link) => (
   *     <>
   *       <BaseLink attrs={{ line: { stroke: link.color } }} />
   *       <LinkLabel position={{ distance: 0.5 }}>
   *         <text>{link.label}</text>
   *       </LinkLabel>
   *     </>
   *   ),
   *   []
   * )
   * ```
   */
  readonly renderLink?: RenderLink<FlatLinkData>;
  /**
   * Called when element sizes are measured or re-measured.
   *
   * Fires on initial measurement (all elements have `width` and `height` greater than 1)
   * and on subsequent size changes detected by the paper.
   *
   * The callback receives `{ isInitial, paper, graph }` to distinguish the
   * first measurement from subsequent ones.
   *
   * Also available as the `'elements:measured'` paper event via `usePaperEvents`.
   */
  readonly onElementsMeasured?: (event: ElementsMeasuredEvent) => void;
  /**
   * Inline styles applied to the paper host element.
   *
   * For sizing, `style.width` and `style.height` are used only when the matching
   * `width` / `height` props are not provided.
   */
  readonly style?: CSSProperties;
  /**
   * CSS classes applied to the paper host element.
   *
   * Class-based sizing is lowest priority and is used only when the matching
   * `width` / `height` prop and `style.width` / `style.height` are omitted.
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
   *
   */
  readonly useSVGElements?: boolean;

  /**
   * A function that is called when the paper is ready.
   * @param element - The element that is being rendered
   * @param portalElement  - The portal element that is being rendered
   * @returns
   */
  readonly onRenderElement?: OnPaperRenderElement;

  /**
   * Selector used to locate the React portal target node inside a cell view.
   *
   * By default, only cells whose markup contains the `'__portal__'` selector
   * (i.e. {@link ReactElement}) are rendered via `renderElement`.
   * Set this to a different selector (e.g. `'root'`) to render into
   * built-in or custom JointJS shapes.
   *
   * A function receives the cell view and the default selector, and returns
   * a selector string or `null` to skip rendering for that cell.
   * @example
   * ```tsx
   * // Render into the 'root' selector of all shapes
   * <Paper portalSelector="root" renderElement={...} />
   * ```
   * @example
   * ```tsx
   * // Use a function for conditional rendering
   * <Paper portalSelector={(cellView, defaultSelector) => {
   *   if (cellView.model.get('type') === 'standard.Rectangle') return 'root';
   *   return defaultSelector;
   * }} renderElement={...} />
   * ```
   */
  readonly portalSelector?: PortalSelector;
}
