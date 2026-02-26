/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { forwardRef, useCallback, useRef } from 'react';
import {
  GraphProvider,
  Paper,
  useNodeSize,
  type GraphElement,
  type GraphLink,
  type RenderElement,
  type OnTransformElement,
  ReactElement,
  ReactLink,
  usePaper,
  useCellId,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY, BG, TEXT, LIGHT } from 'storybook-config/theme';
import '../index.css';
import { dia, shapes } from '@joint/core';

const ROW_HEIGHT = 30;
const HEADER_HEIGHT = 32;
const ELEMENT_WIDTH = 160;
const HEADER_COLOR = '#f6c744';

interface StackedElement extends GraphElement {
  readonly name: string;
  readonly labels: readonly string[];
  readonly x: number;
  readonly y: number;
}

const initialElements: Record<string, StackedElement> = {
  '1': {
    name: 'Component A',
    labels: ['Header', 'Body', 'Footer'],
    x: 50,
    y: 50,
  },
  '2': {
    name: 'Component B',
    labels: ['Input', 'Process', 'Output'],
    x: 300,
    y: 50,
  },
};

const initialLinks: Record<string, GraphLink> = {
  'e1-2': {
    source: {id: '1', selector: 'item-2'},
    target: {id: '2', selector: 'item-2'},
    color: LIGHT,
  },
};

interface ItemProps {
  readonly label: string;
  readonly index: number;
  readonly width: number;
  readonly rowY: number;
}

const Item = forwardRef<SVGGElement, ItemProps>(function Item({ label, index, width, rowY }, ref) {
  return (
    <g ref={ref} magnet="active" className="item">
      {index > 0 && (
        <line x1={0} y1={rowY} x2={width} y2={rowY} stroke={PRIMARY} strokeOpacity={0.3} />
      )}
      <rect className="item__bg" x={0} y={rowY} width={width} height={ROW_HEIGHT} fill={BG} />
      <text
        x={width / 2}
        y={rowY + ROW_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={TEXT}
        fontSize={13}
        fontFamily="sans-serif"
      >
        {label}
      </text>
    </g>
  );
});

function useNodePointer() {
  const paper = usePaper();
  const id = useCellId();
  return useCallback((selector: string) => {
    return (node: SVGGElement | null) => {
      const elementView = paper.findViewByModel(id) as
        | (dia.ElementView & { selectors: Record<string, SVGElement> })
        | undefined;
      if (!elementView) return;
      if (node) {
        node.setAttribute('joint-selector', selector);
        elementView.selectors[selector] = node;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete elementView.selectors[selector];
      }
    };
  }, [paper, id]);
}

function StackedNode({ name, labels }: Readonly<Partial<StackedElement>>) {
  const contentRef = useRef<HTMLDivElement>(null);
  const rows = labels?.length ?? 0;
  const totalHeight = HEADER_HEIGHT + rows * ROW_HEIGHT;
  const nodePointer = useNodePointer();

  const transform: OnTransformElement = useCallback(() => {
    return {
      width: ELEMENT_WIDTH,
      height: totalHeight,
    };
  }, [totalHeight]);

  const { width, height } = useNodeSize(contentRef, { transform });

  return (
    <>
      <rect width={width} height={height} fill={BG} stroke={PRIMARY} strokeWidth={2} rx={4} ry={4} />
      {/* Header */}
      <g className="header">
        <rect width={width} height={HEADER_HEIGHT} fill={HEADER_COLOR} rx={4} ry={4} />
        <rect x={0} y={HEADER_HEIGHT - 4} width={width} height={4} fill={HEADER_COLOR} />
        <text
          x={width / 2}
          y={HEADER_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#1a1a1a"
          fontSize={14}
          fontFamily="sans-serif"
          fontWeight="bold"
        >
          {name}
        </text>
      </g>
      {/* Attribute rows */}
      {labels?.map((label, index) => {
        const rowY = HEADER_HEIGHT + index * ROW_HEIGHT;
        return (
          <Item
            key={label}
            ref={nodePointer(`item-${index}`)}
            label={label}
            index={index}
            width={width}
            rowY={rowY}
          />
        );
      })}
      {/* Border on top for clean rounded corners */}
      <rect width={width} height={height} fill="none" stroke={PRIMARY} strokeWidth={2} rx={4} ry={4} />
      <foreignObject width={1} height={1} opacity={0}>
        <div ref={contentRef} style={{ width: ELEMENT_WIDTH, height: totalHeight }} />
      </foreignObject>
    </>
  );
}

function Main() {
  const renderElement: RenderElement<StackedElement> = useCallback((data) => {
    return <StackedNode name={data.name} labels={data.labels} />;
  }, []);

  return (
    <Paper
      width="100%"
      className={PAPER_CLASSNAME}
      height={250}
      renderElement={renderElement}
      magnetThreshold={'onleave'}
      linkPinning={false}
      defaultConnectionPoint={{ name: 'rectangle', args: { padding: 6 } }}
      defaultAnchor={{
        name: 'midSide',
        args: {
          mode: 'horizontal',
        }
      }}
      highlighting={{
        connecting: {
          name: 'stroke',
          options: {
            padding: 0,
            attrs: {
              stroke: LIGHT,
              strokeWidth: 3,
            }
          }
        }
      }}
      validateConnection={(sourceView, _sourceMagnet, targetView) =>
        sourceView.model.id !== targetView.model.id
      }
    />
  );
}

class MyReactElement extends ReactElement {

  defaults() {
    return {
      ...super.defaults(),
      attrs: {
        root: {
          magnet: false,
        }
      }
    };
  }

  // useCSSSelectors: boolean = true;
}

export default function App() {
  const graph = new dia.Graph({}, {
    cellNamespace: {
      ...shapes,
      ReactElement: MyReactElement,
      ReactLink
    }
  });
  return (
    <GraphProvider elements={initialElements} links={initialLinks} graph={graph}>
      <Main />
    </GraphProvider>
  );
}
