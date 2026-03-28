/* eslint-disable sonarjs/pseudo-random */
import { GraphProvider, Paper, type Element, type Link } from '@joint/react';
import '../index.css';
import React, { useCallback, useState, startTransition } from 'react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

interface StressNodeData {
  readonly label: string;
  readonly fontSize: number;
}

function initialElements(xNodes = 15, yNodes = 30) {
  const nodes: Record<string, Element<StressNodeData>> = {};
  const edges: Record<string, Link> = {};
  let nodeId = 1;
  let edgeId = 1;
  let recentNodeId: number | null = null;

  for (let y = 0; y < yNodes; y++) {
    for (let x = 0; x < xNodes; x++) {
      const id = `stress-${nodeId.toString()}`;
      nodes[id] = {
        data: { label: `Node ${nodeId}`, fontSize: 11, className: 'text-xs' },
        position: { x: x * 100, y: y * 50 },
      };

      if (recentNodeId !== null && nodeId <= xNodes * yNodes) {
        const edgeIdString = `edge-${edgeId.toString()}`;
        edges[edgeIdString] = {
          source: `stress-${recentNodeId.toString()}`,
          target: `stress-${nodeId.toString()}`,
          z: -1,
          color: '#999999',
          dasharray: '5 2',
          width: 1,
        };
        edgeId++;
      }

      recentNodeId = nodeId;
      nodeId++;
    }
  }

  return { nodes, edges };
}

const { nodes: initialNodes, edges: initialEdges } = initialElements(15, 30);

function Main({
  setElements,
}: Readonly<{
  setElements: React.Dispatch<React.SetStateAction<Record<string, Element<StressNodeData>>>>;
}>) {
  const updatePos = useCallback(() => {
    startTransition(() => {
      setElements((previousElements) => {
        const newElements: Record<string, Element<StressNodeData>> = {};
        for (const [id, node] of Object.entries(previousElements)) {
          newElements[id] = {
            ...node,
            position: { x: Math.random() * 1500, y: Math.random() * 1500 },
          };
        }

        return newElements;
      });
    });
  }, [setElements]);

  return (
    <div className="flex flex-row relative">
      <Paper id="main-view" className={PAPER_CLASSNAME} height={600} />
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
  const [elements, setElements] = useState<Record<string, Element<StressNodeData>>>(initialNodes);
  const [links, setLinks] = useState<Record<string, Link>>(initialEdges);

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
