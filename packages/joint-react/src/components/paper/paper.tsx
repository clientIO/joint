/**
 * In current architecture we use elementView to getHtmlElement, then we store those elements in react state and create portals for them.
 * As this is not a recommended approach, we are going to use react portals to render the elements directly.
 * This is a temporary solution until we have a better approach to render the elements.
 * So as expected there are 3 re-renders at the component call.
 * 1. Is mount
 * 2. Is setup of paper
 * 3. Is render of elements
 */
import { dia, mvc } from '@joint/core';
import { useGraphStore } from '../../hooks/use-graph-store';
import {
  forwardRef,
  useCallback,
  useContext,
  useDebugValue,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useDeferredValue,
  type CSSProperties,
} from 'react';
import { useElements, useLinks } from '../../hooks';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';
import type { PaperProps, RenderElement, RenderLink } from './paper.types';
import { assignOptions, dependencyExtract } from '../../utils/object-utilities';
import { PaperHTMLContainer } from './render-element/paper-html-container';
import { CellIdContext, PaperConfigContext, PaperStoreContext } from '../../context';
import {
  DefaultRectElement,
  HTMLElementItem,
  SVGElementItem,
} from './render-element/paper-element-item';
import { createPortal } from 'react-dom';
import { handlePaperEvents, PAPER_EVENT_KEYS } from '../../utils/handle-paper-events';
import type { PaperStore } from '../../store';
import {
  useAreElementsMeasured,
  useGraphInternalStoreSelector,
} from '../../hooks/use-graph-store-selector';

const EMPTY_OBJECT = {} as Record<dia.Cell.ID, dia.ElementView>;
type ReactLinkConstructor = new (attributes?: dia.Link.Attributes) => dia.Link;

/**
 * Retrieves the ReactLink constructor from the graph's cell namespace.
 * This is necessary to create new ReactLink instances when the defaultLink function is called.
 * @param graph - The JointJS graph instance.
 * @returns The ReactLink constructor.
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
 * Updates paper dimensions when width or height props change.
 * Handles partial updates (only width or only height specified).
 */
function updatePaperDimensions(
  paper: dia.Paper,
  width: dia.Paper.Dimension | undefined,
  height: dia.Paper.Dimension | undefined
) {
  const { width: paperWidth, height: paperHeight } = paper.options;
  const shouldUpdateWidth = width !== undefined && width !== paperWidth;
  const shouldUpdateHeight = height !== undefined && height !== paperHeight;
  if (shouldUpdateWidth || shouldUpdateHeight) {
    paper.setDimensions(
      shouldUpdateWidth ? width : (paperWidth ?? 800),
      shouldUpdateHeight ? height : (paperHeight ?? 600)
    );
  }
}

// eslint-disable-next-line jsdoc/require-jsdoc
function LinkItem({
  link,
  portalElement,
  renderLink,
}: {
  link: GraphLink;
  portalElement: SVGAElement;
  renderLink: RenderLink<GraphLink>;
}) {
  if (!portalElement) {
    return null;
  }

  const linkContent = renderLink(link);
  return createPortal(linkContent, portalElement);
}

/**
 * Paper component renders the visual representation of the graph using JointJS Paper.
 * This component is responsible for managing the rendering of elements and links, handling events, and providing customization options for the graph view.
 * @param props - The properties for the Paper component.
 * @param forwardedRef - A reference to the PaperStore instance.
 * @returns The Paper component.
 * @example
 * Using the Paper component:
 * ```tsx
 * import { Paper } from '@joint/react';
 * function App() {
 *   return (
 *     <Paper
 *       renderElement={(element) => <rect width={element.width} height={element.height} />}
 *       defaultLink={(cellView, magnet) => new dia.Link()}
 *     >
 *       <MyGraph />
 *     </Paper>
 *   );
 * }
 * ```
 */
function PaperBase<ElementItem extends GraphElement = GraphElement>(
  props: PaperProps<ElementItem>,
  forwardedRef: React.ForwardedRef<PaperStore | null>
) {
  const {
    renderElement,
    renderLink,
    defaultLink,
    style,
    className,
    onElementsSizeReady,
    onElementsSizeChange,
    useHTMLOverlay,
    children,
    scale,
    width,
    height,
    ...paperOptions
  } = props;

  const areElementsMeasured = useAreElementsMeasured();
  const elementsState = useElements();
  const linksState = useLinks();
  useDebugValue(elementsState);
  useDebugValue(linksState);

  // Compute element and link IDs once for reuse throughout the component
  const elementIds = useMemo(() => Object.keys(elementsState), [elementsState]);
  const linkIds = useMemo(() => Object.keys(linksState), [linksState]);

  // Defer rendering for large graphs to improve initial render performance
  // Threshold: only defer if we have more than 100 elements or links
  // Always call useDeferredValue (hooks rules), but only use deferred value when threshold is met
  const deferredElementsStateRaw = useDeferredValue(elementsState);
  const deferredLinksStateRaw = useDeferredValue(linksState);
  const shouldDefer = elementIds.length > 100 || linkIds.length > 100;
  const deferredElementsState = shouldDefer ? deferredElementsStateRaw : elementsState;
  const deferredLinksState = shouldDefer ? deferredLinksStateRaw : linksState;

  // Compute deferred IDs for rendering (reuse non-deferred if not deferring)
  const deferredElementIds = useMemo(
    () => (shouldDefer ? Object.keys(deferredElementsState) : elementIds),
    [shouldDefer, deferredElementsState, elementIds]
  );
  const deferredLinkIds = useMemo(
    () => (shouldDefer ? Object.keys(deferredLinksState) : linkIds),
    [shouldDefer, deferredLinksState, linkIds]
  );
  const reactId = useId();
  const id = props.id ?? `paper-${reactId}`;
  const { overWrite } = useContext(PaperConfigContext) ?? {};

  const paperElementViews = useGraphInternalStoreSelector(
    (snapshot) => snapshot.papers[id]?.paperElementViews ?? EMPTY_OBJECT
  );

  const paperLinkViews = useGraphInternalStoreSelector(
    (snapshot) => snapshot.papers[id]?.linkViews ?? EMPTY_OBJECT
  );

  const { addPaper, graph, getPaperStore } = useGraphStore();

  const paperStore = getPaperStore(id) ?? null;
  const { paper } = paperStore ?? {};
  const paperHTMLElementRef = useRef<HTMLDivElement | null>(null);
  const measuredRef = useRef(false);
  const previousSizesRef = useRef<number[][]>([]);

  const [HTMLRendererContainer, setHTMLRendererContainer] = useState<HTMLElement | null>(null);

  const hasRenderElement = !!renderElement;
  const hasRenderLink = !!renderLink;

  useImperativeHandle(forwardedRef, () => paperStore as PaperStore, [paperStore]);

  const defaultLinkJointJS = useCallback(
    (cellView: dia.CellView, magnet: SVGElement) => {
      const link = typeof defaultLink === 'function' ? defaultLink(cellView, magnet) : defaultLink;
      const ReactLinkModel = getReactLinkConstructor(graph);
      if (!link) {
        return new ReactLinkModel();
      }
      if (link instanceof dia.Link) {
        return link;
      }
      return new ReactLinkModel(link as dia.Link.Attributes);
    },
    [defaultLink, graph]
  );

  const isReady = !!paper && !!paperHTMLElementRef.current;

  useLayoutEffect(() => {
    if (!paperHTMLElementRef.current) {
      return;
    }
    const remove = addPaper(id, {
      paperElement: paperHTMLElementRef.current,
      paperOptions: {
        ...paperOptions,
        defaultLink: defaultLinkJointJS,
      },
      overWrite,
      renderElement: renderElement as RenderElement<GraphElement>,
      renderLink: renderLink as RenderLink<GraphLink> | undefined,
      scale,
    });
    return () => {
      remove();
    };
    // just once on load create paper instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!paperStore) return;
    if (!paper) return;
    const { overWriteResultRef } = paperStore;
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

    const { shouldIgnoreWidthAndHeightUpdates } = overWriteResultRef ?? {};
    if (!shouldIgnoreWidthAndHeightUpdates) {
      updatePaperDimensions(paper, width, height);
    }
  }, [defaultLinkJointJS, height, paper, paperOptions, paperStore, scale, width]);

  useEffect(() => {
    if (!isReady) return;
    if (measuredRef.current) return;
    if (!paper) return;
    if (areElementsMeasured) {
      measuredRef.current = true;
      return onElementsSizeReady?.({ paper, graph: paper.model });
    }

    // Handling dev warning check
    if (process.env.NODE_ENV !== 'production') {
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
    }
  }, [areElementsMeasured, isReady, onElementsSizeReady, paper]);

  // Whenever elements change (or we've just become measured) compare old ↔ new
  useEffect(() => {
    if (!isReady) return;
    if (!onElementsSizeChange) return;
    if (!areElementsMeasured) return;
    if (!paper) return;

    // Build current list of [currWidth, currHeight] to avoid shadowing outer scope variables
    // Use elementsState (not deferred) for accurate size tracking
    // Reuse elementIds computed above for performance
    const currentSizes = elementIds.map((elementId) => {
      const element = elementsState[elementId];
      return [element?.width ?? 0, element?.height ?? 0];
    });
    const previousSizes = previousSizesRef.current;
    let changed = false;

    // Quick bail-out on length mismatch
    if (previousSizes.length === currentSizes.length) {
      // Otherwise scan for any width/height diff
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
    // store for next time
    previousSizesRef.current = currentSizes;
    onElementsSizeChange({ paper, graph: paper.model });
  }, [areElementsMeasured, elementsState, elementIds, isReady, onElementsSizeChange, paper]);

  useLayoutEffect(() => {
    if (!paper) {
      return;
    }
    /**
     * Resize the paper container element to match the paper size.
     * @param jointPaper - The paper instance.
     */
    function resizePaperContainer(jointPaper: dia.Paper) {
      if (paperHTMLElementRef.current && jointPaper.el) {
        paperHTMLElementRef.current.style.width = jointPaper.el.style.width;
        paperHTMLElementRef.current.style.height = jointPaper.el.style.height;
      }
    }
    // An object to keep track of the listeners. It's not exposed, so the users
    const controller = new mvc.Listener();
    controller.listenTo(paper, 'resize', resizePaperContainer);
    const stopListening = handlePaperEvents(graph, paper, paperOptions);
    return () => {
      controller.stopListening();
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, isReady, ...dependencyExtract(paperOptions, PAPER_EVENT_KEYS)]);

  const renderedElements = useMemo(() => {
    if (!hasRenderElement) {
      return null;
    }

    return deferredElementIds.map((elementId) => {
      const elementState = deferredElementsState[elementId];
      if (!elementState) {
        return null;
      }

      const elementView = paperElementViews[elementId];
      if (!elementView) {
        return null;
      }

      const SVG = elementView.el;
      if (!SVG) {
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
              {/* We need to render this element too, its kind of hack - placeholder */}
              <SVGElementItem
                {...elementState}
                portalElement={SVG as SVGAElement}
                renderElement={DefaultRectElement}
                areElementsMeasured={areElementsMeasured}
                id={elementId}
              />
            </>
          ) : (
            <SVGElementItem
              {...elementState}
              portalElement={SVG as SVGAElement}
              renderElement={renderElement}
              areElementsMeasured={areElementsMeasured}
              id={elementId}
            />
          )}
        </CellIdContext.Provider>
      );
    });
  }, [
    hasRenderElement,
    deferredElementIds,
    deferredElementsState,
    paperElementViews,
    useHTMLOverlay,
    HTMLRendererContainer,
    renderElement,
    areElementsMeasured,
  ]);

  const renderedLinks = useMemo(() => {
    if (!hasRenderLink) {
      return null;
    }

    return deferredLinkIds.map((linkId) => {
      const linkState = deferredLinksState[linkId];
      if (!linkState) {
        return null;
      }

      const linkView = paperLinkViews[linkId];
      if (!linkView) {
        return null;
      }

      const SVG = linkView.el;
      if (!SVG) {
        return null;
      }

      if (!renderLink) {
        return null;
      }

      return (
        <CellIdContext.Provider key={linkId} value={linkId}>
          <LinkItem link={linkState} portalElement={SVG as SVGAElement} renderLink={renderLink} />
        </CellIdContext.Provider>
      );
    });
  }, [hasRenderLink, deferredLinkIds, deferredLinksState, paperLinkViews, renderLink]);

  const content = (
    <>
      {hasRenderElement && useHTMLOverlay && (
        <PaperHTMLContainer onSetElement={setHTMLRendererContainer} />
      )}
      {renderedLinks}
      {renderedElements}
    </>
  );

  const defaultStyle = useMemo((): CSSProperties => {
    if (style) {
      return style;
    }
    return {
      width: width ?? '100%',
      height: height ?? '100%',
    };
  }, [height, width, style]);

  const paperContainerStyle = useMemo(
    (): CSSProperties => ({
      ...defaultStyle,
    }),
    [defaultStyle]
  );

  return (
    <PaperStoreContext.Provider value={paperStore ?? null}>
      <div className={className} ref={paperHTMLElementRef} style={paperContainerStyle}>
        {isReady && content}
      </div>
      {isReady && children}
    </PaperStoreContext.Provider>
  );
}

/**
 * Paper component renders the visual representation of the graph using JointJS Paper.
 * This component is responsible for managing the rendering of elements and links, handling events, and providing customization options for the graph view.
 * @param props - The properties for the Paper component.
 * @param forwardedRef - A reference to the PaperStore instance.
 * @returns The Paper component.
 * @example
 * Using the Paper component:
 * ```tsx
 * import { Paper } from '@joint/react';
 * function App() {
 *   return (
 *     <Paper
 *       renderElement={(element) => <rect width={element.width} height={element.height} />}
 *       defaultLink={(cellView, magnet) => new dia.Link()}
 *     >
 *       <MyGraph />
 *     </Paper>
 *   );
 * }
 * ```
 */
export const Paper = forwardRef(PaperBase) as <ElementItem extends GraphElement = GraphElement>(
  props: Readonly<PaperProps<ElementItem>> & {
    ref?: React.Ref<PaperStore>;
  }
) => ReturnType<typeof PaperBase>;
