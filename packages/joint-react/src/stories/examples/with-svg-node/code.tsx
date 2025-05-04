/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { LIGHT, PRIMARY, TEXT } from 'storybook-config/theme';
import '../index.css';
import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  type InferElement,
  type RenderElement,
} from '@joint/react';
import { useCallback } from 'react';

const initialEdges = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: LIGHT,
      },
    },
  },
]);

const initialElements = createElements([
  { id: '1', label: 'Node 1', x: 100, y: 0 },
  { id: '2', label: 'Node 2', x: 100, y: 200 },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderedRect({ width, height, label }: BaseElementWithData) {
  const textMargin = 20;
  const cornerRadius = 5;
  return (
    <>
      <rect rx={cornerRadius} ry={cornerRadius} width={width} height={height} fill={PRIMARY} />
      <MeasuredNode
        setSize={({ element, size: { width, height } }) => {
          element.size(width + textMargin, height + textMargin);
        }}
      >
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={TEXT}
          fontSize={14}
          fontWeight="bold"
        >{label}</text>
      </MeasuredNode>
    </>
  );
}

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback((props) => <RenderedRect {...props}/>, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width={400} height={280} renderElement={renderElement} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      ></div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={initialElements} defaultLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
