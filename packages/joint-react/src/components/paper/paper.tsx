import { mvc, type dia } from '@joint/core';
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { GraphElement } from '../../types/element-types';
import { noopSelector } from '../../utils/noop-selector';
import { useElements } from '../../hooks/use-elements';
import { CellIdContext } from '../../context/cell-id.context';
import { HTMLElementItem, SVGElementItem } from './paper-element-item';
import { type GraphProps } from '../graph-provider/graph-provider';
import typedMemo from '../../utils/typed-memo';
import type { PaperEvents, PaperEventType } from '../../types/event.types';
import { REACT_TYPE } from '../../models/react-element';
import { useAreElementMeasured } from '../../hooks/use-are-elements-measured';
import { PaperHTMLContainer } from './paper-html-container';
import { useGraph } from '../../hooks';
import { PaperProvider, type ReactPaperOptions } from '../paper-provider/paper-provider';
import { PaperContext } from '../../context';
import { PaperCheck } from './paper-check';
import { handleEvent } from '../../utils/handle-paper-events';
export interface OnLoadOptions {
  readonly paper: dia.Paper;
  readonly graph: dia.Graph;
}
export type RenderElement<ElementItem extends GraphElement = GraphElement> = (
  element: ElementItem
) => ReactNode;

/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export interface PaperProps<ElementItem extends GraphElement = GraphElement>
  extends ReactPaperOptions,
    GraphProps,
    PaperEvents {
  /**
   * A function that renders the element.
   * 
   * Note: Jointjs works by default with SVG's so by default renderElement is append inside the SVGElement node.
   * To use HTML elements, you need to use the `HTMLNode` component or `foreignObject` element.
   * 
   * This is called when the data from `elementSelector` changes.
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
  readonly renderElement?: RenderElement<ElementItem>;
  /**
   * Event called when all elements are properly measured (has all elements width and height greater than 1 - default).
   * In react, we cannot detect jointjs paper render:done event properly, so we use this special event to check if all elements are measured.
   * It is useful for like onLoad event to do some layout or other operations with `graph` or `paper`.
   */
  readonly onElementsSizeReady?: (options: OnLoadOptions) => void;

  /**
   * Event called when the paper is resized.
   * It is useful for like onLoad event to do some layout or other operations with `graph` or `paper`.
   */
  readonly onElementsSizeChange?: (options: OnLoadOptions) => void;

  /**
   * The style of the paper element.
   */
  readonly style?: CSSProperties;
  /**
   * Class name of the paper element.
   */
  readonly className?: string;

  /**
   * A function that selects the elements to be rendered.
   * It defaults to the `GraphElement` elements because `dia.Element` is not a valid React element (it do not change reference after update).
   * @default (item: dia.Cell) => `BaseElement`
   * @see GraphElement
   */
  readonly elementSelector?: (item: GraphElement) => ElementItem;
  /**
   * The scale of the paper. It's useful to create for example a zoom feature or minimap Paper.
   */

  readonly scale?: number;
  /**
   * Children to render. Paper automatically wrap the children with the PaperContext, if there is no PaperContext in the parent tree.
   */
  readonly children?: ReactNode;

  /**
   * On load custom element.
   * If provided, it must return valid HTML or SVG element and it will be replaced with the default paper element.
   * So it overwrite default paper rendering.
   * It is used internally for example to render `PaperScroller` from [joint plus](https://www.jointjs.com/jointjs-plus) package.
   * @param paperContext - The paper context
   * @returns
   */
  readonly overwriteDefaultPaperElement?: (paperContext: PaperContext) => HTMLElement | SVGElement;

  /**
   * The threshold for click events in pixels.
   * If the mouse moves more than this distance, it will be considered a drag event.
   * @default 10
   */
  readonly clickThreshold?: number;

  /**
   * Enabled if renderElements is render to pure HTML elements.
   * By default, `joint/react` renderElements to SVG elements, so for using HTML elements without this prop, you need to use `foreignObject` element.
   * @default false
   */
  readonly useHTMLOverlay?: boolean;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function Component<ElementItem extends GraphElement = GraphElement>(
  props: Readonly<PaperProps<ElementItem>>
) {
  const {
    renderElement,
    style,
    className,
    elementSelector = noopSelector as (item: GraphElement) => ElementItem,
    scale,
    children,
    onElementsSizeReady,
    onElementsSizeChange,
    useHTMLOverlay,
    ...paperOptions
  } = props;

  const paperContext = useContext(PaperContext);
  if (!paperContext) {
    throw new Error('Paper must be used within a `PaperProvider` or `Paper` component');
  }
  const { recordOfSVGElements, paperHTMLElement } = paperContext;

  const graph = useGraph();
  const [HTMLRendererContainer, setHTMLRendererContainer] = useState<HTMLElement | null>(null);
  const elements = useElements((items) => items.map(elementSelector));
  const areElementsMeasured = useAreElementMeasured();
  // Keep previous sizes in a ref
  const previousSizesRef = useRef<number[][]>([]);

  // Whenever elements change (or we’ve just become measured) compare old ↔ new
  useEffect(() => {
    if (!paperContext) return;
    if (!onElementsSizeChange) return;
    if (!areElementsMeasured) return;
    const { paper } = paperContext;
    if (!paper) return;

    // Build current list of [width, height]
    const currentSizes = elements.map(({ width = 0, height = 0 }) => [width, height]);
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
  }, [elements, areElementsMeasured, onElementsSizeChange, paperContext]);

  const hasRenderElement = !!renderElement;

  const paperContainerStyle = useMemo(
    (): CSSProperties => ({
      opacity: areElementsMeasured ? 1 : 0,
      pointerEvents: areElementsMeasured ? 'all' : 'none',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      height: '100%',
      ...style,
    }),
    [areElementsMeasured, style]
  );

  const measured = useRef(false);

  useEffect(() => {
    if (!paperContext) {
      return;
    }
    if (measured.current) {
      // If we already measured, we can skip this effect
      return;
    }
    const { paper } = paperContext;
    if (!paper) {
      return;
    }
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
            'The elements are not measured yet, please check if elements has defined width and height inside the nodes or using `MeasuredNode` component.'
          );
        }
      }, 1000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [areElementsMeasured, graph, onElementsSizeReady, paperContext]);

  useLayoutEffect(() => {
    if (!paperContext) {
      return;
    }
    const { paper } = paperContext;
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
    controller.listenTo(paper, 'all', (type: PaperEventType, ...args: unknown[]) =>
      handleEvent(type, paperOptions, paper, ...args)
    );
    return () => {
      controller.stopListening();
    };
  }, [paperContainerStyle, paperContext, paperHTMLElement, paperOptions]);

  useLayoutEffect(() => {
    if (!paperContext) {
      return;
    }
    const { paper } = paperContext;
    if (!paper) {
      return;
    }
    if (scale !== undefined) {
      paper.scale(scale);
    }
  }, [paperContext, scale]);

  const content = (
    <>
      {hasRenderElement && useHTMLOverlay && (
        <PaperHTMLContainer onSetElement={setHTMLRendererContainer} />
      )}
      {hasRenderElement &&
        elements.map((cell) => {
          if (!cell.id) {
            return null;
          }
          const portalHTMLElement = recordOfSVGElements[cell.id];
          if (!portalHTMLElement) {
            return null;
          }
          if (cell.type !== REACT_TYPE) {
            return null;
          }

          return (
            <CellIdContext.Provider key={cell.id} value={cell.id}>
              {useHTMLOverlay && HTMLRendererContainer ? (
                <HTMLElementItem
                  {...cell}
                  portalElement={HTMLRendererContainer}
                  renderElement={renderElement}
                />
              ) : (
                <SVGElementItem
                  {...cell}
                  portalElement={portalHTMLElement}
                  renderElement={renderElement}
                />
              )}
            </CellIdContext.Provider>
          );
        })}
    </>
  );

  if (paperContext) {
    // we need this for shared paper context - joint plus
    paperContext.renderElement = renderElement as RenderElement<GraphElement>;
  }
  const hasPaper = !!paperContext?.paper;

  return (
    <>
      <div className={className} ref={paperHTMLElement} style={paperContainerStyle}>
        {hasPaper && content}
      </div>
      {hasPaper && children}
    </>
  );
}
// eslint-disable-next-line jsdoc/require-jsdoc
function PaperWithProviders<ElementItem extends GraphElement = GraphElement>(
  props: Readonly<PaperProps<ElementItem>>
) {
  const hasPaperCtx = !!useContext(PaperContext);
  const { children, ...rest } = props;
  const content = <Component {...rest}>{children}</Component>;
  if (hasPaperCtx) {
    const verifyProps = process.env.NODE_ENV !== 'production' && <PaperCheck {...rest} />;
    // If PaperContext is already provided, we don't need to wrap it again
    return (
      <>
        {verifyProps}
        {content}
      </>
    );
  }
  return <PaperProvider {...rest}>{content}</PaperProvider>;
}

/**
 * Paper component that renders the JointJS paper elements inside HTML.
 * It uses `renderElement` to render the elements.
 * It must be used within a `GraphProvider` context.
 * @see GraphProvider
 * @see PaperProps
 * 
 * Props also extends `dia.Paper.Options` interface.
 * @see dia.Paper.Options 
 * @group Components
 * @example
 * Example with `global renderElement component`:
 * ```tsx
 * import { createElements, InferElement, GraphProvider, Paper } from '@joint/react'
 *
 * const initialElements = createElements([ { id: '1', label: 'Node 1' , x: 100, y: 0, width: 100, height: 50 } ])
 * type BaseElementWithData = InferElement<typeof initialElements>
 *
 * function RenderElement({ label }: BaseElementWithData) {
 *  return <HTMLElement className="node">{label}</HTMLElement>
 * }
 * function MyApp() {
 *  return <GraphProvider initialElements={initialElements}>
 *    <Paper renderElement={RenderElement} />
 *  </GraphProvider>
 * }
 * ```
 * @example
 * Example with `local renderElement component`:
 * ```tsx
  const initialElements = createElements([
    { id: '1', label: 'Node 1', x: 100, y: 0, width: 100, height: 50 },
  ])
  type BaseElementWithData = InferElement<typeof initialElements>
 
  function MyApp() {
    const renderElement: RenderElement<BaseElementWithData> = useCallback(
      (element) => <HTMLElement className="node">{element.label}</HTMLElement>,
      []
    )
 
    return (
      <GraphProvider initialElements={initialElements}>
        <Paper renderElement={renderElement} />
      </GraphProvider>
    )
  }
 * ```
 */
export const Paper = typedMemo(PaperWithProviders);
