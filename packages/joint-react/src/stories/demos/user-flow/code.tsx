/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
// We have pre-loaded tailwind css
import {
  GraphProvider,
  Paper,
  useCellId,
  useMarkup,
  useNodeSize,
  type CellId,
  type FlatElementData,
  type FlatLinkData,
} from '@joint/react';
import { useCallback, useRef, useState } from 'react';
import {
  appendOutputPort,
  type OutputPort,
} from './port-utilities';
import { anchors } from '@joint/core';

// Port pill dimensions
const PORT_PILL_WIDTH = 80;
const PORT_PILL_HEIGHT = 24;
const PORT_PILL_RADIUS = PORT_PILL_HEIGHT / 2;
const PORT_GAP = 8;
const PORT_BOTTOM_MARGIN = 20;

// Input port
const INPUT_PORT_RADIUS = 8;
const INPUT_PORT_CENTER_X = 20;

// Node sizing
const NODE_PADDING_LEFT = 10;
const NODE_PADDING_RIGHT = 44;
const NODE_MIN_WIDTH = 250;

function getNodeWidth(portCount: number) {
  return Math.max(
    NODE_MIN_WIDTH,
    NODE_PADDING_LEFT + portCount * PORT_PILL_WIDTH + (portCount - 1) * PORT_GAP + NODE_PADDING_RIGHT,
  );
}

function getPortCenterX(index: number) {
  return NODE_PADDING_LEFT + PORT_PILL_WIDTH / 2 + index * (PORT_PILL_WIDTH + PORT_GAP);
}

type NodeType = FlatElementData & {
  readonly title: string;
  readonly description: string;
  readonly nodeType: 'user-action' | 'entity' | 'confirm' | 'message';
  readonly outputPorts: readonly OutputPort[];
  readonly x: number;
  readonly y: number;
};

const INITIAL_OUTPUT_PORTS: readonly OutputPort[] = [
  { id: '1', label: 'Port 1' },
  { id: '2', label: 'Port 2' },
];

const initialElements: Record<string, NodeType> = {
  '1': {
    title: 'User Action',
    description: 'Transfer funds',
    nodeType: 'user-action',
    outputPorts: INITIAL_OUTPUT_PORTS,
    x: 50,
    y: 50,
    z: 10,
  },
  '2': {
    title: 'Entity',
    description: 'Transfer funds',
    nodeType: 'entity',
    outputPorts: INITIAL_OUTPUT_PORTS,
    x: 120,
    y: 240,
    z: 10,
  },
  '3': {
    title: 'User Action',
    description: 'Get account balance',
    nodeType: 'user-action',
    outputPorts: INITIAL_OUTPUT_PORTS,
    x: 190,
    y: 440,
    z: 10,
  },
};

const initialLinks: Record<string, FlatLinkData> = {
  link1: {
    source: '1',
    sourceMagnet: '1',
    target: '2',
    targetMagnet: 'in',
    z: 11,
  },
  link2: {
    source: '2',
    sourceMagnet: '1',
    target: '3',
    targetMagnet: 'in',
    z: 11,
  },
  link3: {
    source: '3',
    sourceMagnet: '2',
    target: '1',
    targetMagnet: 'in',
    z: 11,
  },
};

interface RenderElementProps extends NodeType {
  readonly onAddPort: (id: CellId) => void;
  readonly onRemovePort: (id: CellId, portId: string) => void;
}

function RenderElement({ title, description, nodeType, outputPorts, onAddPort, onRemovePort }: Readonly<RenderElementProps>) {
  const id = useCellId();
  const { selectorRef } = useMarkup();
  const contentRef = useRef<HTMLDivElement>(null);
  const { width, height } = useNodeSize(contentRef);

  let icon: string;
  switch (nodeType) {
    case 'user-action': {
      icon = 'fas fa-user';
      break;
    }
    case 'entity': {
      icon = 'fas fa-building';
      break;
    }
    case 'confirm': {
      icon = 'fas fa-check';
      break;
    }
    case 'message': {
      icon = 'fas fa-comment';
      break;
    }
    default: {
      icon = 'fas fa-question';
      break;
    }
  }

  return (
    <>
      <style>{'.port-button { opacity: 1; } .port-button:hover { opacity: 0.6; }'}</style>
      {/* Content of the node */}
      <foreignObject width={width} height={height} overflow="visible">
        <div
          ref={contentRef}
          style={{
            width: getNodeWidth(outputPorts.length),
            height: 'fit-content',
            paddingBottom: PORT_PILL_HEIGHT + PORT_BOTTOM_MARGIN,
          }}
          className="cursor-move text-white w-75 bg-white rounded-lg shadow-lg text-black px-4 py-2 flex flex-col border border-gray-100"
        >
          <div className="flex flex-1 flex-row items-center px-2 py-2  mb-2">
            <i className={`fas fa-${icon} text-black`}></i>
            <div className="flex flex-col flex-1 ml-4">
              <div className="text-black">{title}</div>
              <div className="text-black text-sm">{description}</div>
            </div>
          </div>
          <div className="text-xs text-black/60 py-1">Ports: in + {outputPorts.length} outputs</div>
        </div>
      </foreignObject>
      {/* Input port */}
      <circle
        ref={selectorRef('in')}
        className="port-in"
        magnet="passive"
        cx={INPUT_PORT_CENTER_X}
        cy={0}
        r={INPUT_PORT_RADIUS}
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth={2}
      />
      {/* Output ports */}
      {outputPorts.map((port, index) => (
        <g
          key={port.id}
          ref={selectorRef(port.id)}
          className="port-out"
          magnet="active"
          cursor="crosshair"
          transform={`translate(${getPortCenterX(index)}, ${height - PORT_BOTTOM_MARGIN})`}
        >
          <rect
            x={-PORT_PILL_WIDTH / 2}
            y={-PORT_PILL_HEIGHT / 2}
            width={PORT_PILL_WIDTH}
            height={PORT_PILL_HEIGHT}
            rx={PORT_PILL_RADIUS}
            fill="black"
          />
          <text
            x={-6}
            fill="white"
            fontSize={11}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {port.label}
          </text>
          {/* Remove port button */}
          <g
            className="port-button"
            cursor="pointer"
            transform={`translate(${PORT_PILL_WIDTH / 2 - PORT_PILL_RADIUS}, 0)`}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={() => {
              onRemovePort(id, port.id);
            }}
          >
            <circle r={PORT_PILL_RADIUS - 3} fill="white" />
            <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="black" strokeWidth={1.5} />
          </g>
        </g>
      ))}
      {/* Add port button */}
      <g
        className="port-button"
        cursor="pointer"
        transform={`translate(${width - 20}, ${height - 20})`}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={() => {
          onAddPort(id);
        }}
      >
        <circle r={12} fill="black" />
        <path d="M -5 0 H 5 M 0 -5 V 5" stroke="white" strokeWidth={2} />
      </g>
    </>
  );
}

function Main() {
  const [elements, setElements] = useState<Record<string, FlatElementData>>(initialElements);
  const [links, setLinks] = useState<Record<string, FlatLinkData>>(initialLinks);

  const onAddPort = useCallback((id: CellId) => {
    setElements((previous) => {
      const node = previous[id] as NodeType | undefined;
      if (!node) return previous;
      return {
        ...previous,
        [id]: appendOutputPort(node),
      };
    });
  }, []);

  const onRemovePort = useCallback((id: CellId, portId: string) => {
    setElements((previous) => {
      const node = previous[id] as NodeType | undefined;
      if (!node) return previous;
      return {
        ...previous,
        [id]: {
          ...node,
          outputPorts: node.outputPorts.filter((p) => p.id !== portId),
        },
      };
    });
    setLinks((previous) => {
      const next: Record<string, FlatLinkData> = {};
      for (const [linkId, link] of Object.entries(previous)) {
        const isSource = link.source === id && link.sourceMagnet === portId;
        const isTarget = link.target === id && link.targetMagnet === portId;
        if (!isSource && !isTarget) {
          next[linkId] = link;
        }
      }
      return next;
    });
  }, []);

  return (
    <GraphProvider
      elements={elements}
      links={links}
      onElementsChange={setElements}
      onLinksChange={setLinks}
    >
      <Paper
        className="bg-gray-100"
        gridSize={5}
        height={670}
        width={900}
        renderElement={(element) => <RenderElement {...(element as NodeType)} onAddPort={onAddPort} onRemovePort={onRemovePort} />}
        clickThreshold={10}
        magnetThreshold={'onleave'}
        interactive={(cellView) => (cellView.model.isLink() ? false : { linkMove: false })}
        linkPinning={false}
        snapLinks={{ radius: 50 }}
        validateMagnet={(_cellView, magnet) => {
          return magnet.getAttribute('magnet') !== 'passive';
        }}
        validateConnection={(cellViewS, magnetS, cellViewT, magnetT) => {
          if (cellViewS === cellViewT) return false;
          if (cellViewS.model.isLink() || cellViewT.model.isLink()) return false;
          if (magnetS?.classList.contains('port-in')) return false;
          return magnetT?.classList.contains('port-in') ?? false;
        }}
        defaultConnectionPoint={{
          name: 'boundary',
          args: {
            offset: 0,
            extrapolate: false,
          },
        }}
        defaultRouter={{
          name: 'rightAngle',
          args: { margin: 20 },
        }}
        defaultAnchor={(view, magnet, ref, opt, endType, linkView) => {
          const anchor = endType === 'source' ? anchors.bottom : anchors.top;
          return anchor(view, magnet, ref, opt, endType, linkView);
        }}
        defaultConnector={{
          name: 'straight',
          args: { cornerType: 'line', cornerPreserveAspectRatio: true },
        }}
      />
    </GraphProvider>
  );
}

export default function App() {
  return <Main />;
}
