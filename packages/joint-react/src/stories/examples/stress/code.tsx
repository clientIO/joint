/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  Link,
  Paper,
  type GraphElement,
  type GraphLink,
  type RenderLink,
} from '@joint/react';
import '../index.css';
import React, { useCallback, useRef, useState, startTransition, memo } from 'react';
import { PAPER_CLASSNAME, PRIMARY, LIGHT, SECONDARY } from 'storybook-config/theme';
import { REACT_LINK_TYPE } from '../../../models/react-link';

function initialElements(xNodes = 15, yNodes = 30) {
  const nodes = [];
  const edges = [];
  let nodeId = 1;
  let edgeId = 1;
  let recentNodeId: number | null = null;

  for (let y = 0; y < yNodes; y++) {
    for (let x = 0; x < xNodes; x++) {
      const position = { x: x * 100, y: y * 50 };
      const data = { label: `Node ${nodeId}` };
      const node = {
        id: `stress-${nodeId.toString()}`,
        width: 50,
        height: 20,
        fontSize: 11,
        ...data,
        ...position,
      };
      nodes.push(node);

      if (recentNodeId !== null && nodeId <= xNodes * yNodes) {
        edges.push({
          id: `edge-${edgeId.toString()}`,
          type: REACT_LINK_TYPE,
          source: `stress-${recentNodeId.toString()}`,
          target: `stress-${nodeId.toString()}`,
          z: -1,
        });
        edgeId++;
      }

      recentNodeId = nodeId;
      nodeId++;
    }
  }

  return { nodes, edges };
}

const { nodes: initialNodes, edges: initialEdges } = initialElements(15, 30);

type BaseElementWithData = (typeof initialNodes)[number];

const RenderElement = memo(function RenderElement({
  width,
  height,
  label,
}: Readonly<BaseElementWithData>) {
  const elementRef = useRef<HTMLDivElement>(null);
  return (
    <foreignObject width={width} height={height}>
      <div
        ref={elementRef}
        className="flex flex-col items-center justify-center rounded-sm text-xs"
        style={{ background: PRIMARY, color: '#ffffff', fontSize: 11, width, height }}
      >
        {label}
      </div>
    </foreignObject>
  );
});

function Main({
  setElements,
}: Readonly<{
  setElements: React.Dispatch<React.SetStateAction<GraphElement[]>>;
}>) {
  // Memoize the renderElement function to prevent unnecessary re-renders
  const renderElement = useCallback(
    (element: BaseElementWithData) => <RenderElement {...element} />,
    []
  );

  const renderLink: RenderLink = useCallback(
    (link) => (
      <>
        <Link.Base stroke={LIGHT} strokeWidth={0.5} />
        <Link.Label position={{ distance: 0.5 }}>
          <foreignObject x={-20} y={-8} width={40} height={16}>
            <div
              className="flex items-center justify-center rounded text-xs"
              style={{
                background: SECONDARY,
                color: '#ffffff',
                fontSize: 9,
                width: 40,
                height: 16,
              }}
            >
              {link.id.toString().split('-')[1]}
            </div>
          </foreignObject>
        </Link.Label>
      </>
    ),
    []
  );

  const updatePos = useCallback(() => {
    // Use startTransition to mark this as a non-urgent update
    // This allows React to keep the UI responsive during the update
    startTransition(() => {
      setElements((previousElements) => {
        const newElements = previousElements.map((node) => ({
          ...node,
          x: Math.random() * 1500,
          y: Math.random() * 1500,
        }));

        return newElements;
      });
    });
  }, [setElements]);

  return (
    <div className="flex flex-row relative">
      <Paper
        id="main-view"
        width="100%"
        className={PAPER_CLASSNAME}
        height={600}
        renderElement={renderElement}
        renderLink={renderLink}
      />
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={updatePos}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          change pos
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [elements, setElements] = useState<GraphElement[]>(initialNodes);
  const [links, setLinks] = useState<GraphLink[]>(initialEdges);

  return (
    <GraphProvider
      elements={elements}
      links={links}
      onElementsChange={setElements}
      onLinksChange={setLinks}
    >
      <Main setElements={setElements} />
    </GraphProvider>
  );
}
