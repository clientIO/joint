import type { dia } from '@joint/core';
import type { LinkRecord } from '../../types/data-types';
import type { PortalSelector } from '../../models/portal-paper.types';
import type { PortalPaper } from '../../models/portal-paper';
import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';
import type { ConnectionEnd, CanConnectOptions, ValidateConnectionContext } from '../../presets/can-connect';
import type { ValidateEmbeddingContext, ValidateUnembeddingContext } from '../../presets/can-embed';
import type { ConnectionStrategyOptions, ConnectionStrategyContext } from '../../presets/connection-strategy';
import type { CellVisibility } from '../../presets/cell-visibility';
import type { Interactive } from '../../presets/interactive';

/** Context passed to the `defaultLink` factory. */
export interface DefaultLinkContext {
  /** The source end of the connection being created. */
  readonly source: ConnectionEnd;
  /** The paper instance. */
  readonly paper: dia.Paper;
  /** The graph instance. */
  readonly graph: dia.Graph;
}

/**
 * Officially supported Paper options. Pass-through props inherit their exact
 * native types via indexed access (`dia.Paper.Options['name']`), so any
 * type-level change in JointJS propagates automatically. Anything not listed
 * here is reachable via the `options` escape hatch, never implicitly exposed.
 */
export interface PortalPaperOptions {
  // ── Wrapped (structured) ─────────────────────────────────────────────────

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

  // ── Identification ───────────────────────────────────────────────────────
  /** Unique identifier used by joint-react to track the paper instance. */
  readonly id?: string;

  // ── Sizing & appearance ──────────────────────────────────────────────────
  readonly width?: dia.Paper.Options['width'];
  readonly height?: dia.Paper.Options['height'];
  readonly drawGrid?: dia.Paper.Options['drawGrid'];
  readonly drawGridSize?: dia.Paper.Options['drawGridSize'];
  readonly gridSize?: dia.Paper.Options['gridSize'];
  readonly background?: dia.Paper.Options['background'];
  readonly labelsLayer?: dia.Paper.Options['labelsLayer'];
  readonly overflow?: dia.Paper.Options['overflow'];

  // ── Interactions ─────────────────────────────────────────────────────────
  /**
   * Interaction permissions. Accepts:
   * - `boolean` — enable/disable all interactions.
   * - `InteractivityOptions` — granular toggle per interaction kind.
   * - Function — receives `{ model, interaction, paper, graph }` and returns either form.
   * Native `(cellView, event)` callback is reachable via the `options` escape hatch.
   */
  readonly interactive?: Interactive;
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

  // ── Defaults (routing / connecting) ──────────────────────────────────────
  readonly defaultRouter?: dia.Paper.Options['defaultRouter'];
  readonly defaultConnector?: dia.Paper.Options['defaultConnector'];
  readonly defaultAnchor?: dia.Paper.Options['defaultAnchor'];
  readonly defaultLinkAnchor?: dia.Paper.Options['defaultLinkAnchor'];
  readonly defaultConnectionPoint?: dia.Paper.Options['defaultConnectionPoint'];

  // ── Escape hatch ─────────────────────────────────────────────────────────

  /**
   * Raw `dia.Paper.Options` passthrough for anything joint-react doesn't
   * expose as a dedicated prop (e.g. `allowLink`, `validateMagnet`,
   * `restrictTranslate`, `onViewPostponed`).
   *
   * Values set here override top-level props of the same name — treat this
   * as the authoritative form for users who need direct access to the raw
   * JointJS API. Avoid overriding joint-react-controlled options
   * (`async`, `sorting`, `viewManagement`, `frozen`, `autoFreeze`) — the
   * portal rendering depends on their set values.
   */
  readonly options?: dia.Paper.Options;
}

/**
 * Render function for elements. Receives the element's `data` slice only —
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
 * context hooks: `useCellId()`, `useElement()` (with optional selector), or
 * `useCell(c => c.position / c.size / ...)`.
 */
export type RenderElement<ElementData = unknown> = (data: ElementData) => ReactNode;

/**
 * Render function for links. Receives the link's `data` slice only — same
 * performance rationale as `RenderElement`. Use `useLink()` (with an
 * optional selector) inside the renderer when source / target / id are
 * needed.
 *
 * The framework guarantees `data` is at least `{}` at this boundary.
 */
export type RenderLink<LinkData = unknown> = (data: LinkData) => ReactNode;

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
   * Paper-level override for the React portal target selector.
   *
   * By default, each cell uses its own `portalSelector` field —
   * `ElementModel` renders into its `'__portal__'` group, `LinkModel` into its
   * root `<g>`. Built-in JointJS shapes have no `portalSelector` field and
   * are skipped. Set this prop to force a single selector or a dynamic one
   * across all cells.
   *
   * A function receives `{ model, paper, graph }` and may return:
   * - a **selector string** — look up that node,
   * - an **`Element`** — use that DOM node directly,
   * - **`null`** — skip rendering for this cell,
   * - **`undefined`** (or no return) — fall back to the cell's own `portalSelector`.
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
   * Pre-created PortalPaper instance to adopt.
   * When provided, the Paper component wraps this paper instead of creating a new one.
   * The paper's DOM is assumed to be managed externally (e.g. by a stencil).
   */
  readonly paper?: PortalPaper;
}
