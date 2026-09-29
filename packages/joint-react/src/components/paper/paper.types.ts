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
 * Viewport transform accepted by the `<Paper>` `transform` prop: either a CSS
 * transform string (e.g. `'scale(0.5)'`, `'translate(10px, 20px) rotate(15deg)'`)
 * or a `DOMMatrix`. Strings are parsed with the native `DOMMatrix` constructor.
 * @group Types
 */
export type PaperTransform = string | DOMMatrix;

/**
 * Context handed to a {@link DefaultLink} factory while the user drags a new
 * connection from a port or element.
 * @expand
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
 * Defines the link created when the user drags a new connection from a port or
 * element. Either a factory receiving {@link DefaultLinkParams} (returning a
 * `dia.Link` or a partial {@link LinkRecord}) or a static partial
 * {@link LinkRecord}.
 * @group Types
 */
export type DefaultLink =
  | ((context: DefaultLinkParams) => dia.Link | Partial<LinkRecord>)
  | Partial<LinkRecord>;

/**
 * Raw `dia.Paper.Options` accepted by the {@link PaperProps} `options` escape
 * hatch, for any native option joint-react does not expose as a dedicated prop.
 * `cellVisibility` is excluded: use the dedicated `cellVisibility` prop instead
 * (it is also managed by feature ownership, e.g. a virtual-rendering scroller).
 * @group Types
 */
export type PaperOptions = Omit<dia.Paper.Options, 'cellVisibility'>;

/**
 * Officially supported Paper options. Pass-through props inherit their exact
 * native types via indexed access (`dia.Paper.Options['name']`), so any
 * type-level change in JointJS propagates automatically. Anything not listed
 * here is reachable via the `options` escape hatch, never implicitly exposed.
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
  /**
   * Draws a grid pattern on the paper background. Pass `true` for the default
   * grid or an object to style it (e.g. `{ color: 'red', thickness: 2 }`).
   * @default true
   */
  readonly drawGrid?: dia.Paper.Options['drawGrid'];
  /**
   * Spacing of the rendered grid lines in px. Falls back to `gridSize` when not
   * set.
   * @default matches `gridSize`
   */
  readonly drawGridSize?: dia.Paper.Options['drawGridSize'];
  /**
   * Grid step in px that element positions snap to while dragging.
   * @default 10
   */
  readonly gridSize?: dia.Paper.Options['gridSize'];
  /**
   * Paper background color, image, or pattern. Pass an object such as
   * `{ color: 'lightblue', image: '/bg.png', repeat: 'flip-xy' }`.
   * @default false
   */
  readonly background?: dia.Paper.Options['background'];
  /**
   * Renders link labels into a dedicated top layer (so they are not occluded by
   * later cells). Pass `true`, or a layer name to target a specific layer.
   * @default false
   */
  readonly labelsLayer?: dia.Paper.Options['labelsLayer'];
  /**
   * Lets cell content spill outside the paper viewport instead of being clipped.
   * @default false
   */
  readonly overflow?: dia.Paper.Options['overflow'];

  // ── Interactions ─────────────────────────────────────────────────────────
  /**
   * Which pointer interactions are enabled on cells. Accepts a boolean to toggle
   * everything, an `InteractivityOptions` object for granular control per
   * interaction kind, or a {@link CellInteractivity} callback returning either
   * form per cell. The native `(cellView, event)` callback is reachable via the
   * `options` escape hatch.
   * @default { labelMove: false, linkMove: false }
   */
  readonly interactive?: CellInteractivity;
  /**
   * Highlighter definitions keyed by highlight type (connecting, embedding,
   * magnet/element availability). Override to restyle these visual cues.
   * @default joint-react's themed highlighters
   */
  readonly highlighting?: dia.Paper.Options['highlighting'];
  /**
   * Snaps a dragged link label to the closest point on the link path.
   * @default false
   */
  readonly snapLabels?: dia.Paper.Options['snapLabels'];
  /**
   * Snaps a dragged link end to nearby ports/elements. Pass `{ radius }` to set
   * the snapping distance in px.
   * @default { radius: 15 }
   */
  readonly snapLinks?: dia.Paper.Options['snapLinks'];
  /**
   * Allows a link end to snap to its own source/target element.
   * @default false
   */
  readonly snapLinksSelf?: dia.Paper.Options['snapLinksSelf'];
  /**
   * Highlights valid drop targets (magnets and elements) while a link is being
   * dragged.
   * @default true
   */
  readonly markAvailable?: dia.Paper.Options['markAvailable'];
  /**
   * Allows dropping a link end on blank paper, pinning it to a fixed point
   * instead of requiring an element/port.
   * @default false
   */
  readonly linkPinning?: dia.Paper.Options['linkPinning'];

  // ── Event thresholds / prevention ────────────────────────────────────────
  /**
   * Maximum pointer travel (in px) still treated as a click rather than a drag.
   * @default 5
   */
  readonly clickThreshold?: dia.Paper.Options['clickThreshold'];
  /**
   * Pointer travel (in px) required before `pointermove` events start firing.
   * @default 0
   */
  readonly moveThreshold?: dia.Paper.Options['moveThreshold'];
  /**
   * Pointer travel (in px) before a link is created from a magnet, or
   * `'onleave'` to create it once the pointer leaves the magnet.
   * @default 'onleave'
   */
  readonly magnetThreshold?: dia.Paper.Options['magnetThreshold'];
  /**
   * Suppresses the browser context menu over the paper so `contextmenu` events
   * can drive your own UI.
   * @default true
   */
  readonly preventContextMenu?: dia.Paper.Options['preventContextMenu'];
  /**
   * Prevents the browser default action on cell pointer events.
   * @default true
   */
  readonly preventDefaultViewAction?: dia.Paper.Options['preventDefaultViewAction'];
  /**
   * Prevents the browser default action on blank-area pointer events.
   * @default false
   */
  readonly preventDefaultBlankAction?: dia.Paper.Options['preventDefaultBlankAction'];

  // ── Embedding ────────────────────────────────────────────────────────────
  /**
   * Enables embedding: dropping an element onto another re-parents it (the
   * child then moves with its parent). Pair with the `validateEmbedding` prop to
   * control which parents are allowed.
   * @default false
   */
  readonly embeddingMode?: dia.Paper.Options['embeddingMode'];
  /**
   * When embedding, only the frontmost element under the pointer is considered a
   * parent; otherwise candidates are tested front-to-back.
   * @default true
   */
  readonly frontParentOnly?: dia.Paper.Options['frontParentOnly'];

  // ── Cell visibility ──────────────────────────────────────────────────────
  /**
   * Predicate deciding whether a cell should be rendered. Receives
   * `{ model, isMounted, paper, graph }`; return `false` to hide the cell.
   * Native positional form is reachable via the `options` escape hatch.
   */
  readonly cellVisibility?: CellVisibility;

  // ── Namespaces ───────────────────────────────────────────────────────────
  /**
   * Namespace of cell-view constructors used to resolve a cell's view by type.
   * @default JointJS built-in cell views
   */
  readonly cellViewNamespace?: dia.Paper.Options['cellViewNamespace'];
  /**
   * Namespace of layer-view constructors used to resolve custom paper layers.
   * @default JointJS built-in layer views
   */
  readonly layerViewNamespace?: dia.Paper.Options['layerViewNamespace'];
  /**
   * Namespace used to resolve router names referenced by links.
   * @default JointJS built-in `routers`
   */
  readonly routerNamespace?: dia.Paper.Options['routerNamespace'];
  /**
   * Namespace used to resolve connector names referenced by links.
   * @default JointJS built-in `connectors`
   */
  readonly connectorNamespace?: dia.Paper.Options['connectorNamespace'];
  /**
   * Namespace used to resolve highlighter names referenced by `highlighting`.
   * @default JointJS built-in highlighters plus joint-react's magnet highlighter
   */
  readonly highlighterNamespace?: dia.Paper.Options['highlighterNamespace'];
  /**
   * Namespace used to resolve element anchor names.
   * @default JointJS built-in `anchors`
   */
  readonly anchorNamespace?: dia.Paper.Options['anchorNamespace'];
  /**
   * Namespace used to resolve link anchor names.
   * @default JointJS built-in `linkAnchors`
   */
  readonly linkAnchorNamespace?: dia.Paper.Options['linkAnchorNamespace'];
  /**
   * Namespace used to resolve connection point names.
   * @default JointJS built-in `connectionPoints`
   */
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
 * Render function for elements. Receives the element's `data` slice only, so
 * the renderer re-runs ONLY when `data` changes, not when `position`,
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
 * Props for {@link Paper} — the React-friendly surface over
 * `dia.Paper.Options`, plus joint-react extras such as custom cell rendering, a
 * controlled viewport `transform`, and portal targeting.
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
 * @see [`dia.Paper`](https://docs.jointjs.com/api/dia/Paper)
 * @expand
 * @group Types
 */
export interface PaperProps extends PaperSupportedOptions, PropsWithChildren, PaperEventHandlers {
  /**
   * Renders each element from its `data` slice.
   *
   * Note: JointJS works with SVG by default, so `renderElement` is appended inside an SVG node.
   * To render HTML elements, use the experimental `useHTMLOverlay` prop or an SVG `foreignObject`.
   *
   * Receives the element's `data` slice only. Derive its type from your cells
   * with `InferElement<typeof cells>['data']`.
   * @example Global component
   * ```tsx
   * type NodeData = InferElement<typeof initialCells>['data']
   * // HTML content lives inside <HTMLBox> so it renders correctly in SVG mode.
   * function RenderElement(data: NodeData) {
   *   return <HTMLBox className="node">{data.label}</HTMLBox>
   * }
   * ```
   * @example Local component
   * ```tsx
   * type NodeData = InferElement<typeof initialCells>['data']
   * const renderElement: RenderElement<NodeData> = useCallback(
   *     (data) => <HTMLBox className="node">{data.label}</HTMLBox>,
   *     []
   * )
   * ```
   */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly renderElement?: RenderElement<any>;
  /**
   * Renders each link's content from its `data` slice. Re-runs when the link's
   * `data` changes.
   *
   * Note: JointJS works with SVG by default, so `renderLink` content is appended inside an SVG node.
   * To render HTML elements, use an SVG `foreignObject`.
   *
   * Receives the link's `data` slice only. Derive its type from your cells with
   * `InferLink<typeof cells>['data']`. When you need the source, target, or id,
   * read them with {@link useCell}() from inside the renderer.
   * @experimental - this feature is experimental and may have limitations or issues. Use at your own risk.
   * @example Global component
   * ```tsx
   * type LinkData = InferLink<typeof initialCells>['data']
   * function RenderLink(data: LinkData) {
   *   return <text>{data.label}</text>;
   * }
   * ```
   * @example Local component
   * ```tsx
   * type LinkData = InferLink<typeof initialCells>['data']
   * const renderLink: RenderLink<LinkData> = useCallback(
   *   (data) => <text>{data.label}</text>,
   *   []
   * )
   * ```
   * @example Reading the id alongside the data slice
   * ```tsx
   * type LinkData = InferLink<typeof initialCells>['data']
   * function RenderLink(data: LinkData) {
   *   // source / target / id live on the context, not the data slice
   *   const id = useCellId();
   *   return <text>{data.label} ({id})</text>;
   * }
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
   * ```tsx
   * <Paper transform="scale(0.4)" />
   * <Paper transform={new DOMMatrix().scale(2).translate(10, 20)} />
   * ```
   */
  readonly transform?: PaperTransform;

  /**
   * Maximum pointer travel (in px) still treated as a click rather than a drag.
   * Moving farther than this between press and release suppresses the
   * `pointerclick` event.
   * @default 5
   */
  readonly clickThreshold?: number;

  /**
   * Renders elements as real HTML in an overlay instead of inside an SVG node.
   * By default `renderElement` output is mounted in SVG, so plain HTML needs a
   * `foreignObject` (or an {@link HTMLBox}); enable this to skip that wrapping.
   * @experimental Known issues with HTML element rendering — use at your own risk.
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
   * Pre-created paper instance to adopt.
   * When provided, the Paper component wraps this paper instead of creating a new one.
   * The paper's DOM is assumed to be managed externally (e.g. by a stencil).
   *
   * `PaperView` is an internally-managed instance, not a public, importable type;
   * you normally receive it from another joint-react construct (such as a stencil)
   * rather than constructing it yourself.
   */
  readonly paper?: PaperView;
}
