/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';
import { createElements, createLinks, GraphProvider, Paper } from '@joint/react';

const initialElements = createElements([
  {
    id: '1',
    x: 20,
    y: 25,
    width: 100,
    height: 50,
    type: 'standard.Rectangle',
    attrs: {
      body: {
        fill: PRIMARY,
      },
      label: {
        text: 'Rectangle1',
        fill: 'white',
      },
    },
  },
  {
    id: '2',
    x: 20,
    y: 120,
    width: 100,
    height: 50,
    type: 'standard.Rectangle',
    attrs: {
      body: {
        fill: PRIMARY,
      },
      label: {
        text: 'Rectangle2',
        fill: 'white',
      },
    },
  },
]);
const initialEdges = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'standard.Link',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width="100%" className={PAPER_CLASSNAME} height={250} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
