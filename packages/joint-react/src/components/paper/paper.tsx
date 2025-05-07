import { type dia } from '@joint/core';
import { useContext, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import type { GraphElement, GraphElementWithAttributes } from '../../types/element-types';
import { noopSelector } from '../../utils/noop-selector';
import { useCreatePaper } from '../../hooks/use-create-paper';
import { useElements } from '../../hooks/use-elements';
import { CellIdContext } from '../../context/cell-id.context';
import { HTMLRenderer, SvgRenderer } from './paper-renderer';
import { PaperContext } from '../../context/paper-context';
import { GraphStoreContext } from '../../context/graph-store-context';
import { GraphProvider } from '../graph-provider/graph-provider';
import typedMemo from '../../utils/typed-memo';
import type { PaperEvents } from '../../types/event.types';
import { usePaperElementRenderer } from '../../hooks/use-paper-element-renderer';
import { REACT_TYPE } from '../../models/react-element';
import { useAreElementMeasured } from '../../hooks/use-are-elements-measured';
import { PaperHtmlRendererContainer } from './paper-html-renderer';
export interface OnLoadOptions {
  readonly paper: dia.Paper;
  readonly graph: dia.Graph;
}
export type RenderElement<
  ElementItem extends GraphElementWithAttributes = GraphElementWithAttributes,
> = (element: ElementItem) => ReactNode;
/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export interface PaperProps<
  ElementItem extends GraphElementWithAttributes = GraphElementWithAttributes,
> extends dia.Paper.Options,
    PaperEvents {
  /**
   * A function that renders the element.
   * 
   * Note: Jointjs works by default with SVG's so by default renderElement is append inside the SVGElement node.
   * To use HTML elements, you need to use the `HtmlNode` component or `foreignObject` element.
   * 
   * This is called when the data from `elementSelector` changes.
   * @example
   * Example with `global component`:
   * ```tsx
   * type BaseElementWithData = InferElement<typeof initialElements>
   * function RenderElement({ label }: BaseElementWithData) {
   *  return <HtmlElement className="node">{label}</HtmlElement>
   * }
   * ```
   * @example
   * Example with `local component`:
   * ```tsx
   * 
  type BaseElementWithData = InferElement<typeof initialElements>
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
      (element) => <HtmlElement className="node">{element.label}</HtmlElement>,
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
   * @see GraphElementWithAttributes<Data>
   */
  readonly elementSelector?: (item: GraphElementWithAttributes) => ElementItem;
  /**
   * The scale of the paper. It's useful to create for example a zoom feature or minimap Paper.
   */

  readonly scale?: number;
  /**
   * Placeholder to be rendered when there is no data (no nodes or elements to render).
   */
  readonly noDataPlaceholder?: ReactNode;

  /**
   * Children to render. Paper automatically wrap the children with the PaperContext, if there is no PaperContext in the parent tree.
   */
  readonly children?: ReactNode;

  /**
   * On load custom element.
   * If provided, it must return valid HTML or SVG element and it will be replaced with the default paper element.
   * So it overwrite default paper rendering.
   * It is used internally for example to render `PaperScroller` from [joint plus](https://www.jointjs.com/jointjs-plus) package.
   * @param paper - The paper instance
   * @returns
   */
  readonly overwriteDefaultPaperElement?: (paper: dia.Paper) => HTMLElement | SVGElement;

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
  readonly isHTMLRendererEnabled?: boolean;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function Component<ElementItem extends GraphElementWithAttributes = GraphElementWithAttributes>(
  props: PaperProps<ElementItem>
) {
  const {
    renderElement,
    style,
    className,
    elementSelector = noopSelector as (item: GraphElementWithAttributes) => ElementItem,
    scale,
    children,
    onElementsSizeReady,
    onElementsSizeChange,
    isHTMLRendererEnabled,
    ...paperOptions
  } = props;
  const { onRenderElement, svgGElements } = usePaperElementRenderer();
  const { paperContainerElement, paper } = useCreatePaper({
    ...paperOptions,
    scale,
    onRenderElement,
  });

  const HTMLRendererContainer = useRef<HTMLDivElement>(null);

  const elements = useElements((items) => items.map(elementSelector));
  const areElementsMeasured = useAreElementMeasured();

  // Keep previous sizes in a ref
  const previousSizesRef = useRef<number[][]>([]);

  // Whenever elements change (or we’ve just become measured) compare old ↔ new
  useEffect(() => {
    if (!paper) return;
    if (!onElementsSizeChange) return;
    if (!areElementsMeasured) return;

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
  }, [elements, areElementsMeasured, onElementsSizeChange, paper]);
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

  useEffect(() => {
    if (!paper) {
      return;
    }
    if (areElementsMeasured) {
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
  }, [areElementsMeasured, onElementsSizeReady, paper]);

  const content = (
    <>
      {hasRenderElement &&
        elements.map((cell) => {
          if (!cell.id) {
            return null;
          }
          const portalHtmlElement = svgGElements[cell.id];
          if (!portalHtmlElement) {
            return null;
          }
          if (cell.type !== REACT_TYPE) {
            return null;
          }

          return (
            <CellIdContext.Provider key={cell.id} value={cell.id}>
              {isHTMLRendererEnabled ? (
                <HTMLRenderer
                  {...cell}
                  rendererElement={HTMLRendererContainer.current}
                  renderElement={renderElement}
                />
              ) : (
                <SvgRenderer
                  {...cell}
                  rendererElement={portalHtmlElement}
                  renderElement={renderElement}
                />
              )}
            </CellIdContext.Provider>
          );
        })}
      {hasRenderElement && isHTMLRendererEnabled && (
        <PaperHtmlRendererContainer ref={HTMLRendererContainer} />
      )}
    </>
  );

  const paperContext: PaperContext | null = paper as PaperContext | null;
  if (paperContext) {
    paperContext.renderElement = renderElement as RenderElement<GraphElement>;
  }
  const hasPaper = !!paper;
  return (
    <PaperContext.Provider value={paperContext}>
      <div className={className} ref={paperContainerElement} style={paperContainerStyle}>
        {hasPaper && content}
      </div>
      {hasPaper && children}
    </PaperContext.Provider>
  );
}

// eslint-disable-next-line jsdoc/require-jsdoc
function PaperWithNoDataPlaceHolder<
  ElementItem extends GraphElementWithAttributes = GraphElementWithAttributes,
>(props: PaperProps<ElementItem>) {
  const { style, className, noDataPlaceholder, ...rest } = props;

  const hasNoDataPlaceholder = !!noDataPlaceholder;
  const elementsLength = useElements((items) => items.size);
  const isEmpty = elementsLength === 0;

  if (isEmpty && hasNoDataPlaceholder) {
    return (
      <div style={style} className={className}>
        {noDataPlaceholder}
      </div>
    );
  }

  return <Component {...rest} style={style} className={className} />;
}

// eslint-disable-next-line jsdoc/require-jsdoc
function PaperWithGraphProvider<
  ElementItem extends GraphElementWithAttributes = GraphElementWithAttributes,
>(props: PaperProps<ElementItem>) {
  const hasStore = !!useContext(GraphStoreContext);
  const { children, ...rest } = props;
  const paperContent = (
    <PaperWithNoDataPlaceHolder {...rest}>{children}</PaperWithNoDataPlaceHolder>
  );

  if (hasStore) {
    return paperContent;
  }
  return <GraphProvider>{paperContent}</GraphProvider>;
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
 *  return <HtmlElement className="node">{label}</HtmlElement>
 * }
 * function MyApp() {
 *  return <GraphProvider defaultElements={initialElements}>
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
      (element) => <HtmlElement className="node">{element.label}</HtmlElement>,
      []
    )
 
    return (
      <GraphProvider defaultElements={initialElements}>
        <Paper renderElement={renderElement} />
      </GraphProvider>
    )
  }
 * ```
 */
export const Paper = typedMemo(PaperWithGraphProvider);
