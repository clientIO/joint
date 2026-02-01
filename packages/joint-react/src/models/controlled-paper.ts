import { dia } from '@joint/core';
import type { ExternalElementType, ControlledPaperOptions } from '../types/controlled-paper.types';

/**
 * Generates a registry key for external elements.
 * Format: "type:cellId" for cell elements or just "type" for layers.
 * @param type - The type of external element
 * @param cellId - Optional cell ID for element/link types
 * @returns The registry key string
 */
function getRegistryKey(type: ExternalElementType, cellId?: dia.Cell.ID): string {
  if (cellId === undefined) {
    return type;
  }
  return `${type}:${cellId}`;
}

/**
 * Extended options for ControlledPaper with React-provided SVG elements.
 */
export interface ControlledPaperFullOptions extends ControlledPaperOptions {
  /** Pre-existing SVG element (React provides this) */
  readonly svg?: SVGSVGElement;
  /** Pre-existing layers <g> element (the main joint-layers container) */
  readonly layers?: SVGGElement;
  /** Pre-existing defs element */
  readonly defs?: SVGDefsElement;
  /** Pre-existing grid layer element (joint-grid-layer) */
  readonly gridLayerElement?: SVGGElement;
  /** Pre-existing back layer element (joint-back-layer) */
  readonly backLayerElement?: SVGGElement;
  /** Pre-existing cells layer element (joint-cells-layer) */
  readonly cellsLayerElement?: SVGGElement;
  /** Pre-existing labels layer element (joint-labels-layer) */
  readonly labelsLayerElement?: SVGGElement;
  /** Pre-existing front layer element (joint-front-layer) */
  readonly frontLayerElement?: SVGGElement;
  /** Pre-existing tools layer element (joint-tools-layer) */
  readonly toolsLayerElement?: SVGGElement;
  /** Callback invoked after link geometry is computed - used to trigger React re-render */
  readonly onLinkGeometryUpdate?: () => void;
  /** When true, React renders links and LinkView DOM methods are overridden. When false, JointJS renders links natively. */
  readonly reactRendersLinks?: boolean;
}

/**
 * Check if options contain React-provided layer elements
 * @param options
 */
function hasReactElements(options: dia.Paper.Options): options is ControlledPaperFullOptions {
  return 'svg' in options || 'layers' in options || 'cellsLayerElement' in options;
}

/**
 * ControlledPaper extends dia.Paper to accept externally-registered DOM elements.
 *
 * This is the core innovation for React integration - it allows React to create
 * and manage the DOM elements while JointJS handles the model and interactions.
 *
 * Key features:
 * - Accepts pre-created SVG structure from React (svg, layers, cells-layer, etc.)
 * - External cell elements can be registered before or after cells are added
 * - When a cell is rendered, it uses the registered external element
 * - Prevents duplicate DOM elements when React is managing the view layer
 * @group Models
 * @experimental
 */
export class ControlledPaper extends dia.Paper {
  /**
   * Map of externally registered DOM elements.
   * Keys are in format "type:cellId" or just "type" for layers.
   */
  private externalElements: Map<string, HTMLElement | SVGElement> = new Map();

  /**
   * Whether this paper is in controlled mode.
   * When true, cell elements must be registered externally.
   */
  private _isControlled = true;

  /**
   * Preinitialize is called before the constructor logic runs.
   * This ensures the Map is initialized before parent constructor needs it.
   */
  override preinitialize(): void {
    super.preinitialize?.();
    this.externalElements = new Map();
    this._isControlled = true;
  }

  constructor(options: ControlledPaperFullOptions) {
    super(options);
    // Default to controlled=true if not specified
    this._isControlled = options.controlled !== false;
  }

  /**
   * Returns whether this paper is in controlled mode.
   */
  isControlled(): boolean {
    return this._isControlled;
  }

  /**
   * Registers an external DOM element to be used for a cell view.
   * If a view already exists for the cell, it will be updated to use the new element.
   * @param type
   * @param element
   * @param cellId
   */
  registerExternalElement(
    type: ExternalElementType,
    element: HTMLElement | SVGElement,
    cellId?: dia.Cell.ID
  ): void {
    const key = getRegistryKey(type, cellId);
    this.externalElements.set(key, element);

    // If a view already exists for this cell, swap its element
    if (this._isControlled && cellId !== undefined && (type === 'element' || type === 'link')) {
      const existingView = this.findViewByModel(cellId);
      if (existingView && existingView.el !== element) {
        this.swapViewElement(existingView, element as SVGGElement);
      }
    }
  }

  /**
   * Swaps the element of an existing view to a new external element.
   * @param view
   * @param newElement
   */
  private swapViewElement(view: dia.CellView, newElement: SVGGElement): void {
    const oldElement = view.el;

    // Copy essential attributes from old element if not already on new element
    if (oldElement.id && !newElement.id) {
      newElement.id = oldElement.id;
    }

    // Use JointJS's setElement method to properly update the view
    view.setElement(newElement);

    // Remove the old JointJS-created element from DOM if it's still there
    oldElement?.remove();

    // Prevent the view from re-rendering its markup (React handles rendering)
    this.setupReactViewOverrides(view);

    // For links, trigger geometry computation (sourcePoint, targetPoint, d)
    // Use queueMicrotask to ensure all element swaps complete first
    // (element views need valid bboxes for link geometry computation)
    if (view.model.isLink()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const linkView = view as any;
      // Call updateConnection directly - this computes sourcePoint/targetPoint
      // without needing the path elements (which React owns)
      linkView.updateConnection?.();
      linkView.updateRoute?.();
      linkView.updatePath?.();
    }
  }

  /**
   * Overrides view methods to prevent JointJS from managing the element's content.
   * React is responsible for rendering content inside the element.
   *
   * For LinkViews: Prevent markup modification but keep geometry computation.
   * For ElementViews: Prevents all rendering since React handles everything.
   * @param view
   */
  private setupReactViewOverrides(view: dia.CellView): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viewAny = view as any;
    const options = this.options as ControlledPaperFullOptions;
    const { onLinkGeometryUpdate, reactRendersLinks = true } = options;

    if (view.model.isLink()) {
      // When React doesn't render links, let JointJS handle them natively
      if (!reactRendersLinks) {
        return;
      }
      // For LinkViews: prevent DOM modification but compute geometry
      // React owns the content, but we need sourcePoint/targetPoint computed
      //
      // JointJS LinkView.render() does:
      //   1. this.vel.empty() - MUST PREVENT (clears React content)
      //   2. this.renderMarkup() - MUST PREVENT
      //   3. this.update() - which calls updateRoute/updatePath/updateDOM
      //
      // JointJS LinkView.update() does:
      //   1. updateRoute() - computes sourcePoint, targetPoint, route (NEED)
      //   2. updatePath() - computes path geometry (NEED)
      //   3. updateDOM() - modifies DOM attributes (PREVENT)
      //
      // Override render() and update() to only compute geometry

      viewAny.render = function () {
        // Skip vel.empty() and renderMarkup()
        // Clear metrics cache so getSerializedConnection() returns fresh data
        this.metrics = {};
        // Call geometry computation only
        this.updateRoute();
        this.updatePath();
        // Notify React to re-render with new geometry
        onLinkGeometryUpdate?.();
        return this;
      };

      viewAny.update = function () {
        // Skip updateDOM() - React owns the DOM
        // Clear metrics cache so getSerializedConnection() returns fresh data
        this.metrics = {};
        // Call geometry computation only
        this.updateRoute();
        this.updatePath();
        // Notify React to re-render with new geometry
        onLinkGeometryUpdate?.();
        return this;
      };

      // Override translate - called when connected element is dragged
      // JointJS translate() updates geometry directly without calling update()
      const originalTranslate = viewAny.translate.bind(viewAny);
      viewAny.translate = function (tx: number, ty: number) {
        // Clear metrics cache so getSerializedConnection() returns fresh data
        this.metrics = {};
        originalTranslate(tx, ty);
        // Notify React to re-render with new geometry
        onLinkGeometryUpdate?.();
      };

      // Override updateDOM - prevents JointJS from modifying React's DOM
      // but triggers callback so React can re-render
      viewAny.updateDOM = function () {
        // Skip DOM manipulation - React owns the DOM
        // Just notify React to re-render with new geometry
        onLinkGeometryUpdate?.();
      };

      return;
    }

    // For ElementViews: prevent all rendering and fix bbox computation

    // No-op: React renders content, JointJS markup is empty anyway
    viewAny.renderMarkup = function () {
      return this;
    };

    // No-op: React controls transform via props (ElementView only)
    if (typeof viewAny.updateTransformation === 'function') {
      viewAny.updateTransformation = function () {
        // React controls positioning
      };
    }

    // No-op: React handles all rendering
    viewAny.render = function () {
      return this;
    };

    // CRITICAL FIX: Override getNodeBBox to use model geometry directly.
    // This bypasses SVGMatrix-based computation which fails in JSDOM
    // because JSDOM doesn't properly implement SVGMatrix.translate().
    // LinkViews use getNodeBBox to compute sourceBBox/targetBBox for anchors.
    viewAny.getNodeBBox = function () {
      // Use model's getBBox() which directly uses position/size attributes
      // without SVG matrix operations
      return this.model.getBBox();
    };
  }

  /**
   * Unregisters an external DOM element.
   * @param type
   * @param cellId
   */
  unregisterExternalElement(type: ExternalElementType, cellId?: dia.Cell.ID): void {
    const key = getRegistryKey(type, cellId);
    this.externalElements.delete(key);
  }

  /**
   * Checks if an external element is registered.
   * @param type
   * @param cellId
   */
  hasExternalElement(type: ExternalElementType, cellId?: dia.Cell.ID): boolean {
    const key = getRegistryKey(type, cellId);
    return this.externalElements.has(key);
  }

  /**
   * Gets a registered external element.
   * @param type
   * @param cellId
   */
  getExternalElement(
    type: ExternalElementType,
    cellId?: dia.Cell.ID
  ): HTMLElement | SVGElement | undefined {
    const key = getRegistryKey(type, cellId);
    return this.externalElements.get(key);
  }

  /**
   * Find a pre-created element for a cell.
   *
   * Lookup order:
   * 1. Check the externalElements Map (registered via useLayoutEffect)
   * 2. Look in the DOM for an element with matching model-id attribute
   *
   * The DOM lookup is critical because React renders elements before
   * useLayoutEffect runs, so the element exists in DOM even if not yet
   * registered in the Map.
   * @param cellId
   */
  private findPreCreatedElement(cellId: dia.Cell.ID): SVGGElement | undefined {
    const type: ExternalElementType = 'element';

    // First, check the Map (fast path if already registered)
    const registered = this.getExternalElement(type, cellId) as SVGGElement | undefined;
    if (registered) {
      return registered;
    }

    // Also check for links
    const registeredLink = this.getExternalElement('link', cellId) as SVGGElement | undefined;
    if (registeredLink) {
      return registeredLink;
    }

    // Second, look in the DOM - React may have rendered it but not yet registered
    const { options } = this;
    if (hasReactElements(options) && options.cellsLayerElement) {
      const found = options.cellsLayerElement.querySelector(
        `[model-id="${cellId}"]`
      ) as SVGGElement | null;
      if (found) {
        // Cache it in the Map for future lookups
        this.externalElements.set(getRegistryKey(type, cellId), found);
        return found;
      }
    }

    return undefined;
  }

  /**
   * Override _initializeCellView to pass registered external element as el option.
   * @param ViewClass
   * @param cell
   * @param cid
   */
  _initializeCellView(
    ViewClass: new (options: {
      cid?: string;
      model: dia.Cell;
      interactive?: unknown;
      labelsLayer?: unknown;
      el?: HTMLElement | SVGElement;
    }) => dia.CellView,
    cell: dia.Cell,
    cid: string
  ): dia.CellView {
    // Find pre-created element (from Map or DOM)
    const preCreatedElement = this.findPreCreatedElement(cell.id);

    const { options } = this;
    const { interactive, labelsLayer } = options;

    const view = new ViewClass({
      cid,
      model: cell,
      el: preCreatedElement,
      interactive,
      labelsLayer: labelsLayer === true ? dia.Paper.Layers.LABELS : labelsLayer,
    });

    // In controlled mode, always prevent JointJS from creating its own content
    // React will provide elements via registerExternalElement
    if (this._isControlled) {
      this.setupReactViewOverrides(view);
    }

    return view;
  }

  /**
   * Override insertView to skip DOM insertion when element is already in correct layer.
   * @param view
   * @param isInitialInsert
   */
  insertView(view: dia.CellView, isInitialInsert: boolean): void {
    const layerId = this.model.getCellLayerId(view.model);
    const layerView = this.getLayerView(layerId);

    // Skip insertion if element is already in the correct layer (React-created)
    if (view.el.parentNode === layerView.el) {
      // Element already in place, just call lifecycle hooks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (view as any).onMount(isInitialInsert);
    } else {
      // Native JointJS element or not yet inserted - use normal insertion
      super.insertView(view, isInitialInsert);
    }
  }

  /**
   * Override render to use React-provided SVG structure.
   *
   * When React provides svg and layers elements, we skip the default Paper
   * SVG creation and use React's elements instead.
   */
  render(): this {
    const { options } = this;

    // Check if React-provided elements exist
    if (!hasReactElements(options)) {
      return super.render();
    }

    // Use React-provided SVG elements
    if (options.svg) {
      this.svg = options.svg;
    }
    if (options.layers) {
      this.layers = options.layers;
    }
    if (options.defs) {
      this.defs = options.defs;
    }

    // If React provided both svg and layers, register React's layer elements
    if (options.svg && options.layers && options.cellsLayerElement) {
      this.renderReactLayerViews(options);
      return this;
    }

    // Fall back to default rendering if React elements not fully provided
    return super.render();
  }

  /**
   * Safely add a layer view, skipping if it already exists.
   * @param layerConfig
   * @param layerConfig.id
   * @param layerConfig.el
   * @param layerConfig.type
   * @param layerConfig.model
   */
  private safeAddLayerView(layerConfig: {
    id: string;
    el?: SVGGElement;
    type?: string;
    model?: dia.GraphLayer;
  }): void {
    const { id, el, type, model } = layerConfig;
    if (!el) return;

    // Skip if layer already exists
    if (this.hasLayerView(id)) return;

    const layerView = this.createLayerView({ id, type, el, model });
    this.addLayerView(layerView);
  }

  /**
   * Register React's pre-created layer elements as LayerViews.
   * @param options
   */
  private renderReactLayerViews(options: ControlledPaperFullOptions): void {
    // Create implicit layer views for the other layers FIRST
    this.safeAddLayerView({ id: 'grid', el: options.gridLayerElement, type: 'GridLayerView' });
    this.safeAddLayerView({ id: 'back', el: options.backLayerElement });

    // Get the default graph layer
    const defaultLayer = this.model.getDefaultLayer();

    // Create a GraphLayerView that uses React's cells-layer element
    if (options.cellsLayerElement && !this.hasLayerView(defaultLayer.id)) {
      const cellsLayerView = this.createLayerView({
        id: defaultLayer.id,
        model: defaultLayer,
        el: options.cellsLayerElement,
      });
      this.addLayerView(cellsLayerView);
    }

    // Add the remaining implicit layers AFTER cells layer
    this.safeAddLayerView({ id: 'labels', el: options.labelsLayerElement });
    this.safeAddLayerView({ id: 'front', el: options.frontLayerElement });
    this.safeAddLayerView({ id: 'tools', el: options.toolsLayerElement });

    // Ensure essential layers exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).assertLayerViews?.();

    // Set up legacy references used by JointJS internally
    const toolsLayerView = this.getLayerView('tools');
    const labelsLayerView = this.getLayerView('labels');

    if (toolsLayerView) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).tools = toolsLayerView.el;
    }
    if (labelsLayerView) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).viewport = labelsLayerView.el;
    }
  }

  /**
   * Override remove to handle controlled mode cleanup.
   * In controlled mode, React owns the DOM elements, so we must NOT remove them.
   */
  remove(): this {
    this.externalElements.clear();

    if (this._isControlled) {
      // In controlled mode, React owns the DOM. We must NOT remove DOM elements.
      // Only clean up JointJS internal state without DOM manipulation.

      // Remove all cell views without removing their DOM elements
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const views = (this as any)._views as Record<string, dia.CellView | undefined>;
      for (const id in views) {
        const view = views[id];
        if (view) {
          // Stop listening to events but don't remove DOM
          view.stopListening();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (view as any).onRemove?.();
        }
        views[id] = undefined;
      }

      // Stop listening to graph events
      this.stopListening();

      return this;
    }

    // Non-controlled mode: normal cleanup with DOM removal
    return super.remove();
  }
}
