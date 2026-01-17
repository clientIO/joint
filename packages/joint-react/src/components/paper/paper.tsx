/**
 * In current architecture we use elementView to getHtmlElement, then we store those elements in react state and create portals for them.
 * As this is not a recommended approach, we are going to use react portals to render the elements directly.
 * This is a temporary solution until we have a better approach to render the elements.
 * So as expected there are 3 re-renders at the component call.
 * 1. Is mount
 * 2. Is setup of paper
 * 3. Is render of elements
 */
import { dia, mvc, shapes } from '@joint/core';
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
import { HTMLElementItem, SVGElementItem } from './render-element/paper-element-item';
import { createPortal } from 'react-dom';
import { handlePaperEvents, PAPER_EVENT_KEYS } from '../../utils/handle-paper-events';
import type { PaperStore } from '../../store';
import {
  useAreElementsMeasured,
  useGraphInternalStoreSelector,
} from '../../hooks/use-graph-store-selector';

const EMPTY_OBJECT = {} as Record<dia.Cell.ID, dia.ElementView>;

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

  // Defer rendering for large graphs to improve initial render performance
  // Threshold: only defer if we have more than 100 elements or links
  // Always call useDeferredValue (hooks rules), but only use deferred value when threshold is met
  const deferredElementsStateRaw = useDeferredValue(elementsState);
  const deferredLinksStateRaw = useDeferredValue(linksState);
  const shouldDefer = elementsState.length > 100 || linksState.length > 100;
  const deferredElementsState = shouldDefer ? deferredElementsStateRaw : elementsState;
  const deferredLinksState = shouldDefer ? deferredLinksStateRaw : linksState;
  const reactId = useId();
  const id = props.id ?? `paper-${reactId}`;
  const { overWrite } = useContext(PaperConfigContext) ?? {};

  const paperElementViews = useGraphInternalStoreSelector(
    (snapshot) => snapshot.papers[id]?.paperElementViews ?? EMPTY_OBJECT
  );

  const paperLinkViews = useGraphInternalStoreSelector(
    (snapshot) => snapshot.papers[id]?.linkViews ?? EMPTY_OBJECT
  );

  // Check if all links have views (or if there are no links)
  // This prevents the blink where elements appear before links
  const areLinksReady = useMemo(() => {
    if (!renderLink) {
      return true; // No custom link rendering, so links are "ready"
    }
    if (deferredLinksState.length === 0) {
      return true; // No links, so links are "ready"
    }
    // Check if all links have views
    for (const link of deferredLinksState) {
      if (link.id && !paperLinkViews[link.id]) {
        return false; // At least one link doesn't have a view yet
      }
    }
    return true;
  }, [renderLink, deferredLinksState, paperLinkViews]);

  const { addPaper, graph, getPaperStore } = useGraphStore();

  const paperStore = getPaperStore(id) ?? null;
  const { paper, ReactElementView, ReactLinkView } = paperStore ?? {};
  const paperHTMLElement = useRef<HTMLDivElement | null>(null);
  const measured = useRef(false);
  const previousSizesRef = useRef<number[][]>([]);

  const [HTMLRendererContainer, setHTMLRendererContainer] = useState<HTMLElement | null>(null);

  const hasRenderElement = !!renderElement;
  const hasRenderLink = !!renderLink;

  useImperativeHandle(forwardedRef, () => paperStore as PaperStore, [paperStore]);

  const defaultLinkJointJS = useCallback(
    (cellView: dia.CellView, magnet: SVGElement) => {
      const link = typeof defaultLink === 'function' ? defaultLink(cellView, magnet) : defaultLink;
      if (!link) {
        return new shapes.standard.Link();
      }
      if (link instanceof dia.Link) {
        return link;
      }
      return new shapes.standard.Link(link as dia.Link.EndJSON);
    },
    [defaultLink]
  );

  const isReady = !!paper && !!paperHTMLElement.current;

  useLayoutEffect(() => {
    if (!paperHTMLElement.current) {
      return;
    }
    const remove = addPaper(id, {
      paperElement: paperHTMLElement.current,
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
    const { width: paperWidth, height: paperHeight } = paper.options;

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
    if (
      !shouldIgnoreWidthAndHeightUpdates &&
      width !== undefined &&
      height !== undefined &&
      (width !== paperWidth || height !== paperHeight)
    ) {
      paper.setDimensions(width, height);
    }
  }, [defaultLinkJointJS, height, paper, paperOptions, paperStore, scale, width]);

  useEffect(() => {
    if (!isReady) return;
    if (measured.current) return;
    if (!paper) return;
    if (areElementsMeasured) {
      measured.current = true;
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

  // Whenever elements change (or we’ve just become measured) compare old ↔ new
  useEffect(() => {
    if (!isReady) return;
    if (!onElementsSizeChange) return;
    if (!areElementsMeasured) return;
    if (!paper) return;

    // Build current list of [currWidth, currHeight] to avoid shadowing outer scope variables
    // Use elementsState (not deferred) for accurate size tracking
    const currentSizes = elementsState.map(
      ({ width: elementWidth = 0, height: elementHeight = 0 }) => [elementWidth, elementHeight]
    );
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
  }, [areElementsMeasured, elementsState, isReady, onElementsSizeChange, paper]);

  useLayoutEffect(() => {
    if (!paper) {
      return;
    }
    /**
     * Resize the paper container element to match the paper size.
     * @param jointPaper - The paper instance.
     */
    function resizePaperContainer(jointPaper: dia.Paper) {
      if (paperHTMLElement.current && jointPaper.el) {
        paperHTMLElement.current.style.width = jointPaper.el.style.width;
        paperHTMLElement.current.style.height = jointPaper.el.style.height;
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
    if (!ReactElementView) {
      return null;
    }

    if (!hasRenderElement) {
      return null;
    }
    return deferredElementsState.map((elementState) => {
      if (!elementState.id) {
        return null;
      }
      const elementView = paperElementViews[elementState.id];
      if (!elementView) {
        return null;
      }

      const SVG = elementView.el;
      if (!SVG) {
        return null;
      }

      const isReactElement = elementView instanceof ReactElementView;
      if (!isReactElement) {
        return null;
      }

      return (
        <CellIdContext.Provider key={elementState.id} value={elementState.id}>
          {useHTMLOverlay && HTMLRendererContainer ? (
            <HTMLElementItem
              {...elementState}
              portalElement={HTMLRendererContainer}
              renderElement={renderElement}
            />
          ) : (
            <SVGElementItem
              {...elementState}
              portalElement={SVG as SVGAElement}
              renderElement={renderElement}
            />
          )}
        </CellIdContext.Provider>
      );
    });
  }, [
    hasRenderElement,
    deferredElementsState,
    paperElementViews,
    ReactElementView,
    useHTMLOverlay,
    HTMLRendererContainer,
    renderElement,
  ]);

  const renderedLinks = useMemo(() => {
    if (!ReactLinkView) {
      return null;
    }

    if (!hasRenderLink) {
      return null;
    }
    return deferredLinksState.map((linkState) => {
      if (!linkState.id) {
        return null;
      }

      const linkView = paperLinkViews[linkState.id];
      if (!linkView) {
        return null;
      }

      const SVG = linkView.el;
      if (!SVG) {
        return null;
      }

      const isReactLink = linkView instanceof ReactLinkView;

      if (!isReactLink) {
        return null;
      }

      if (!renderLink) {
        return null;
      }

      return (
        <CellIdContext.Provider key={linkState.id} value={linkState.id}>
          <LinkItem link={linkState} portalElement={SVG as SVGAElement} renderLink={renderLink} />
        </CellIdContext.Provider>
      );
    });
  }, [hasRenderLink, deferredLinksState, paperLinkViews, ReactLinkView, renderLink]);

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

  // Only show paper when both elements are measured AND links are ready
  // This prevents the blink where elements appear before links
  const isContentReady = areElementsMeasured && areLinksReady;

  const paperContainerStyle = useMemo(
    (): CSSProperties => ({
      opacity: isContentReady ? 1 : 0,
      position: 'relative',
      ...defaultStyle,
    }),
    [isContentReady, defaultStyle]
  );

  return (
    <PaperStoreContext.Provider value={paperStore ?? null}>
      <div className={className} ref={paperHTMLElement} style={paperContainerStyle}>
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
