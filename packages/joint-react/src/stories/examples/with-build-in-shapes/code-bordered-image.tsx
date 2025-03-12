/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { createElements, GraphProvider, Paper } from '@joint/react';

const initialElements = createElements([
  {
    id: '1',
    x: 20,
    y: 25,
    width: 100,
    height: 50,
    type: 'standard.BorderedImage',
    attrs: {
      label: {
        text: 'Bordered Image',
      },
      border: {
        rx: 5,
      },
      image: {
        xlinkHref: 'https://picsum.photos/100/50',
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
