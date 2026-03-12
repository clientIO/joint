import { dia } from '@joint/core';
import {
  useCallback,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useId,
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
import { usePaperStoreById } from './use-paper-context';
import { useElements } from './use-elements';
import { useLinks } from './use-links';
import { useAreElementsMeasured, useInternalData } from './use-stores';
import type { PaperStore } from '../store';
import type { CellId } from '../types/cell-id';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import type { ReactPaper } from '../models/react-paper';
import type { PaperProps, RenderElement, RenderLink } from '../components/paper/paper.types';
import { assignOptions } from '../utils/object-utilities';
import { PaperHTMLContainer } from '../components/paper/render-element/paper-html-container';
import { CellIdContext, PaperConfigContext } from '../context';
import {
  DefaultRectElement,
  HTMLElementItem,
  SVGElementItem,
} from '../components/paper/render-element/paper-element-item';

const EMPTY_VIEW_ID_RECORD = {} as Record<CellId, true>;

type ReactLinkConstructor = new (attributes?: dia.Link.Attributes) => dia.Link;

export interface UseCreateReactPaperOptions<ElementData = FlatElementData>
  extends PaperProps<ElementData> {
  /**
   * Host element ref where the paper should be mounted automatically.
   * When omitted, paper rendering is manual (e.g. via `onReady` callback).
   */
  readonly elementRef?: RefObject<HTMLElement | SVGElement | null>;
  /** Callback fired once when paper instance is created and ready. */
  readonly onReady?: (paper: ReactPaper) => void;
}

export interface UseCreateReactPaperResult {
  /** Effective paper id used in GraphStore. */
  readonly id: string;
  /** Current paper instance, available synchronously after mount and kept in sync afterwards. */
  readonly paperRef: RefObject<ReactPaper | null>;
  /** PaperStore for this paper id, available after registration. */
  readonly paperStore?: PaperStore;
  /** True when paper exists and is ready for content rendering. */
  readonly isReady: boolean;
  /** React portals content for elements/links/HTML overlay. */
  readonly content: ReactNode;
}

/**
 * Resolves the `ReactLink` constructor from graph cell namespace.
 * @param graph - Graph instance with layer collection namespace.
 * @returns The `ReactLink` constructor from graph namespace.
 * @throws {Error} When `ReactLink` is missing in graph namespace.
 */
function getReactLinkConstructor(graph: dia.Graph): ReactLinkConstructor {
  const cellNamespace = graph.layerCollection?.cellNamespace as Record<string, unknown> | undefined;
  const reactLinkConstructor = cellNamespace?.ReactLink;
  if (typeof reactLinkConstructor === 'function') {
    return reactLinkConstructor as ReactLinkConstructor;
  }
  throw new Error(
    'Paper: ReactLink constructor is missing in graph.layerCollection.cellNamespace.'
  );
}

/**
 * Portals custom link content into the resolved link view container.
 * @param props - Link props.
 * @param props.link - Link data object.
 * @param props.portalElement - Link portal container element.
 * @param props.renderLink - Callback used to render link content.
 * @returns Portaled link content, or null when container is unavailable.
 */
function LinkItem({
  link,
  portalElement,
  renderLink,
}: {
  readonly link: FlatLinkData;
  readonly portalElement: SVGElement | HTMLElement;
  readonly renderLink: RenderLink<FlatLinkData>;
}) {
  if (!portalElement) {
    return null;
  }

  const linkContent = renderLink(link);
  return createPortal(linkContent, portalElement);
}

/**
 * Creates and manages a React-backed JointJS paper instance lifecycle.
 * @param options - Hook options with paper settings and behavior overrides.
 * @returns Hook state with paper instance and rendered portal content.
 */
export function useCreateReactPaper<ElementData = FlatElementData>(
  options: Readonly<UseCreateReactPaperOptions<ElementData>>
): UseCreateReactPaperResult {
  const {
    renderElement,
    renderLink,
    defaultLink,
    onElementsSizeReady,
    onElementsSizeChange,
    useHTMLOverlay,
    scale,
    portalSelector,
    // These are React host props and must not be forwarded to dia.Paper options.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    className,
    elementRef,
    onReady,
    ...paperOptions
  } = options;

  const areElementsMeasured = useAreElementsMeasured();
  const elementsState = useElements();
  const linksState = useLinks();

  const config = useContext(PaperConfigContext);
  useDebugValue(elementsState);
  useDebugValue(linksState);

  const elementIds = useMemo(() => Object.keys(elementsState), [elementsState]);
  const linkIds = useMemo(() => Object.keys(linksState), [linksState]);

  const deferredElementsStateRaw = useDeferredValue(elementsState);
  const deferredLinksStateRaw = useDeferredValue(linksState);
  const shouldDefer = elementIds.length > 100 || linkIds.length > 100;
  const deferredElementsState = shouldDefer ? deferredElementsStateRaw : elementsState;
  const deferredLinksState = shouldDefer ? deferredLinksStateRaw : linksState;

  const deferredElementIds = useMemo(
    () => (shouldDefer ? Object.keys(deferredElementsState) : elementIds),
    [shouldDefer, deferredElementsState, elementIds]
  );
  const deferredLinkIds = useMemo(
    () => (shouldDefer ? Object.keys(deferredLinksState) : linkIds),
    [shouldDefer, deferredLinksState, linkIds]
  );

  const reactId = useId();
  const id = options.id ?? `paper-${reactId}`;

  const paperElementViewIds = useInternalData(
    (snapshot) => snapshot.papers[id]?.elementViewIds ?? EMPTY_VIEW_ID_RECORD
  );

  const paperLinkViewIds = useInternalData(
    (snapshot) => snapshot.papers[id]?.linkViewIds ?? EMPTY_VIEW_ID_RECORD
  );

  const hasElementViewSnapshot = useInternalData(
    (snapshot) => snapshot.papers[id]?.hasElementViewSnapshot
  );

  const { addPaper, getPaperStore, graph, mapDataToLinkAttributes } = useGraphStore();
  const paperStore = usePaperStoreById(id);
  const { paper } = paperStore ?? {};

  const paperRef = useRef<ReactPaper | null>(null);
  const measuredRef = useRef(false);
  const previousSizesRef = useRef<number[][]>([]);
  const isReadyNotifiedRef = useRef(false);

  const [HTMLRendererContainer, setHTMLRendererContainer] = useState<HTMLElement | null>(null);

  const hasRenderElement = !!renderElement;
  const hasRenderLink = !!renderLink;

  const defaultLinkJointJS = useCallback(
    (cellView: dia.CellView, magnet: SVGElement) => {
      const isDefaultLinkFactory = typeof defaultLink === 'function';
      const link = isDefaultLinkFactory ? defaultLink(cellView, magnet) : defaultLink;
      const ReactLinkModel = getReactLinkConstructor(graph);
      if (!link) {
        const defaultAttributes = mapDataToLinkAttributes({
          data: {} as FlatLinkData,
          graph,
        });
        return new ReactLinkModel(defaultAttributes);
      }
      if (link instanceof dia.Link) {
        if (isDefaultLinkFactory) {
          return link;
        }
        return link.clone();
      }
      const attributes = mapDataToLinkAttributes({
        data: link as FlatLinkData,
        graph,
      });
      return new ReactLinkModel(attributes);
    },
    [defaultLink, graph, mapDataToLinkAttributes]
  );

  const isReady = !!paper && (!elementRef || !!elementRef.current);

  useLayoutEffect(() => {
    const hostElementForCreation = elementRef?.current;
    const remove = addPaper(id, {
      paperOptions: {
        ...paperOptions,
        el: hostElementForCreation ?? paperOptions.el,
        defaultLink: defaultLinkJointJS,
      },
      alternateId: config?.alternateId,
      renderElement: renderElement as RenderElement<FlatElementData>,
      renderLink: renderLink as RenderLink<FlatLinkData> | undefined,
      scale,
      portalSelector,
    });
    paperRef.current = getPaperStore(id)?.paper ?? null;

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
  }, [elementRef, onReady, paper]);

  useEffect(() => {
    if (!paperStore) return;
    if (!paper) return;

    assignOptions(paper.options, {
      defaultLink: defaultLinkJointJS,
      ...paperOptions,
    });

    const { drawGrid, theme, gridSize } = paperOptions;

    if (drawGrid !== undefined) {
      paper.setGrid(drawGrid);
    }
    if (gridSize !== undefined) {
      paper.setGridSize(gridSize);
    }
    if (theme !== undefined) {
      paper.setTheme(theme);
    }
    if (scale !== undefined) {
      paper.scale(scale);
    }
  }, [defaultLinkJointJS, paper, paperOptions, paperStore, scale]);

  useEffect(() => {
    if (!hasElementViewSnapshot) return;
    if (!isReady) return;
    if (measuredRef.current) return;
    if (!paper) return;

    if (areElementsMeasured) {
      measuredRef.current = true;
      onElementsSizeReady?.({ paper, graph: paper.model });
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const timeout = setTimeout(() => {
      if (!areElementsMeasured) {
        // eslint-disable-next-line no-console
        console.error(
          'The elements are not measured yet, please check if elements has defined width and height inside the nodes or using `useNodeSize` hook.'
        );
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [areElementsMeasured, hasElementViewSnapshot, isReady, onElementsSizeReady, paper]);

  useEffect(() => {
    if (!hasElementViewSnapshot) return;
    if (!isReady) return;
    if (!onElementsSizeChange) return;
    if (!areElementsMeasured) return;
    if (!paper) return;

    const currentSizes = elementIds.map((elementId) => {
      const element = elementsState[elementId];
      return [element?.width ?? 0, element?.height ?? 0];
    });
    const previousSizes = previousSizesRef.current;

    // Prime baseline snapshot first to avoid an initial stale layout pass.
    // `onElementsSizeChange` should react to size deltas, not first observation.
    if (previousSizes.length === 0) {
      previousSizesRef.current = currentSizes;
      return;
    }

    let changed = false;

    if (previousSizes.length === currentSizes.length) {
      for (const [index, currentSize] of currentSizes.entries()) {
        if (
          previousSizes[index][0] !== currentSize[0] ||
          previousSizes[index][1] !== currentSize[1]
        ) {
          changed = true;
          break;
        }
      }
    } else {
      changed = true;
    }

    if (!changed) {
      return;
    }

    previousSizesRef.current = currentSizes;
    onElementsSizeChange({ paper, graph: paper.model });
  }, [
    areElementsMeasured,
    elementIds,
    elementsState,
    hasElementViewSnapshot,
    isReady,
    onElementsSizeChange,
    paper,
  ]);

  const renderedElements = useMemo(() => {
    if (!hasRenderElement) {
      return null;
    }

    return deferredElementIds.map((elementId) => {
      const elementState = deferredElementsState[elementId];
      if (!elementState) {
        return null;
      }

      if (!paperElementViewIds[elementId]) {
        return null;
      }

      const elementView = paperStore?.getElementView(elementId);
      if (!elementView?.paper) {
        return null;
      }

      const portalNode = (elementView.paper as ReactPaper).getCellViewPortalNode(elementView);

      if (!portalNode || !portalNode.isConnected) {
        return null;
      }

      return (
        <CellIdContext.Provider key={elementId} value={elementId}>
          {useHTMLOverlay && HTMLRendererContainer ? (
            <>
              <HTMLElementItem
                {...elementState}
                portalElement={HTMLRendererContainer}
                renderElement={renderElement}
                areElementsMeasured={areElementsMeasured}
                id={elementId}
              />
              <SVGElementItem
                {...elementState}
                portalElement={portalNode}
                renderElement={DefaultRectElement}
                areElementsMeasured={areElementsMeasured}
                id={elementId}
              />
            </>
          ) : (
            <SVGElementItem
              {...elementState}
              portalElement={portalNode}
              renderElement={renderElement}
              areElementsMeasured={areElementsMeasured}
              id={elementId}
            />
          )}
        </CellIdContext.Provider>
      );
    });
  }, [
    HTMLRendererContainer,
    areElementsMeasured,
    deferredElementIds,
    deferredElementsState,
    hasRenderElement,
    paperElementViewIds,
    paperStore,
    renderElement,
    useHTMLOverlay,
  ]);

  const renderedLinks = useMemo(() => {
    if (!hasRenderLink || !renderLink) {
      return null;
    }

    return deferredLinkIds.map((linkId) => {
      const linkState = deferredLinksState[linkId];
      if (!linkState) {
        return null;
      }

      if (!paperLinkViewIds[linkId]) {
        return null;
      }

      const linkView = paperStore?.getLinkView(linkId);
      if (!linkView?.paper) {
        return null;
      }

      const portalNode = (linkView.paper as ReactPaper).getCellViewPortalNode(linkView);
      if (!portalNode) {
        return null;
      }

      return (
        <CellIdContext.Provider key={linkId} value={linkId}>
          <LinkItem link={linkState} portalElement={portalNode} renderLink={renderLink} />
        </CellIdContext.Provider>
      );
    });
  }, [
    deferredLinkIds,
    deferredLinksState,
    hasRenderLink,
    paperLinkViewIds,
    paperStore,
    renderLink,
  ]);

  const content = useMemo(
    () => (
      <>
        {hasRenderElement && useHTMLOverlay && (
          <PaperHTMLContainer onSetElement={setHTMLRendererContainer} />
        )}
        {renderedLinks}
        {renderedElements}
      </>
    ),
    [hasRenderElement, renderedElements, renderedLinks, useHTMLOverlay]
  );

  return {
    id,
    paperRef,
    paperStore: paperStore ?? undefined,
    isReady,
    content,
  };
}
