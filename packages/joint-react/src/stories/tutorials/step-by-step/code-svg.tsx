/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import {
  type CellRecord,
  GraphProvider,
  Paper,
  useCell,
  type RenderElement,
  selectElementSize,
} from '@joint/react';
import { useCallback } from 'react';

// define element data shape
type ElementData = { color: string };

// Unified cells array — elements and links live in the same stream, each with `id` + `type`.
const initialCells: ReadonlyArray<CellRecord<ElementData>> = [
  {
    id: '1',
    type: 'element',
    data: { color: PRIMARY },
    position: { x: 100, y: 15 },
    size: { width: 100, height: 25 },
  },
  {
    id: '2',
    type: 'element',
    data: { color: PRIMARY },
    position: { x: 100, y: 200 },
    size: { width: 100, height: 25 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY, width: 2 },
  },
];

function RenderItem({ color }: Readonly<ElementData>) {
  const { width, height } = useCell(selectElementSize);
  return <rect rx={10} ry={10} width={width} height={height} fill={color} />;
}

function Main() {
  const renderElement: RenderElement<ElementData> = useCallback(
    (data) => <RenderItem color={data?.color ?? PRIMARY} />,
    []
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={renderElement} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
