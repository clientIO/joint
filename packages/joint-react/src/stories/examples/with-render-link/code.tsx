/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';

import { GraphProvider, Paper, type RenderLink, useCellId, useLinkLayout } from '@joint/react';
import { useCallback } from 'react';
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

  if (!layout) {
    return null;
  }

  // Calculate midpoint for label
  const midX = (layout.sourceX + layout.targetX) / 2;
  const midY = (layout.sourceY + layout.targetY) / 2;

  return (
    <g>
      <path d={layout.d} stroke={PRIMARY} strokeWidth={2} fill="none" />
      <foreignObject x={midX - 30} y={midY - 10} width={60} height={20}>
        <div className="bg-blue-100 rounded px-2 py-1 text-xs text-center">Link {id}</div>
      </foreignObject>
    </g>
  );
}

function Main() {
  const renderElement = useCallback(
    (element: { label: string }) => <HTMLNode className="node">{element.label}</HTMLNode>,
    []
  );

  const renderLink: RenderLink = useCallback(() => <LinkPath />, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        width="100%"
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={renderElement}
        renderLink={renderLink}
      />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialLinks}>
      <Main />
    </GraphProvider>
  );
}
