import type { dia } from '@joint/core';
import { useContext, type CSSProperties, type ReactNode } from 'react';
import type { GraphElement, GraphElementBase } from '../../types/element-types';
import { noopSelector } from '../../utils/noop-selector';
import { useCreatePaper } from '../../hooks/use-create-paper';
import { useElements } from '../../hooks/use-elements';
import { CellIdContext } from '../../context/cell-id.context';
import { PaperItem } from './paper-item';
import { PaperContext } from '../../context/paper-context';
import { GraphStoreContext } from '../../context/graph-store-context';
import { GraphProvider } from '../graph-provider/graph-provider';
import typedMemo from '../../utils/typed-memo';
import type { PaperEvents } from '../../types/event.types';
import { usePaperElementRenderer } from '../../hooks/use-paper-element-renderer';
import { REACT_TYPE } from '../../models/react-element';

export type RenderElement<ElementItem extends GraphElementBase = GraphElementBase> = (
  element: ElementItem
) => ReactNode;
/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export interface PaperProps<ElementItem extends GraphElementBase = GraphElementBase>
  extends dia.Paper.Options,
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
 * function RenderElement({ data }: BaseElementWithData) {
 *  return <HtmlElement className="node">{data.label}</HtmlElement>
 * }
 * ```
 *
 * @example
 * Example with `local component`:
 * ```tsx
 * 
  type BaseElementWithData = InferElement<typeof initialElements>
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
      (element) => <HtmlElement className="node">{element.data.label}</HtmlElement>,
      []
  )
  * ```
  */
  readonly renderElement?: RenderElement<ElementItem>;
  /**
   * A function that is called when the paper is ready.
   */
  readonly onReady?: () => void;

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
   * @see GraphElement<Data>
   */
  readonly elementSelector?: (item: GraphElement) => ElementItem;
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
   * Function that is called when the paper is resized.
   */
  readonly isTransformToFitContentEnabled?: boolean;

  /**
   * On load custom element.
   * If provided, it must return valid HTML or SVG element and it will be replaced with the default paper element.
   * So it overwrite default paper rendering.
   * It is used internally for example to render `PaperScroller` from [joint plus](https://www.jointjs.com/jointjs-plus) package.
   * @param paper - The paper instance
   * @returns
   */
  readonly overwriteDefaultPaperElement?: (paper: dia.Paper) => HTMLElement | SVGElement;
}

/**
 * Paper component that renders the JointJS paper element.
 */
function Component<ElementItem extends GraphElementBase = GraphElementBase>(
  props: PaperProps<ElementItem>
) {
  const {
    renderElement,
    onReady,
    style,
    className,
    elementSelector = noopSelector as (item: GraphElement) => ElementItem,
    scale,
    children,
    ...paperOptions
  } = props;

  const { onRenderElement, svgGElements } = usePaperElementRenderer(onReady);

  const { paperHtmlElement, isPaperFromContext, paper } = useCreatePaper({
    ...paperOptions,
    scale,
    onRenderElement,
  });

  const elements = useElements((items) => items.map(elementSelector));

  const hasRenderElement = !!renderElement;

  const content = (
    <div className={className} ref={paperHtmlElement} style={style}>
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
              <PaperItem
                {...cell}
                nodeSvgGElement={portalHtmlElement}
                renderElement={renderElement}
              />
            </CellIdContext.Provider>
          );
        })}
    </div>
  );

  if (isPaperFromContext) {
    return content;
  }

  const paperContext: PaperContext = paper as PaperContext;
  paperContext.renderElement = renderElement as RenderElement<GraphElementBase>;
  return (
    <PaperContext.Provider value={paperContext}>
      {content}
      {children}
    </PaperContext.Provider>
  );
}

function PaperWithNoDataPlaceHolder<ElementItem extends GraphElementBase = GraphElementBase>(
  props: PaperProps<ElementItem>
) {
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

function PaperWithGraphProvider<ElementItem extends GraphElementBase = GraphElementBase>(
  props: PaperProps<ElementItem>
) {
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
 *
 * @example
 * Example with `global renderElement component`:
 * ```tsx
 * import { createElements, InferElement, GraphProvider, Paper } from '@joint/react'
 *
 * const initialElements = createElements([ { id: '1', data: { label: 'Node 1' }, x: 100, y: 0, width: 100, height: 50 } ])
 * type BaseElementWithData = InferElement<typeof initialElements>
 *
 * function RenderElement({ data }: BaseElementWithData) {
 *  return <HtmlElement className="node">{data.label}</HtmlElement>
 * }
 * function MyApp() {
 *  return <GraphProvider defaultElements={initialElements}>
 *    <Paper renderElement={RenderElement} />
 *  </GraphProvider>
 * }
 * ```
 *
 * @example
 * Example with `local renderElement component`:
 * ```tsx
  const initialElements = createElements([
    { id: '1', data: { label: 'Node 1' }, x: 100, y: 0, width: 100, height: 50 },
  ])
  type BaseElementWithData = InferElement<typeof initialElements>

  function MyApp() {
    const renderElement: RenderElement<BaseElementWithData> = useCallback(
      (element) => <HtmlElement className="node">{element.data.label}</HtmlElement>,
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
