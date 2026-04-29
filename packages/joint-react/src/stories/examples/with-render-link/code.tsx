/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';

import {
  type CellRecord,
  GraphProvider,
  Paper,
  useCellId,
  useLinkLayout,
  type RenderLink,
} from '@joint/react';
import { useCallback, useState } from 'react';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: '1', type: 'element', data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  { id: '2', type: 'element', data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  { id: '3', type: 'element', data: { label: 'Node 3' }, position: { x: 300, y: 100 } },
  {
    id: 'link-1',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
  },
  {
    id: 'link-2',
    type: 'link',
    source: { id: '2' },
    target: { id: '3' },
  },
];

function LinkPath() {
  // Link geometry is paper-scoped (the same link can render on multiple
  // papers with different routing) so it lives on a dedicated hook, not on
  // the LinkRecord. `useLinkLayout()` reads it from the surrounding paper
  // context and re-reads whenever JointJS finishes a render pass.
  const id = useCellId();
  const layout = useLinkLayout();

  if (!layout) return null;

  // Calculate midpoint for label
  const midX = (layout.sourceX + layout.targetX) / 2;
  const midY = (layout.sourceY + layout.targetY) / 2;

  return (
    <>
      <path
        d={layout.d}
        stroke={'red'}
        opacity={0.2}
        strokeWidth={20}
        fill="none"
        strokeLinecap="round"
      />
      <foreignObject x={midX - 30} y={midY - 10} width={60} height={40}>
        <div
          className="bg-blue-100 rounded px-2 py-1 text-xs text-center"
          style={{ color: PRIMARY }}
        >
          Link {id}
        </div>
      </foreignObject>
    </>
  );
}

function Main({ useLinkModels }: Readonly<{ useLinkModels: boolean }>) {
  const renderLink: RenderLink = useCallback(() => <LinkPath />, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        className={PAPER_CLASSNAME}
        height={280}
        renderLink={useLinkModels ? renderLink : undefined}
      />
    </div>
  );
}

export default function App() {
  const [useLinkModels, setUseLinkModels] = useState(true);

  return (
    <GraphProvider initialCells={initialCells}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setUseLinkModels((v) => !v)}
          className="px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 self-start mx-2"
        >
          {useLinkModels ? 'Disable' : 'Enable'} renderLink
        </button>
        <Main useLinkModels={useLinkModels} />
      </div>
    </GraphProvider>
  );
}
