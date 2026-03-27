/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  Paper,
  useElementSize,
  type FlatElementData,
  type FlatLinkData,
} from '@joint/react';
import '../index.css';
import React, { useCallback, useRef, useState, startTransition, memo } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

interface StressNodeData {
  readonly label: string;
  readonly fontSize: number;
}

function initialElements(xNodes = 15, yNodes = 30) {
  const nodes: Record<string, FlatElementData<StressNodeData>> = {};
  const edges: Record<string, FlatLinkData> = {};
  let nodeId = 1;
  let edgeId = 1;
  let recentNodeId: number | null = null;

  for (let y = 0; y < yNodes; y++) {
    for (let x = 0; x < xNodes; x++) {
      const id = `stress-${nodeId.toString()}`;
      nodes[id] = {
        data: { label: `Node ${nodeId}`, fontSize: 11 },
        width: 50,
        height: 20,
        x: x * 100,
        y: y * 50,
      };

      if (recentNodeId !== null && nodeId <= xNodes * yNodes) {
        const edgeIdString = `edge-${edgeId.toString()}`;
        edges[edgeIdString] = {
          source: `stress-${recentNodeId.toString()}`,
          target: `stress-${nodeId.toString()}`,
          z: -1,
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

const RenderElement = memo(function RenderElement({ label, fontSize }: Readonly<StressNodeData>) {
  const { width, height } = useElementSize();
  const elementRef = useRef<HTMLDivElement>(null);
  return (
    <foreignObject width={width} height={height}>
      <div
        ref={elementRef}
        className="flex flex-col items-center justify-center rounded-sm text-xs"
        style={{ background: PRIMARY, color: '#ffffff', fontSize, width, height }}
      >
        {label}
      </div>
    </foreignObject>
  );
});

function Main({
  setElements,
}: Readonly<{
  setElements: React.Dispatch<
    React.SetStateAction<Record<string, FlatElementData<StressNodeData>>>
  >;
}>) {
  const renderElement = useCallback((data: StressNodeData) => <RenderElement {...data} />, []);

  const updatePos = useCallback(() => {
    startTransition(() => {
      setElements((previousElements) => {
        const newElements: Record<string, FlatElementData<StressNodeData>> = {};
        for (const [id, node] of Object.entries(previousElements)) {
          newElements[id] = {
            ...node,
            x: Math.random() * 1500,
            y: Math.random() * 1500,
          };
        }

        return newElements;
      });
    });
  }, [setElements]);

  return (
    <div className="flex flex-row relative">
      <Paper
        id="main-view"
        className={PAPER_CLASSNAME}
        height={600}
        renderElement={renderElement}
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
  const [elements, setElements] =
    useState<Record<string, FlatElementData<StressNodeData>>>(initialNodes);
  const [links, setLinks] = useState<Record<string, FlatLinkData>>(initialEdges);

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
