/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { createElements, GraphProvider, Paper } from '@joint/react';

const initialElements = createElements([
  {
    id: '1',
    x: 20,
    y: 25,
    width: 50,
    height: 50,
    type: 'standard.HeaderedRectangle',
    attrs: {
      body: {
        fill: 'lightblue',
      },
      bodyText: {
        text: 'Headered Rectangle',
      },
      header: {
        fill: 'cyan',
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
      <Paper width={400} height={100} />
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
