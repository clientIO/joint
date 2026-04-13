/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';

import {
  GraphProvider,
  Paper,
  type ElementRecord,
  type LinkRecord,
  type RenderLink,
  useElementId,
  useLink,
} from '@joint/react';
import { useCallback, useState } from 'react';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialElements: Record<string, ElementRecord<NodeData>> = {
  '1': { data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  '2': { data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  '3': { data: { label: 'Node 3' }, position: { x: 300, y: 100 } },
};

const initialLinks: Record<string, LinkRecord> = {
  'link-1': {
    source: { id: '1' },
    target: { id: '2' },
  },
  'link-2': {
    source: { id: '2' },
    target: { id: '3' },
  },
};

function LinkPath() {
  const { layout } = useLink();
  const id = useElementId();

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
    <GraphProvider elements={initialElements} links={initialLinks}>
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
