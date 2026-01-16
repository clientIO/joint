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
  type CSSProperties,
} from 'react';
import { useElements } from '../../hooks';
import type { GraphElement } from '../../types/element-types';
import type { PaperProps, RenderElement } from './paper.types';
import { assignOptions, dependencyExtract } from '../../utils/object-utilities';
import { PaperHTMLContainer } from './render-element/paper-html-container';
import { CellIdContext, PaperConfigContext, PaperStoreContext } from '../../context';
import { HTMLElementItem, SVGElementItem } from './render-element/paper-element-item';
import { handlePaperEvents, PAPER_EVENT_KEYS } from '../../utils/handle-paper-events';
import type { PaperStore } from '../../store';
import {
  useAreElementsMeasured,
  useGraphInternalStoreSelector,
} from '../../hooks/use-graph-store-selector';

const EMPTY_OBJECT = {} as Record<dia.Cell.ID, dia.ElementView>;

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
  useDebugValue(elementsState);
  const reactId = useId();
  const id = props.id ?? `paper-${reactId}`;
  const { overWrite } = useContext(PaperConfigContext) ?? {};

  const paperElementViews = useGraphInternalStoreSelector(
    (snapshot) => snapshot.papers[id]?.paperElementViews ?? EMPTY_OBJECT
  );

  const { addPaper, graph, getPaperStore } = useGraphStore();

  const paperStore = getPaperStore(id) ?? null;
  const { paper, ReactElementView } = paperStore ?? {};
  const paperHTMLElement = useRef<HTMLDivElement | null>(null);
  const measured = useRef(false);
  const previousSizesRef = useRef<number[][]>([]);

  const [HTMLRendererContainer, setHTMLRendererContainer] = useState<HTMLElement | null>(null);

  const hasRenderElement = !!renderElement;

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
    return elementsState.map((elementState) => {
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
    elementsState,
    paperElementViews,
    ReactElementView,
    useHTMLOverlay,
    HTMLRendererContainer,
    renderElement,
  ]);

  const content = (
    <>
      {hasRenderElement && useHTMLOverlay && (
        <PaperHTMLContainer onSetElement={setHTMLRendererContainer} />
      )}
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
      opacity: areElementsMeasured ? 1 : 0,
      position: 'relative',
      ...defaultStyle,
    }),
    [areElementsMeasured, defaultStyle]
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
