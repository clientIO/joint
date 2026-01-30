/* eslint-disable sonarjs/pseudo-random */
import {
  GraphProvider,
  ReactPaper,
  useLinkLayout,
  type GraphElement,
  type GraphLink,
  type RenderLink,
} from '@joint/react';
import '../index.css';
import React, { useCallback, useState, startTransition, memo } from 'react';
import { PAPER_CLASSNAME, PRIMARY, LIGHT } from 'storybook-config/theme';
import { REACT_PAPER_LINK_TYPE } from '../../../models/react-paper-link';

function initialElements(xNodes = 15, yNodes = 30) {
  const nodes: Record<
    string,
    {
      width: number;
      height: number;
      fontSize: number;
      label: string;
      x: number;
      y: number;
    }
  > = {};
  const edges: Record<
    string,
    {
      type: string;
      source: string;
      target: string;
      z: number;
    }
  > = {};
  let nodeId = 1;
  let edgeId = 1;
  let recentNodeId: number | null = null;

  for (let y = 0; y < yNodes; y++) {
    for (let x = 0; x < xNodes; x++) {
      const position = { x: x * 100, y: y * 50 };
      const data = { label: `Node ${nodeId}` };
      const id = `stress-${nodeId.toString()}`;
      const node = {
        width: 50,
        height: 20,
        fontSize: 11,
        ...data,
        ...position,
      };
      nodes[id] = node;

      if (recentNodeId !== null && nodeId <= xNodes * yNodes) {
        const edgeIdString = `edge-${edgeId.toString()}`;
        edges[edgeIdString] = {
          type: REACT_PAPER_LINK_TYPE,
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

type BaseElementWithData = (typeof initialNodes)[string];

/**
 * Pure SVG element renderer for ReactPaper stress test.
 * Uses SVG rect + text instead of foreignObject for better performance.
 */
const RenderElement = memo(function RenderElement({
  width,
  height,
  label,
}: Readonly<BaseElementWithData>) {
  return (
    <g>
      <rect width={width} height={height} fill={PRIMARY} rx={2} ry={2} />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize={11}
        fontFamily="sans-serif"
      >
        {label}
      </text>
    </g>
  );
});

/**
 * Link path component using useLinkLayout hook.
 */
function StressLinkPath() {
  const layout = useLinkLayout();
  if (!layout) return null;
  return <path d={layout.d} stroke={LIGHT} strokeWidth={0.5} fill="none" />;
}

function Main({
  setElements,
}: Readonly<{
  setElements: React.Dispatch<React.SetStateAction<Record<string, GraphElement>>>;
}>) {
  // Memoize the renderElement function to prevent unnecessary re-renders
  const renderElement = useCallback(
    (element: BaseElementWithData) => <RenderElement {...element} />,
    []
  );

  const renderLink: RenderLink = useCallback(() => <StressLinkPath />, []);

  const updatePos = useCallback(() => {
    // Use startTransition to mark this as a non-urgent update
    // This allows React to keep the UI responsive during the update
    startTransition(() => {
      setElements((previousElements) => {
        const newElements: Record<string, GraphElement> = {};
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
      <ReactPaper
        id="stress-react-paper"
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
  const [elements, setElements] = useState<Record<string, GraphElement>>(initialNodes);
  const [links, setLinks] = useState<Record<string, GraphLink>>(initialEdges);

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
