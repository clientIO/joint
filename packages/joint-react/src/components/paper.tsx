import { type dia } from '@joint/core';
import { useCallback, use, useState, type CSSProperties, type ReactNode } from 'react';
import { useCreatePaper } from '../hooks/use-create-paper';
import { PaperItem } from './paper-item';
import { useElements } from '../hooks/use-elements';
import typedMemo from '../utils/typed-memo';
import { PaperContext } from '../context/paper-context';
import { GraphStoreContext } from '../context/graph-store-context';
import { GraphProvider } from './graph-provider';
import { CellIdContext } from '../context/cell-context';
import { noopSelector } from '../utils/noop-selector';
import type { GraphElement, GraphElementBase } from '../data/graph-elements';

export type RenderElement<ElementItem extends GraphElementBase = GraphElementBase> = (
  element: ElementItem
) => ReactNode;
/**
 * The props for the Paper component. Extend the `dia.Paper.Options` interface.
 * For more information, see the JointJS documentation.
 * @see https://docs.jointjs.com/api/dia/Paper
 */
export interface PaperProps<ElementItem extends GraphElementBase = GraphElementBase>
  extends dia.Paper.Options {
  /**
   * A function that renders the element. It is called every time the element is rendered.
   * @default (element: ElementItem) => BaseElement
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
   * It defaults to the `defaultElementSelector` function which return `BaseElement` because dia.Element is not a valid React element (it do not change reference after update).
   * @default (item: dia.Cell) => `BaseElement`
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
   * Function that is called when an event is triggered on the paper.
   * @param paper
   * @param eventName
   * @param args
   * @returns
   */
  readonly onEvent?: (paper: dia.Paper, eventName: string, ...args: unknown[]) => void;

  /**
   * Function that is called when the paper is resized.
   */
  readonly isFitContentOnLoadEnabled?: boolean;
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

  const [svgGElements, setSvgGElements] = useState<Record<dia.Cell.ID, SVGGElement>>({});

  const onRenderElement = useCallback(
    (element: dia.Element, nodeSvgGElement: SVGGElement) => {
      onReady?.();
      setSvgGElements((previousState) => {
        return {
          ...previousState,
          [element.id]: nodeSvgGElement,
        };
      });
    },
    [onReady]
  );

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
          const portalHtmlElement = svgGElements[cell.id];
          if (!portalHtmlElement) {
            return null;
          }
          return (
            <CellIdContext key={cell.id} value={cell.id}>
              <PaperItem
                {...cell}
                nodeSvgGElement={portalHtmlElement}
                renderElement={renderElement}
              />
            </CellIdContext>
          );
        })}
    </div>
  );

  if (isPaperFromContext) {
    return content;
  }

  return (
    <PaperContext value={paper}>
      {content}
      {children}
    </PaperContext>
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
  const hasStore = !!use(GraphStoreContext);
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
 * Paper component that renders the JointJS paper element.
 * It must be used within a `GraphProvider` context.
 * @see GraphProvider
 * @see PaperProps
 * @group Components
 *
 * @example
 * Example with `global item component`:
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
 * Example with `local item component`:
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
