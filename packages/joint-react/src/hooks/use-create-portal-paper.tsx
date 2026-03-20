/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-shadow */
import { dia, mvc } from '@joint/core';
import {
  useCallback,
  useDebugValue,
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
import { useElements } from './use-elements';
import { useLinks } from './use-links';
import { useInternalData, useElementsLayout } from './use-stores';
import type { PaperStore } from '../store';
import type { FlatLinkData } from '../types/link-types';
import type { PortalPaper } from '../models/portal-paper';
import type { PaperProps, RenderLink } from '../components/paper/paper.types';

import { assignOptions } from '../utils/object-utilities';
import { PAPER_ELEMENTS_MEASURED, type ElementsMeasuredEvent } from '../types/event.types';
import { PaperHTMLContainer } from '../components/paper/render-element/paper-html-container';
import { CellIdContext, PaperFeaturesContext } from '../context';
import {
  ElementHitArea,
  HTMLElementItem,
  SVGElementItem,
} from '../components/paper/render-element/paper-element-item';
import {
  selectAreElementsMeasured,
  selectElementSizes,
  selectResetVersion,
  createSelectPaperVersion,
} from '../selectors';

type PortalLinkConstructor = new (attributes?: dia.Link.Attributes) => dia.Link;

export interface UseCreatePortalPaperOptions extends PaperProps {
  /**
   * Host element ref where the paper should be mounted automatically.
   * When omitted, paper rendering is manual (e.g. via `onReady` callback).
   */
  readonly elementRef?: RefObject<HTMLElement | SVGElement | null>;
  /** Callback fired once when paper instance is created and ready. */
  readonly onReady?: (paper: PortalPaper) => void;
  /** Whether the paper is externally managed (skip div mounting). */
  readonly isExternalPaper?: boolean;
}

export interface UseCreatePortalPaperResult {
  /** Effective paper id used in GraphStore. */
  readonly id: string;
  /** Current paper instance, available synchronously after mount and kept in sync afterwards. */
  readonly paperRef: RefObject<PortalPaper | null>;
  /** PaperStore for this paper id, available after registration. */
  readonly paperStore?: PaperStore;
  /** True when paper exists and is ready for content rendering. */
  readonly isReady: boolean;
  /** React portals content for elements/links/HTML overlay. */
  readonly content: ReactNode;
}

/**
 * Resolves the `PortalLink` constructor from graph cell namespace.
 * @param graph - Graph instance with layer collection namespace.
 * @returns The `PortalLink` constructor from graph namespace.
 * @throws {Error} When `PortalLink` is missing in graph namespace.
 */
function getPortalLinkConstructor(graph: dia.Graph): PortalLinkConstructor {
  const cellNamespace = graph.layerCollection?.cellNamespace as Record<string, unknown> | undefined;
  const reactLinkConstructor = cellNamespace?.PortalLink;
  if (typeof reactLinkConstructor === 'function') {
    return reactLinkConstructor as PortalLinkConstructor;
  }
  throw new Error(
    'Paper: PortalLink constructor is missing in graph.layerCollection.cellNamespace.'
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
function LinkItem<LinkData = FlatLinkData>({
  link,
  portalElement,
  renderLink,
}: {
  readonly link: LinkData;
  readonly portalElement: SVGElement | HTMLElement;
  readonly renderLink: RenderLink<LinkData>;
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
export function useCreatePortalPaper(
  options: Readonly<UseCreatePortalPaperOptions>
): UseCreatePortalPaperResult {
  const {
    renderElement,
    renderLink,
    defaultLink,
    useHTMLOverlay,
    scale,
    portalSelector,
    // These are React host props and must not be forwarded to dia.Paper options.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    className,
    elementRef,
    onReady,
    id,
    paper: externalPaper,
    isExternalPaper,
    ...paperOptions
  } = options;
  if (!id) {
    throw new Error('Paper id is required. Please provide an id prop to the Paper component.');
  }

  const elementsState = useElements();
  const linksState = useLinks();

  const graphStore = useGraphStore();
  const areElementsMeasured = useElementsLayout(selectAreElementsMeasured);
  const resetVersion = useInternalData(selectResetVersion);
  const sizes = useElementsLayout(selectElementSizes);
  const previousResetVersionRef = useRef(-1);

  useDebugValue(elementsState);
  useDebugValue(linksState);

  const elementIds = useMemo(() => Object.keys(elementsState), [elementsState]);
  const linkIds = useMemo(() => Object.keys(linksState), [linksState]);

  const deferredElementsStateRaw = useDeferredValue(elementsState);
  const deferredLinksStateRaw = useDeferredValue(linksState);
  const shouldDefer = elementIds.length > 100 || linkIds.length > 100;
  const deferredElementsState = shouldDefer ? deferredElementsStateRaw : elementsState;
  const deferredLinksState = shouldDefer ? deferredLinksStateRaw : linksState;
  const featuresContext = useContext(PaperFeaturesContext);

  const deferredElementIds = useMemo(
    () => (shouldDefer ? Object.keys(deferredElementsState) : elementIds),
    [shouldDefer, deferredElementsState, elementIds]
  );
  const deferredLinkIds = useMemo(
    () => (shouldDefer ? Object.keys(deferredLinksState) : linkIds),
    [shouldDefer, deferredLinksState, linkIds]
  );

  const selectPaperVersion = useMemo(() => createSelectPaperVersion(id), [id]);

  // Subscribe to paper version to trigger re-renders on view mount/unmount changes
  const version = useInternalData(selectPaperVersion);
  const { addPaper, graph, graphState } = useGraphStore();
  const paperStore = usePaperStore(id);
  const { paper } = paperStore ?? {};

  const paperRef = useRef<PortalPaper | null>(null);
  const isReadyNotifiedRef = useRef(false);

  const [HTMLRendererContainer, setHTMLRendererContainer] = useState<HTMLElement | null>(null);

  const hasRenderElement = !!renderElement;
  const hasRenderLink = !!renderLink;

  const defaultLinkJointJS = useCallback(
    (cellView: dia.CellView, magnet: SVGElement) => {
      const isDefaultLinkFactory = typeof defaultLink === 'function';
      const link = isDefaultLinkFactory ? defaultLink(cellView, magnet) : defaultLink;
      const PortalLinkModel = getPortalLinkConstructor(graph);
      if (!link) {
        const defaultAttributes = graphState.linkToAttributes({
          data: {} as FlatLinkData,
        });
        return new PortalLinkModel(defaultAttributes);
      }
      if (link instanceof dia.Link) {
        if (isDefaultLinkFactory) {
          return link;
        }
        return link.clone();
      }
      const attributes = graphState.linkToAttributes({
        data: link as FlatLinkData,
      });
      return new PortalLinkModel(attributes);
    },
    [defaultLink, graph, graphState]
  );

  const isReady = !!paper && (isExternalPaper || !elementRef || !!elementRef.current);

  useLayoutEffect(() => {
    const hostElementForCreation = elementRef?.current;

    const { paperStore, remove } = addPaper(id, {
      paperOptions: {
        ...paperOptions,
        id,
        el: hostElementForCreation,
        defaultLink: defaultLinkJointJS,
      },
      renderElement,
      renderLink,
      scale,
      portalSelector,
      paper: externalPaper,
    });

    paperRef.current = paperStore.paper ?? null;

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

  useEffect(() => {
    if (!paper) return;
    const controller = new mvc.Listener();
    function setState(cellView: dia.CellView, isDragging: boolean) {
      const cell = cellView.model;
      if (!cell) return;
      const cellId = cell.id.toString();
      if (!id) {
        throw new Error(
          'Paper id is required to update dragging state. Please provide an id prop to the Paper component.'
        );
      }
      graphStore.updatePaperSnapshot(id, (previous) => {
        return {
          ...previous,
          controlState: {
            draggingIds: { ...previous.controlState?.draggingIds, [cellId]: isDragging },
          },
        };
      });
    }
    controller.listenTo(paper, 'element:pointerdown', (cellView: dia.CellView) => {
      setState(cellView, true);
    });
    controller.listenTo(paper, 'element:pointerup', (cellView: dia.CellView) => {
      setState(cellView, false);
    });
  }, [graphStore, id, paper]);
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
    if (!paper) return;
    if (!areElementsMeasured) return;
    let isInitial = false;
    if (resetVersion !== previousResetVersionRef.current) {
      isInitial = true;
      previousResetVersionRef.current = resetVersion;
    }
    const event: ElementsMeasuredEvent = {
      paper,
      graph: paper.model,
      isInitial,
    };
    paper.trigger(PAPER_ELEMENTS_MEASURED, event);
    // we must have here sizes, as its called each time reference of size changes.
  }, [areElementsMeasured, sizes, paper, resetVersion, graphStore]);

  const elements = useMemo(() => {
    if (!hasRenderElement) {
      return null;
    }
    return deferredElementIds.map((elementId) => {
      const elementState = deferredElementsState[elementId];
      if (!elementState) {
        return null;
      }

      const elementView = paperStore?.getElementView(elementId);
      if (!elementView?.paper) {
        return null;
      }

      const portalNode = (elementView.paper as PortalPaper).getCellViewPortalNode(elementView);

      if (!portalNode?.isConnected) {
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
                renderElement={ElementHitArea}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    version,
    HTMLRendererContainer,
    areElementsMeasured,
    deferredElementIds,
    deferredElementsState,
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
      const linkState = deferredLinksState[linkId];
      if (!linkState) {
        return null;
      }

      const linkView = paperStore?.getLinkView(linkId);
      if (!linkView?.paper) {
        return null;
      }

      const portalNode = (linkView.paper as PortalPaper).getCellViewPortalNode(linkView);
      if (!portalNode) {
        return null;
      }

      return (
        <CellIdContext.Provider key={linkId} value={linkId}>
          <LinkItem link={linkState} portalElement={portalNode} renderLink={renderLink} />
        </CellIdContext.Provider>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredLinkIds, version, deferredLinksState, hasRenderLink, paperStore, renderLink]);
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
