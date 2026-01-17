 
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';

import { createElements, createLinks, GraphProvider, Link, Paper, type RenderLink } from '@joint/react';
import { useCallback } from 'react';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';
import { REACT_LINK_TYPE } from '../../../models/react-link';

const initialElements = createElements([
  { id: '1', label: 'Node 1', x: 100, y: 0 },
  { id: '2', label: 'Node 2', x: 100, y: 200 },
  { id: '3', label: 'Node 3', x: 300, y: 100 },
]);

const initialLinks = createLinks([
  {
    id: 'link-1',
    type: REACT_LINK_TYPE,
    source: '1',
    target: '2',
  },
  {
    id: 'link-2',
    type: REACT_LINK_TYPE,
    source: '2',
    target: '3',
  },
]);

function Main() {
  const renderElement = useCallback(
    (element: { id: string; label: string }) => <HTMLNode className="node">{element.label}</HTMLNode>,
    []
  );

  const renderLink: RenderLink = useCallback(
    (link) => (
      <>
        <Link.Base
          stroke={PRIMARY}
          strokeWidth={2}
        />
        <Link.Label position={{ distance: 0.5 }}>
          <foreignObject width={60} height={20}>
            <div className="bg-blue-100 rounded px-2 py-1 text-xs text-center">
              Link {link.id}
            </div>
          </foreignObject>
        </Link.Label>
      </>
    ),
    []
  );

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
