/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-shadow */
import { dia } from '@joint/core';
import {
  useCallback,
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
import { useLinkData } from './use-link-data';
import { useContainerKeys } from './use-container-keys';
import type { PaperStore } from '../store';
import { PortalPaper } from '../models/portal-paper';
import type { PaperProps, RenderLink } from '../components/paper/paper.types';
import { HTMLBox } from '../components/html-box';

import { mapLinkToAttributes } from '../state/data-mapping';
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
import { LINK_MODEL_TYPE } from '../internal';

type LinkModelConstructor = new (attributes?: dia.Link.Attributes) => dia.Link;

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
 * Resolves the `LinkModel` constructor from graph cell namespace.
 * @param graph - Graph instance with layer collection namespace.
 * @returns The `LinkModel` constructor from graph namespace.
 * @throws {Error} When `LinkModel` is missing in graph namespace.
 */
function getLinkModelConstructor(graph: dia.Graph): LinkModelConstructor {
  const Ctor = graph.getTypeConstructor(LINK_MODEL_TYPE) as LinkModelConstructor | undefined;
  if (typeof Ctor !== 'function') throw new Error('Paper: no default link model found. Use `options.defaultLink` to specify a default link model.');
  return Ctor as LinkModelConstructor;
}

/**
 * Portals custom link content into the resolved link view container.
 * Reads link data via useLinkData from CellIdContext and passes it to renderLink.
 * @param props - Link props.
 * @param props.portalElement - Link portal container element.
 * @param props.renderLink - Callback used to render link content.
 * @returns Portaled link content, or null when container is unavailable.
 */
function LinkItem({
  portalElement,
  renderLink,
}: {
  readonly portalElement: SVGElement | HTMLElement;
  readonly renderLink: RenderLink;
}) {
  const data = useLinkData();
  if (!portalElement) {
    return null;
  }

  const linkContent = renderLink(data);
  return createPortal(linkContent, portalElement);
}

/**
 * The default element if the user doesn't provide a renderElement function.
 * Renders the label in a DefaultHTMLHost.
 * @param data - Element data containing the label to render.
 * @returns A JSX element rendering the label inside a DefaultHTMLHost with default styling.
 */
const defaultRenderElement = (data: Record<string, unknown>) => {
  return <HTMLBox>{data?.label as string}</HTMLBox>;
};

/**
 * Creates and manages a React-backed JointJS paper instance lifecycle.
 * @param options - Hook options with paper settings and behavior overrides.
 * @returns Hook state with paper instance and rendered portal content.
 */
export function useCreatePortalPaper(
  options: Readonly<UseCreatePortalPaperOptions>
): UseCreatePortalPaperResult {
  const {
    renderElement = defaultRenderElement,
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

  const graphStore = useGraphStore();
  const areElementsMeasured = useAreElementsMeasured();

  // Subscribe to container size — only re-renders when elements/links are added or removed.
  // This replaces the expensive Object.keys(elementsState) which fired on every data change.
  const elementIds = useContainerKeys(graphStore.graphView.elements);
  const linkIds = useContainerKeys(graphStore.graphView.links);

  const deferredElementIdsRaw = useDeferredValue(elementIds);
  const deferredLinkIdsRaw = useDeferredValue(linkIds);
  const shouldDefer = elementIds.length > 100 || linkIds.length > 100;
  const featuresContext = useContext(PaperFeaturesContext);

  const deferredElementIds = shouldDefer ? deferredElementIdsRaw : elementIds;
  const deferredLinkIds = shouldDefer ? deferredLinkIdsRaw : linkIds;

  const selectPaperVersion = useMemo(() => createSelectPaperVersion(id), [id]);

  // Subscribe to paper version to trigger re-renders on view mount/unmount changes
  const version = useInternalData(selectPaperVersion);
  const { addPaper, graph } = useGraphStore();
  const paperStore = usePaperStore(id);
  const { paper } = paperStore ?? {};

  const paperRef = useRef<PortalPaper | null>(null);
  const isReadyNotifiedRef = useRef(false);

  const [HTMLRendererContainer, setHTMLRendererContainer] = useState<HTMLElement | null>(null);

  const hasRenderElement = !!renderElement;
  const hasRenderLink = !!renderLink;

  const defaultLinkCallback = useCallback(
    (cellView: dia.CellView, magnet: SVGElement) => {
      const isDefaultLinkFactory = typeof defaultLink === 'function';
      const link = isDefaultLinkFactory ? defaultLink(cellView, magnet) : defaultLink;
      const LinkModelCtor = getLinkModelConstructor(graph);
      if (!link) {
        return new LinkModelCtor(mapLinkToAttributes({}));
      }
      if (link instanceof dia.Link) {
        if (isDefaultLinkFactory) {
          return link;
        }
        return link.clone();
      }
      return new LinkModelCtor(mapLinkToAttributes(link));
    },

    [defaultLink, graph]
  );

  const isReady = !!paper && (isExternalPaper || !elementRef || !!elementRef.current);

  useLayoutEffect(() => {
    const hostElementForCreation = elementRef?.current;

    const { paperStore, remove } = addPaper(id, {
      paperOptions: {
        ...paperOptions,
        id,
        el: hostElementForCreation,
        defaultLink: defaultLinkCallback,
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
      defaultLink: defaultLinkCallback,
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
  }, [defaultLinkCallback, paper, paperOptions, paperStore, scale]);

  const elements = useMemo(() => {
    if (!hasRenderElement) {
      return null;
    }
    return deferredElementIds.map((elementId) => {
      const elementView = paperStore?.getElementView(elementId);
      if (!elementView?.paper) {
        return null;
      }
      if (!(elementView.paper instanceof PortalPaper)) {
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

      if (!(linkView.paper instanceof PortalPaper)) {
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
