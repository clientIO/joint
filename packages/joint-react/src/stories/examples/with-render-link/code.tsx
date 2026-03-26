/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { LIGHT, PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';

import { GraphProvider, Paper, type FlatElementData, type FlatLinkData, type RenderLink, useElementId, useLinkLayout } from '@joint/react';
import { useCallback, useState } from 'react';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';
import { PORTAL_LINK_TYPE } from '../../../models/portal-link';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialElements: Record<string, FlatElementData<NodeData>> = {
  '1': { data: { label: 'Node 1' }, x: 100, y: 15 },
  '2': { data: { label: 'Node 2' }, x: 100, y: 200 },
  '3': { data: { label: 'Node 3' }, x: 300, y: 100 },
};

const initialLinks: Record<string, FlatLinkData & { type: string }> = {
  'link-1': {
    type: PORTAL_LINK_TYPE,
    source: '1',
    target: '2',
  },
  'link-2': {
    type: PORTAL_LINK_TYPE,
    source: '2',
    target: '3',
  },
};

function LinkPath() {
  const layout = useLinkLayout();
  const id = useElementId();

  // Calculate midpoint for label
  const midX = (layout.sourceX + layout.targetX) / 2;
  const midY = (layout.sourceY + layout.targetY) / 2;

  return (
    <>
      <path
        d={layout.d}
        stroke={LIGHT}
        opacity={0.05}
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

function Main({ usePortalLinks }: Readonly<{ usePortalLinks: boolean }>) {
  const renderElement = useCallback(
    (element: NodeData) => <HTMLNode className="node">{element.label}</HTMLNode>,
    []
  );

  const renderLink: RenderLink = useCallback(() => <LinkPath />, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={renderElement}
        renderLink={usePortalLinks ? renderLink : undefined}
      />
    </div>
  );
}

export default function App() {
  const [usePortalLinks, setUsePortalLinks] = useState(true);

  return (
    <GraphProvider elements={initialElements} links={initialLinks}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setUsePortalLinks((v) => !v)}
          className="px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 self-start mx-2"
        >
          {usePortalLinks ? 'Disable' : 'Enable'} renderLink
        </button>
        <Main usePortalLinks={usePortalLinks} />
      </div>
    </GraphProvider>
  );
}
