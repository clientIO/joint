/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
import '../index.css';
import { createElements, GraphProvider, Paper } from '@joint/react';

const initialElements = createElements([
  {
    id: '1',
    x: 20,
    y: 25,
    width: 180,
    height: 75,
    type: 'standard.HeaderedRectangle',
    attrs: {
      body: {
        fill: PRIMARY,
      },
      bodyText: {
        text: 'Headered Rectangle',
      },
      header: {
        fill: SECONDARY,
      },
      headerText: {
        text: 'Header text',
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
    <GraphProvider elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
