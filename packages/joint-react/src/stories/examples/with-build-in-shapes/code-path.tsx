/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { createElements, GraphProvider, Paper } from '@joint/react';

const initialElements = createElements([
  {
    id: '1',
    x: 20,
    y: 25,
    width: 100,
    height: 100,
    type: 'standard.Path',
    attrs: {
      body: {
        d: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
        fill: 'lightblue',
      },
      label: {
        text: 'Path',
      },
    },
  },
]);

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} height={150} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
