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
    type: 'standard.EmbeddedImage',
    attrs: {
      body: {
        fill: 'lightblue',
      },
      image: {
        xlinkHref: 'https://picsum.photos/100/100',
        width: 100,
        height: 100,
      },
      label: {
        text: 'Embedded Image',
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
