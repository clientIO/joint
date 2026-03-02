/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { LIGHT, PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';

import {
  GraphProvider,
  Paper,
  type RenderLink,
  useCellId,
  useLinkLayout,
} from '@joint/react';
import { useCallback, useState } from 'react';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';
import { REACT_LINK_TYPE } from '../../../models/react-link';

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { label: 'Node 1', x: 100, y: 0 },
  '2': { label: 'Node 2', x: 100, y: 200 },
  '3': { label: 'Node 3', x: 300, y: 100 },
};

const initialLinks: Record<string, { type: string; source: string; target: string }> = {
  'link-1': {
    type: REACT_LINK_TYPE,
    source: '1',
    target: '2',
  },
  'link-2': {
    type: REACT_LINK_TYPE,
    source: '2',
    target: '3',
  },
};

function LinkPath() {
  const layout = useLinkLayout();
  const id = useCellId();

  // Calculate midpoint for label
  const midX = (layout.sourceX + layout.targetX) / 2;
  const midY = (layout.sourceY + layout.targetY) / 2;

  return (
    <>
      <path d={layout.d} stroke={LIGHT} opacity={0.05} strokeWidth={20} fill="none" strokeLinecap="round" />
      <foreignObject x={midX - 30} y={midY - 10} width={60} height={40}>
        <div className="bg-blue-100 rounded px-2 py-1 text-xs text-center" style={{ color: PRIMARY }}>Link {id}</div>
      </foreignObject>
    </>
  );
}

function Main({ useReactLinks }: Readonly<{ useReactLinks: boolean }>) {
  const renderElement = useCallback(
    (element: { label: string }) => <HTMLNode className="node">{element.label}</HTMLNode>,
    []
  );

  const renderLink: RenderLink = useCallback(() => <LinkPath />, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={renderElement}
        renderLink={useReactLinks ? renderLink : undefined}
      />
    </div>
  );
}

export default function App() {
  const [useReactLinks, setUseReactLinks] = useState(true);

  return (
    <GraphProvider elements={initialElements} links={initialLinks}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setUseReactLinks((v) => !v)}
          className="px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 self-start mx-2"
        >
          {useReactLinks ? 'Disable' : 'Enable'} renderLink
        </button>
        <Main useReactLinks={useReactLinks} />
      </div>
    </GraphProvider>
  );
}
