import type { dia } from '@joint/core';
import type { LinkRecord } from '../../types/cell.types';
import type { PortalSelector } from '../../mvc/paper.types';
import type { PaperView } from '../../mvc/paper';
import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';
import type {
  ConnectionEnd,
  CanConnectOptions,
  ValidateConnection,
} from '../../presets/can-connect';
import type { ValidateEmbedding, ValidateUnembedding } from '../../presets/can-embed';
import type {
  ConnectionStrategy,
  ConnectionStrategyOptions,
} from '../../presets/connection-strategy';
import type { CellVisibility } from '../../presets/cell-visibility';
import type { CellInteractivity } from '../../presets/cell-interactivity';
import type { LinkRouting } from '../../presets/link-routing';
import type { PaperEventHandlers } from '../../presets/paper-events';

/**
 * Value accepted by the Paper `transform` prop. Strings are parsed via the
 * native `DOMMatrix` constructor (CSS transform syntax, `scale()`,
 * `translate()`, `rotate()`, `matrix()` etc.). `DOMMatrix` instances pass
 * through. `SVGMatrix === DOMMatrix` in modern `lib.dom.d.ts`.
 * @group Types
 */
export type PaperTransform = string | DOMMatrix;

/**
 * Context passed to the `defaultLink` factory.
 * @group Types
 */
export interface DefaultLinkParams {
  /** The source end of the connection being created. */
  readonly source: ConnectionEnd;
  /** The paper instance. */
  readonly paper: dia.Paper;
  /** The graph instance. */
  readonly graph: dia.Graph;
}

/**
 * Value accepted by the Paper `defaultLink` prop, factory receiving
 * {@link DefaultLinkParams}, or a static `Partial<LinkRecord>`.
 * @group Types
 */
export type DefaultLink =
  | ((context: DefaultLinkParams) => dia.Link | Partial<LinkRecord>)
  | Partial<LinkRecord>;

/**
 * Raw `dia.Paper.Options` passthrough, the type of the `options` escape-hatch prop.
 * `cellVisibility` is excluded: use the dedicated `cellVisibility` prop (it is
 * also managed by feature ownership, e.g. a virtual-rendering scroller).
 * @group Types
 */
export type PaperOptions = Omit<dia.Paper.Options, 'cellVisibility'>;

/**
 * Officially supported Paper options. Pass-through props inherit their exact
 * native types via indexed access (`dia.Paper.Options['name']`), so any
 * type-level change in JointJS propagates automatically. Anything not listed
 * here is reachable via the `options` escape hatch, never implicitly exposed.
 * @group Types
 */
interface PaperSupportedOptions {
  // ── Wrapped (structured) ─────────────────────────────────────────────────

  /**
   * Defines the link created when the user starts dragging from a port or element.
   *
   * Can be a factory function receiving connection context, a static {@link LinkRecord},
   * or a `dia.Link` instance.
   */
  readonly defaultLink?: DefaultLink;

  /**
   * Validates whether a connection between two elements/ports is allowed.
   *
   * - **Function**: custom validation with built-in rules (no self-loops, no link-to-link, no multi-links).
   *   Receives `{ source, target, endType, paper, graph }`.
   * - **Object**: {@link CanConnectOptions} with built-in rules and optional `validate` callback.
   *
   * When omitted, defaults to `canConnect()` (no self-loops, no link-to-link, no multi-links).
   */
  readonly validateConnection?: CanConnectOptions | ValidateConnection;

  /**
   * Decides how the end JSON is stored when the user drops a link end.
   *
   * - **Function**: receives `{ end, model, magnet, dropPoint, endType, link, paper, graph }`
   *   and returns the modified `EndJSON`.
   * - **Object**: {@link ConnectionStrategyOptions} with `pin` preset and/or `customize` callback.
   */
  readonly connectionStrategy?: ConnectionStrategyOptions | ConnectionStrategy;

  /**
   * Validates whether an element can be embedded into another element.
   * Receives `{ child, parent, paper, graph }`.
   */
  readonly validateEmbedding?: ValidateEmbedding;

  /**
   * Validates whether an element can be unembedded from its parent.
   * Receives `{ child, paper, graph }`.
   */
  readonly validateUnembedding?: ValidateUnembedding;

  // ── Identification ───────────────────────────────────────────────────────
  /** Unique identifier used by joint-react to track the paper instance. */
  readonly id?: string;

  // ── Appearance ───────────────────────────────────────────────────────────
  // Note: sizing is intentionally NOT exposed. Paper is sized exclusively
  // by host CSS (`className` / `style`); `paper.getComputedSize()` falls
  // back to `el.clientWidth/clientHeight` when `options.width/height` are
  // not numeric (see `dia.Paper.getComputedSize`).
  readonly drawGrid?: dia.Paper.Options['drawGrid'];
  readonly drawGridSize?: dia.Paper.Options['drawGridSize'];
  readonly gridSize?: dia.Paper.Options['gridSize'];
  readonly background?: dia.Paper.Options['background'];
  readonly labelsLayer?: dia.Paper.Options['labelsLayer'];
  readonly overflow?: dia.Paper.Options['overflow'];

  // ── Interactions ─────────────────────────────────────────────────────────
  /**
   * CellInteraction permissions. Accepts:
   * - `boolean`, enable/disable all interactions.
   * - `InteractivityOptions`, granular toggle per interaction kind.
   * - Function, receives `{ model, interaction, paper, graph }` and returns either form.
   * Native `(cellView, event)` callback is reachable via the `options` escape hatch.
   */
  readonly interactive?: CellInteractivity;
  readonly highlighting?: dia.Paper.Options['highlighting'];
  readonly snapLabels?: dia.Paper.Options['snapLabels'];
  readonly snapLinks?: dia.Paper.Options['snapLinks'];
  readonly snapLinksSelf?: dia.Paper.Options['snapLinksSelf'];
  readonly markAvailable?: dia.Paper.Options['markAvailable'];
  readonly linkPinning?: dia.Paper.Options['linkPinning'];

  // ── Event thresholds / prevention ────────────────────────────────────────
  readonly clickThreshold?: dia.Paper.Options['clickThreshold'];
  readonly moveThreshold?: dia.Paper.Options['moveThreshold'];
  readonly magnetThreshold?: dia.Paper.Options['magnetThreshold'];
  readonly preventContextMenu?: dia.Paper.Options['preventContextMenu'];
  readonly preventDefaultViewAction?: dia.Paper.Options['preventDefaultViewAction'];
  readonly preventDefaultBlankAction?: dia.Paper.Options['preventDefaultBlankAction'];

  // ── Embedding ────────────────────────────────────────────────────────────
  readonly embeddingMode?: dia.Paper.Options['embeddingMode'];
  readonly frontParentOnly?: dia.Paper.Options['frontParentOnly'];

  // ── Cell visibility ──────────────────────────────────────────────────────
  /**
   * Predicate deciding whether a cell should be rendered. Receives
   * `{ model, isMounted, paper, graph }`; return `false` to hide the cell.
   * Native positional form is reachable via the `options` escape hatch.
   */
  readonly cellVisibility?: CellVisibility;

  // ── Namespaces ───────────────────────────────────────────────────────────
  readonly cellViewNamespace?: dia.Paper.Options['cellViewNamespace'];
  readonly layerViewNamespace?: dia.Paper.Options['layerViewNamespace'];
  readonly routerNamespace?: dia.Paper.Options['routerNamespace'];
  readonly connectorNamespace?: dia.Paper.Options['connectorNamespace'];
  readonly highlighterNamespace?: dia.Paper.Options['highlighterNamespace'];
  readonly anchorNamespace?: dia.Paper.Options['anchorNamespace'];
  readonly linkAnchorNamespace?: dia.Paper.Options['linkAnchorNamespace'];
  readonly connectionPointNamespace?: dia.Paper.Options['connectionPointNamespace'];

  // ── Link routing bundle ──────────────────────────────────────────────────
  /**
   * Bundle of link routing defaults (router, connector, anchor, connection
   * point). Use a preset ({@link linkRoutingStraight}, {@link linkRoutingOrthogonal},
   * {@link linkRoutingSmooth}) or pass a custom object of the same shape.
   *
   * `defaultLinkAnchor` is reachable via the `options` escape hatch.
   *
   * Values inside `options` override matching keys here.
   * @example
   * ```tsx
   * import { linkRoutingOrthogonal } from '@joint/react';
   *
   * <Paper linkRouting={linkRoutingOrthogonal()} />
   * ```
   */
  readonly linkRouting?: LinkRouting;

  // ── Escape hatch ─────────────────────────────────────────────────────────

  /**
   * Raw `dia.Paper.Options` passthrough for anything joint-react doesn't
   * expose as a dedicated prop (e.g. `allowLink`, `validateMagnet`,
   * `restrictTranslate`, `onViewPostponed`).
   *
   * Values set here override top-level props of the same name, treat this
   * as the authoritative form for users who need direct access to the raw
   * JointJS API. Avoid overriding joint-react-controlled options
   * (`async`, `sorting`, `viewManagement`, `frozen`, `autoFreeze`), the
   * portal rendering depends on their set values.
   */
  readonly options?: PaperOptions;
}

/**
 * Render function for elements. Receives the element's `data` slice only.
 * so the renderer re-runs ONLY when `data` changes, not when `position`,
 * `size`, `angle`, or other cell attributes update. Position and size are
 * applied by JointJS's view layer without touching React at all (SVG mode)
 * or by a thin wrapper div that doesn't invoke the renderer (HTML mode).
 *
 * Rendered as JSX (`<RenderElement {...data} />`) so wrapping it in
 * `React.memo` actually short-circuits on prop equality.
 *
 * The framework guarantees `data` is at least `{}` at this boundary, even
 * for built-in JointJS shapes that ship without a `data` field.
 *
 * If the renderer needs the id, position, size, or other slices, use the
 * context hooks: {@link useCellId}(), {@link useCell}() (with optional selector), or
 * `useCell(c => c.position / c.size / ...)`.
 * @group Types
 */
export type RenderElement<ElementData = unknown> = (data: ElementData) => ReactNode;

/**
 * Render function for links. Receives the link's `data` slice only, same
 * performance rationale as {@link RenderElement}. Use {@link useCell}() (with an
 * optional selector) inside the renderer when source / target / id are
 * needed.
 *
 * The framework guarantees `data` is at least `{}` at this boundary.
 * @group Types
 */
export type RenderLink<LinkData = unknown> = (data: LinkData) => ReactNode;

/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 *
 * Paper events are exposed directly as props
 * (`onBlankContextMenu`, `onElementPointerClick`, `onLinkMouseEnter`, …).
 * Each handler receives a single params
 * object, e.g. `onBlankContextMenu={({ paper, event, x, y }) => …}`.
 *
 * Handlers are **always-latest**: the paper subscribes once and each event
 * reads the current handler, so inline arrows
 * (`onBlankContextMenu={() => …}`) are fine, no `useCallback` needed and no
 * re-subscription on render. For raw native event names or events without an
 * `on*` form (`render:done`, `cell:highlight`, …), use the {@link useOnPaperEvents}
 * hook.
 * @see https://docs.jointjs.com/api/dia/Paper
 * @expand
 * @group Types
 */
export interface PaperProps extends PaperSupportedOptions, PropsWithChildren, PaperEventHandlers {
  /**
   * A function that renders the element.
   *
   * Note: JointJS works with SVG by default, so `renderElement` is appended inside an SVG node.
   * To render HTML elements, use the experimental `useHTMLOverlay` prop or an SVG `foreignObject`.
   *
   * Receives the element's `data` slice only. Derive its type from your cells
   * with `InferElement<typeof cells>['data']`.
   * @example
   * Example with `global component`:
   * ```tsx
   * type NodeData = InferElement<typeof initialCells>['data']
   * function RenderElement(data: NodeData) {
   *  return <div className="node">{data.label}</div>
   * }
   * ```
   * @example
   * Example with `local component`:
   * ```tsx
   * type NodeData = InferElement<typeof initialCells>['data']
   * const renderElement: RenderElement<NodeData> = useCallback(
   *     (data) => <div className="node">{data.label}</div>,
   *     []
   * )
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
   * Inline styles applied to the paper host element. Use `style.width` and
   * `style.height` (or CSS via `className`) to size the paper, Paper does
   * not expose dedicated width/height props.
   */
  readonly style?: CSSProperties;
  /**
   * CSS classes applied to the paper host element. Combine with width /
   * height rules to size the paper.
   */
  readonly className?: string;
  /**
   * Sets the paper's viewport transform via `paper.matrix(...)`. Accepts
   * either a CSS transform string (e.g. `'scale(0.5)'`,
   * `'translate(10px, 20px) rotate(15deg)'`) or a `DOMMatrix`. Useful for
   * zoom, minimap, and arbitrary viewport transforms.
   * @example
   * transform="scale(0.4)"
   * transform={new DOMMatrix().scale(2).translate(10, 20)}
   */
  readonly transform?: PaperTransform;

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
   * Paper-level override for the React portal target selector.
   *
   * By default, each cell uses its own `portalSelector` field.
   * {@link ElementModel} renders into its `'__portal__'` group, {@link LinkModel} into its
   * root `<g>`. Built-in JointJS shapes have no `portalSelector` field and
   * are skipped. Set this prop to force a single selector or a dynamic one
   * across all cells.
   *
   * A function receives `{ model, paper, graph }` and may return:
   * - a **selector string**, look up that node,
   * - an **`Element`**, use that DOM node directly,
   * - **`null`**, skip rendering for this cell,
   * - **`undefined`** (or no return), fall back to the cell's own `portalSelector`.
   * @example
   * ```tsx
   * // Render into the 'root' selector of all cells
   * <Paper portalSelector="root" renderElement={...} />
   * ```
   * @example
   * ```tsx
   * // Route built-in shapes to 'root'; let ElementModel cells use their default
   * <Paper portalSelector={({ model }) => {
   *   if (model.get('type') === 'standard.Rectangle') return 'root';
   *   // implicit: use the cell's own portalSelector
   * }} renderElement={...} />
   * ```
   */
  readonly portalSelector?: PortalSelector;

  /**
   * Pre-created PaperView instance to adopt.
   * When provided, the Paper component wraps this paper instead of creating a new one.
   * The paper's DOM is assumed to be managed externally (e.g. by a stencil).
   */
  readonly paper?: PaperView;
}
