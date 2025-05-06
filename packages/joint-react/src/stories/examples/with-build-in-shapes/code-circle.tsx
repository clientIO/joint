/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';
import { createElements, GraphProvider, Paper } from '@joint/react';

const initialElements = createElements([
  {
    id: '1',
    x: 20,
    y: 25,
    width: 50,
    height: 50,
    type: 'standard.Circle',
    attrs: {
      label: {
        text: 'Circle',
      },
      body: {
        fill: PRIMARY,
      },
    },
  },
]);

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width="100%" className={PAPER_CLASSNAME} height={100} />
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
