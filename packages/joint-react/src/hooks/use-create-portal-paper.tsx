/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-shadow */
import { dia } from '@joint/core';
import {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
  useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { useGraphStore } from './use-graph-store';
import { usePaperStore } from './use-paper';
import { useInternalData } from './use-stores';
import { useContainerKeys } from './use-container-keys';
import { useCallback, useSyncExternalStore } from 'react';
import type { LinkRecord } from '../types/cell.types';
import type { PaperStore } from '../store';
import { PaperView } from '../mvc/paper';
import type { DefaultLink, PaperProps, RenderLink } from '../components/paper/paper.types';
import { HTMLBox } from '../components/html-box';

import { mapLinkToAttributes } from '../state/data-mapping';
import type { CanConnectOptions } from '../presets/can-connect';
import { canConnect, toConnectionEnd } from '../presets/can-connect';
import {
  connectionStrategy as connectionStrategyPreset,
  type ConnectionStrategyOptions,
} from '../presets/connection-strategy';
import { canEmbed, canUnembed } from '../presets/can-embed';
import { toNativeCellVisibility } from '../presets/cell-visibility';
import { toNativeCellInteractivity } from '../presets/cell-interactivity';
import { toSVGMatrix } from '../utils/transform';
import { assignOptions } from '../utils/object-utilities';
import { PaperHTMLContainer } from '../components/paper/render-element/paper-html-container';
import { CellIdContext, PaperFeaturesContext } from '../context';
import {
  ElementHitArea,
  HTMLElementItem,
  SVGElementItem,
} from '../components/paper/render-element/paper-element-item';
import { createSelectPaperVersion } from '../selectors';
import { useAreElementsMeasured } from './use-are-elements-measured';
import { LINK_MODEL_TYPE } from '../mvc/link-model';
import { subscribeToPaperEvents } from './use-on-paper-events';
import { useOnEvents } from './use-on-events';
import type { CellId } from '../types/cell.types';
import { extractEventsFromPaperProps } from '../presets/paper-events';

type LinkModelConstructor = new (attributes?: dia.Link.Attributes) => dia.Link;

const EMPTY_DATA: Readonly<Record<string, unknown>> = Object.freeze({});

/** Options accepted by {@link useCreatePortalPaper}; extends all `PaperProps`. */
export interface CreatePortalPaperOptions extends PaperProps {
  /**
   * Host element ref where the paper should be mounted automatically.
   * When omitted, paper rendering is manual (e.g. via `onReady` callback).
   */
  readonly nodeRef?: RefObject<HTMLElement | SVGElement | null>;
  /** Callback fired once when paper instance is created and ready. */
  readonly onReady?: (paper: PaperView) => void;
  /** Whether the paper is externally managed (skip div mounting). */
  readonly isExternalPaper?: boolean;
}

/** Return value of {@link useCreatePortalPaper}: the paper id, ref, and helper APIs. */
export interface CreatePortalPaperResult {
  /** Effective paper id used in GraphStore. */
  readonly id: string;
  /** Current paper instance, available synchronously after mount and kept in sync afterwards. */
  readonly paperRef: RefObject<PaperView | null>;
  /** PaperStore for this paper id, available after registration. */
  readonly paperStore?: PaperStore;
  /** True when paper exists and is ready for content rendering. */
  readonly isReady: boolean;
  /** React portals content for elements/links/HTML overlay. */
  readonly content: ReactNode;
}

/**
 * Resolves the {@link LinkModel} constructor from graph cell namespace.
 * @param graph - Graph instance with layer collection namespace.
 * @returns The {@link LinkModel} constructor from graph namespace.
 * @throws {Error} When {@link LinkModel} is missing in graph namespace.
 */
function getLinkModelConstructor(graph: dia.Graph): LinkModelConstructor {
  const Ctor = graph.getTypeConstructor(LINK_MODEL_TYPE) as LinkModelConstructor | undefined;
  if (typeof Ctor !== 'function')
    throw new Error(
      'Paper: no default link model found. Use `options.defaultLink` to specify a default link model.'
    );
  return Ctor as LinkModelConstructor;
}

/**
 * Creates a JointJS-compatible `defaultLink` callback from the React prop.
 * Wraps the user-facing {@link DefaultLinkParams} API and converts {@link LinkRecord} results
 * into JointJS link model instances.
 * @param defaultLink
 */
function createDefaultLinkCallback(defaultLink: DefaultLink | undefined) {
  // Guard for JS callers (TS already forbids it): a raw `dia.Link` instance
  // would force defensive `.clone()` on every connection and silently couple
  // every created link to one mutable model. Require a factory instead.
  if (defaultLink instanceof dia.Link) {
    throw new TypeError('defaultLink must be a function or Partial<LinkRecord>.');
  }
  return (cellView: dia.CellView, magnet: SVGElement = cellView.el) => {
    const paper = cellView.paper!;
    const graph = paper.model;
    const link =
      typeof defaultLink === 'function'
        ? defaultLink({
            source: toConnectionEnd(cellView, magnet),
            paper,
            graph,
          })
        : defaultLink;
    const LinkModelCtor = getLinkModelConstructor(graph);
    if (!link) {
      return new LinkModelCtor(mapLinkToAttributes({ type: LINK_MODEL_TYPE }));
    }
    // Factory returning a fresh `dia.Link` is legitimate — pass through.
    if (link instanceof dia.Link) return link;
    return new LinkModelCtor(mapLinkToAttributes({ type: LINK_MODEL_TYPE, ...link } as LinkRecord));
  };
}

/**
 * Portals custom link content into the resolved link view container.
 * Subscribes only to the link's `data` slice, source / target / endpoint
 * updates don't re-invoke the user renderer. If a renderer needs the full
 * link record (source/target/id), use {@link useCell}() or {@link useCellId}() from
 * inside it.
 * @param props - Link props.
 * @param props.portalElement - Link portal container element.
 * @param props.renderLink - Callback used to render link content from data.
 * @returns Portaled link content, or null when container is unavailable.
 */
function LinkItem({
  portalElement,
  renderLink: RenderLink,
}: {
  readonly portalElement: SVGElement | HTMLElement;
  readonly renderLink: RenderLink;
}) {
  const id = useContext(CellIdContext);
  const store = useGraphStore();
  const { cells } = store.graphProjection;
  const subscribe = useCallback(
    (listener: () => void) => (id === undefined ? () => {} : cells.subscribe(id, listener)),
    [cells, id]
  );
  const getSnapshot = useCallback(() => {
    if (id === undefined) return EMPTY_DATA;
    const record = cells.get(id) as LinkRecord | undefined;
    return record?.data ?? EMPTY_DATA;
  }, [cells, id]);
  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!portalElement || id === undefined) {
    return null;
  }
  const linkContent = <RenderLink {...data} />;
  return createPortal(linkContent, portalElement);
}

/**
 * The default element if the user doesn't provide a renderElement function.
 * Renders `data.label` inside an {@link HTMLBox}.
 * @param data - the element's user data slice
 * @returns A JSX element rendering the label inside an {@link HTMLBox} with default styling.
 */
const defaultRenderElement = (data: unknown) => {
  const label = (data as { label?: string } | undefined)?.label;
  return <HTMLBox>{label}</HTMLBox>;
};

/**
 * Creates and manages a React-backed JointJS paper instance lifecycle.
 * @param options - Hook options with paper settings and behavior overrides.
 * @returns Hook state with paper instance and rendered portal content.
 */
export function useCreatePortalPaper(
  options: Readonly<CreatePortalPaperOptions>
): CreatePortalPaperResult {
  const {
    renderElement = defaultRenderElement,
    renderLink,
    defaultLink,
    validateConnection,
    connectionStrategy,
    validateEmbedding,
    validateUnembedding,
    cellVisibility,
    interactive,
    useHTMLOverlay,
    transform,
    portalSelector,
    linkRouting,
    options: escapeHatchOptions,
    // These are React host props and must not be forwarded to dia.Paper options.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    className,
    nodeRef,
    onReady,
    id,
    paper: externalPaper,
    isExternalPaper,
    ...paperOptions
  } = options;
  if (!id) {
    throw new Error('Paper id is required. Please provide an id prop to the Paper component.');
  }

  const graphStore = useGraphStore();
  const areElementsMeasured = useAreElementsMeasured();

  // Subscribe to cells-container size — only re-renders when cells are added or removed.
  // Partition the id list by type so element / link portals can be rendered separately.
  const allCellIds = useContainerKeys(graphStore.graphProjection.cells);
  const { elementIds, linkIds } = useMemo(() => {
    const elements: CellId[] = [];
    const links: CellId[] = [];
    const container = graphStore.graphProjection.cells;
    for (const cellId of allCellIds) {
      const cell = container.get(cellId);
      if (!cell) continue;
      if (graphStore.isElement(cell)) {
        elements.push(cellId);
      } else if (graphStore.isLink(cell)) {
        links.push(cellId);
      }
    }
    return { elementIds: elements, linkIds: links };
  }, [allCellIds, graphStore]);

  const deferredElementIdsRaw = useDeferredValue(elementIds);
  const deferredLinkIdsRaw = useDeferredValue(linkIds);
  const shouldDefer = elementIds.length > 100 || linkIds.length > 100;
  const featuresContext = useContext(PaperFeaturesContext);

  const deferredElementIds = shouldDefer ? deferredElementIdsRaw : elementIds;
  const deferredLinkIds = shouldDefer ? deferredLinkIdsRaw : linkIds;

  const selectPaperVersion = useMemo(() => createSelectPaperVersion(id), [id]);

  // Subscribe to paper version to trigger re-renders on view mount/unmount changes
  const version = useInternalData(selectPaperVersion);
  const { addPaper } = useGraphStore();
  const paperStore = usePaperStore(id);
  const { paper } = paperStore ?? {};

  const paperRef = useRef<PaperView | null>(null);
  const isReadyNotifiedRef = useRef(false);

  const [HTMLRendererContainer, setHTMLRendererContainer] = useState<HTMLElement | null>(null);

  const hasRenderElement = !!renderElement;
  const hasRenderLink = !!renderLink;

  const defaultLinkCallback = useMemo(() => createDefaultLinkCallback(defaultLink), [defaultLink]);

  const validateConnectionCallback = useMemo(() => {
    const canConnectionOptions: CanConnectOptions | undefined =
      typeof validateConnection === 'function'
        ? { validate: validateConnection }
        : validateConnection;
    return canConnect(canConnectionOptions);
  }, [validateConnection]);

  const connectionStrategyCallback = useMemo(() => {
    const resolvedOptions: ConnectionStrategyOptions | undefined =
      typeof connectionStrategy === 'function'
        ? { customize: connectionStrategy }
        : connectionStrategy;
    return resolvedOptions ? connectionStrategyPreset(resolvedOptions) : undefined;
  }, [connectionStrategy]);

  const validateEmbeddingCallback = useMemo(() => canEmbed(validateEmbedding), [validateEmbedding]);

  const validateUnembeddingCallback = useMemo(
    () => canUnembed(validateUnembedding),
    [validateUnembedding]
  );

  // `cellVisibility` has a dedicated prop and is managed by feature ownership
  // (e.g. a virtual-rendering scroller); it must not come through the `options`
  // escape hatch. Excluded from `PaperOptions` at the type level — this guards
  // the same misuse in plain JS. Only an actually-provided value is an error;
  // an explicit `undefined` is a harmless no-op.
  const escapeHatchCellVisibility = (escapeHatchOptions as { cellVisibility?: unknown } | undefined)
    ?.cellVisibility;
  if (escapeHatchCellVisibility !== undefined) {
    throw new Error(
      'Paper: `cellVisibility` cannot be set via the `options` escape hatch — use the dedicated `cellVisibility` prop.'
    );
  }

  const cellVisibilityCallback = useMemo(
    () => toNativeCellVisibility(cellVisibility),
    [cellVisibility]
  );

  const interactiveValue = useMemo(() => toNativeCellInteractivity(interactive), [interactive]);

  const isReady = !!paper && (isExternalPaper || !nodeRef || !!nodeRef.current);

  const eventHandlers = useMemo(() => extractEventsFromPaperProps(paperOptions), [paperOptions]);
  useOnEvents(paperStore, eventHandlers, subscribeToPaperEvents);

  useLayoutEffect(() => {
    const hostElementForCreation = nodeRef?.current;

    const { paperStore, remove } = addPaper(id, {
      paperOptions: {
        ...paperOptions,
        id,
        el: hostElementForCreation,
        // Force undefined so the prototype `width`/`height` (800/600) get
        // clobbered — `paper.getComputedSize()` then falls back to
        // `el.clientWidth/clientHeight`, i.e. the host CSS size. Features
        // that need a finite sheet size (e.g. <PaperScroller>) must set
        // `paper.options.width/height` explicitly themselves.
        width: undefined,
        height: undefined,
        defaultLink: defaultLinkCallback,
        validateConnection: validateConnectionCallback,
        connectionStrategy: connectionStrategyCallback,
        validateEmbedding: validateEmbeddingCallback,
        validateUnembedding: validateUnembeddingCallback,
        cellVisibility: cellVisibilityCallback,
        interactive: interactiveValue,
        ...linkRouting,
        ...escapeHatchOptions,
      },
      renderElement,
      renderLink,
      transform,
      portalSelector,
      paper: externalPaper,
    });

    paperRef.current = paperStore.paper ?? null;

    // Expose the resolved native callback so a feature that claims ownership
    // (e.g. a virtual-rendering scroller) can route it into its own logic.
    // Set before the deferred-feature loop runs so the feature sees it.
    paperStore.nativeCellVisibility = cellVisibilityCallback;

    // Call deferred features registered before paper mounted.
    if (featuresContext) {
      for (const [, onAddFeature] of featuresContext.features) {
        const feature = onAddFeature({ graphStore, paperStore, asChildren: true });
        graphStore.setPaperFeature(id, feature);
      }
    }

    return () => {
      paperRef.current = null;

      remove();
    };
    // We intentionally create paper store only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!paper) {
      isReadyNotifiedRef.current = false;
      return;
    }

    if (onReady && !isReadyNotifiedRef.current) {
      isReadyNotifiedRef.current = true;
      onReady(paper);
    }
    paper.unfreeze();
  }, [nodeRef, onReady, paper]);

  useEffect(() => {
    if (!paperStore) return;
    if (!paper) return;

    assignOptions(paper.options, {
      defaultLink: defaultLinkCallback,
      validateConnection: validateConnectionCallback,
      connectionStrategy: connectionStrategyCallback,
      validateEmbedding: validateEmbeddingCallback,
      validateUnembedding: validateUnembeddingCallback,
      // When a feature owns `cellVisibility` (e.g. a virtual-rendering
      // scroller), omit it — writing it would clobber the feature's wrapper.
      // The escape hatch can't set it (excluded from PaperOptions), so the
      // dedicated prop is the only source.
      ...(paperStore.isCellVisibilityOwned ? {} : { cellVisibility: cellVisibilityCallback }),
      ...paperOptions,
      ...linkRouting,
      ...escapeHatchOptions,
    });

    const { drawGrid, gridSize } = paperOptions;

    paper.setInteractivity(interactiveValue);

    if (drawGrid !== undefined) {
      paper.setGrid(drawGrid);
    }
    if (gridSize !== undefined) {
      paper.setGridSize(gridSize);
    }
    if (transform !== undefined) {
      paper.matrix(toSVGMatrix(transform));
    }
  }, [
    defaultLinkCallback,
    validateConnectionCallback,
    connectionStrategyCallback,
    validateEmbeddingCallback,
    validateUnembeddingCallback,
    cellVisibilityCallback,
    interactiveValue,
    escapeHatchOptions,
    linkRouting,
    paper,
    paperOptions,
    paperStore,
    transform,
  ]);

  // Keep the resolved native `cellVisibility` current and, when a feature owns
  // it, push the refreshed callback to that owner. Keyed on the callback alone
  // so unrelated prop changes don't trigger a redundant re-wrap / viewport
  // recompute.
  useEffect(() => {
    if (!paperStore) return;
    paperStore.nativeCellVisibility = cellVisibilityCallback;
    if (paperStore.isCellVisibilityOwned) {
      paperStore.notifyCellVisibilityOwner(cellVisibilityCallback);
    }
  }, [cellVisibilityCallback, paperStore]);

  const elements = useMemo(() => {
    if (!hasRenderElement) {
      return null;
    }
    return deferredElementIds.map((elementId) => {
      const elementView = paperStore?.getElementView(elementId);
      if (!elementView?.paper) {
        return null;
      }
      if (!(elementView.paper instanceof PaperView)) {
        return null;
      }

      const portalNode = elementView.paper.getCellViewPortalNode(elementView);

      if (!portalNode?.isConnected) {
        return null;
      }

      return (
        <CellIdContext.Provider key={elementId} value={elementId}>
          {useHTMLOverlay && HTMLRendererContainer ? (
            <>
              <HTMLElementItem
                portalElement={HTMLRendererContainer}
                renderElement={renderElement}
                areElementsMeasured={areElementsMeasured}
              />
              <SVGElementItem
                portalElement={portalNode}
                renderElement={ElementHitArea}
                areElementsMeasured={areElementsMeasured}
              />
            </>
          ) : (
            <SVGElementItem
              portalElement={portalNode}
              renderElement={renderElement}
              areElementsMeasured={areElementsMeasured}
            />
          )}
        </CellIdContext.Provider>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    version,
    HTMLRendererContainer,
    areElementsMeasured,
    deferredElementIds,
    hasRenderElement,
    paperStore,
    renderElement,
    useHTMLOverlay,
  ]);

  const renderedLinks = useMemo(() => {
    if (!hasRenderLink || !renderLink) {
      return null;
    }

    return deferredLinkIds.map((linkId) => {
      const linkView = paperStore?.getLinkView(linkId);
      if (!linkView?.paper) {
        return null;
      }

      if (!(linkView.paper instanceof PaperView)) {
        return;
      }

      const portalNode = linkView.paper.getCellViewPortalNode(linkView);
      if (!portalNode) {
        return null;
      }

      return (
        <CellIdContext.Provider key={linkId} value={linkId}>
          <LinkItem portalElement={portalNode} renderLink={renderLink} />
        </CellIdContext.Provider>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredLinkIds, version, hasRenderLink, paperStore, renderLink]);

  const content = useMemo(
    () => (
      <>
        {hasRenderElement && useHTMLOverlay && (
          <PaperHTMLContainer onSetElement={setHTMLRendererContainer} />
        )}
        {renderedLinks}
        {elements}
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasRenderElement, version, elements, renderedLinks, useHTMLOverlay]
  );

  return {
    id,
    paperRef,
    paperStore: paperStore ?? undefined,
    isReady,
    content,
  };
}
