import type { dia } from '@joint/core';
import type { LinkRecord } from '../../types/data-types';
import type { OmitWithoutIndexSignature } from '../../types';
import type { PortalSelector } from '../../models/portal-paper.types';
import type { OnPaperRenderElement } from '../../hooks/use-element-views';
import type { PortalPaper } from '../../models/portal-paper';
import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';
import type { ConnectionEnd, CanConnectOptions, ValidateConnectionContext } from '../../presets/can-connect';
import type { ValidateEmbeddingContext, ValidateUnembeddingContext } from '../../presets/can-embed';
import type { ConnectionStrategyOptions, ConnectionStrategyContext } from '../../presets/connection-strategy';

type PortalPaperOptionsBase = OmitWithoutIndexSignature<
  dia.Paper.Options,
  'frozen' | 'defaultLink' | 'validateConnection' | 'validateEmbedding' | 'validateUnembedding' | 'connectionStrategy' | 'autoFreeze' | 'viewManagement'
>;

/** Context passed to the `defaultLink` factory. */
export interface DefaultLinkContext {
  /** The source end of the connection being created. */
  readonly source: ConnectionEnd;
  /** The paper instance. */
  readonly paper: dia.Paper;
  /** The graph instance. */
  readonly graph: dia.Graph;
}

export interface PortalPaperOptions extends PortalPaperOptionsBase {
  /**
   * Defines the link created when the user starts dragging from a port or element.
   *
   * Can be a factory function receiving connection context, a static `LinkRecord`,
   * or a `dia.Link` instance.
   */
  readonly defaultLink?:
    | ((context: DefaultLinkContext) => dia.Link | Partial<LinkRecord>)
    | dia.Link
    | Partial<LinkRecord>;

  /**
   * Validates whether a connection between two elements/ports is allowed.
   *
   * - **Function**: custom validation with built-in rules (no self-loops, no link-to-link, no multi-links).
   *   Receives `{ source, target, endType, paper, graph }`.
   * - **Object**: `CanConnectOptions` with built-in rules and optional `validate` callback.
   *
   * When omitted, defaults to `canConnect()` (no self-loops, no link-to-link, no multi-links).
   */
  readonly validateConnection?:
    | CanConnectOptions
    | ((context: ValidateConnectionContext) => boolean);

  /**
   * Decides how the end JSON is stored when the user drops a link end.
   *
   * - **Function**: receives `{ end, model, magnet, dropPoint, endType, link, paper, graph }`
   *   and returns the modified `EndJSON`.
   * - **Object**: `ConnectionStrategyOptions` with `pin` preset and/or `customize` callback.
   */
  readonly connectionStrategy?:
    | ConnectionStrategyOptions
    | ((context: ConnectionStrategyContext) => dia.Link.EndJSON);

  /**
   * Validates whether an element can be embedded into another element.
   * Receives `{ child, parent, paper, graph }`.
   */
  readonly validateEmbedding?: (context: ValidateEmbeddingContext) => boolean;

  /**
   * Validates whether an element can be unembedded from its parent.
   * Receives `{ child, paper, graph }`.
   */
  readonly validateUnembedding?: (context: ValidateUnembeddingContext) => boolean;
}

/** Render function for elements. Receives user data `D` from the element's `data` field. */
export type RenderElement<ElementData extends object = Record<string, unknown>> = (
  data: ElementData
) => ReactNode;

/** Render function for links. Receives user data `D` from the link's `data` field. */
export type RenderLink<LinkData extends object = Record<string, unknown>> = (
  data: LinkData
) => ReactNode;

/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export interface PaperProps extends PortalPaperOptions, PropsWithChildren {
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
   * This is called when the element data changes.
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly renderElement?: RenderElement<any>;
  /**
   * A function that renders the link.
   *
   * Note: JointJS works with SVG by default, so `renderLink` content is appended inside an SVG node.
   * To render HTML elements, use an SVG `foreignObject`.
   * @experimental - this feature is experimental and may have limitations or issues. Use at your own risk.
   * This is called when the link data changes.
   * @example
   * Example with `global component`:
   * ```tsx
   * function RenderLink({ id, ...data }: Link) {
   *   return <text>Link {id}</text>;
   * }
   * ```
   * @example
   * Example with `local component`:
   * ```tsx
   * const renderLink: RenderLink<Link> = useCallback(
   *   (link) => <text>{link.source} → {link.target}</text>,
   *   []
   * )
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly renderLink?: RenderLink<any>;
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
   * When enabled, renders elements as SVG elements instead of foreignObject.
   * @default false
   */
  readonly useSVGElements?: boolean;

  /**
   * Callback called when an element view is rendered in the paper.
   * @param elementView - The element view that was rendered.
   */
  readonly onRenderElement?: OnPaperRenderElement;

  /**
   * Selector used to locate the React portal target node inside a cell view.
   *
   * By default, only cells whose markup contains the `'__portal__'` selector
   * (i.e. {@link ElementModel}) are rendered via `renderElement`.
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

  /**
   * Pre-created PortalPaper instance to adopt.
   * When provided, the Paper component wraps this paper instead of creating a new one.
   * The paper's DOM is assumed to be managed externally (e.g. by a stencil).
   */
  readonly paper?: PortalPaper;
}
