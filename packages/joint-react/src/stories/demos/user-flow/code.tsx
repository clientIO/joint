/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
// We have pre-loaded tailwind css
import {
  GraphProvider,
  Paper,
  useCellId,
  type ElementToGraphOptions,
  type GraphElement,
  type GraphLink,
} from '@joint/react';
import type { dia } from '@joint/core';
import { useCallback, useState } from 'react';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';
import {
  appendOutputPort,
  createPorts,
  NODE_BASE_PADDING,
  NODE_MIN_WIDTH,
  NODE_PORT_PILL_SPACING,
  type OutputPort,
} from './port-utilities';

type NodeType = GraphElement & {
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

const nodes: Record<string, NodeType> = {
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
    y: 200,
    z: 10,
  },
  '3': {
    title: 'User Action',
    description: 'Get account balance',
    nodeType: 'user-action',
    outputPorts: INITIAL_OUTPUT_PORTS,
    x: 190,
    y: 350,
    z: 10,
  },
};

const links: Record<string, GraphLink> = {
  link1: {
    source: { id: '1', port: '1' },
    target: { id: '2', port: 'in' },
    z: 1,
  },
  link2: {
    source: { id: '2', port: '1' },
    target: { id: '3', port: 'in' },
    z: 1,
  },
  link3: {
    source: { id: '3', port: '2' },
    target: { id: '1', port: 'in' },
    z: 1,
  },
};

const mapDataToElementAttributes = (
  options: ElementToGraphOptions<GraphElement>
): dia.Cell.JSON => {
  const result = options.toAttributes(options.data);
  const { outputPorts } = options.data as NodeType;
  return {
    ...result,
    ...(outputPorts && { ports: createPorts(outputPorts) }),
  };
};

interface RenderElementProps extends NodeType {
  readonly onAddPort: (id: dia.Cell.ID) => void;
}

function RenderElement({ title, description, nodeType, outputPorts, onAddPort }: Readonly<RenderElementProps>) {
  const id = useCellId();

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
    <HTMLNode
      style={{
        width: outputPorts.length * NODE_PORT_PILL_SPACING + NODE_BASE_PADDING,
        minWidth: NODE_MIN_WIDTH,
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
      <div className="flex flex-wrap items-center gap-1 pb-1">
        <div className="pointer-events-none flex flex-wrap gap-1">
          {outputPorts.map((port) => (
            <div key={port.id} className="px-2 py-1 rounded-full bg-black text-white text-xs">
              {port.label}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="ml-1 flex size-6 items-center justify-center rounded-full bg-black text-white text-xs hover:opacity-80"
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onClick={() => {
            onAddPort(id);
          }}
        >
          +
        </button>
      </div>
    </HTMLNode>
  );
}

function Main() {
  const [elements, setElements] = useState<Record<string, GraphElement>>(nodes);
  const [controlledLinks, setControlledLinks] = useState<Record<string, GraphLink>>(links);

  const onAddPort = useCallback((id: dia.Cell.ID) => {
    setElements((previous) => {
      const node = previous[id] as NodeType | undefined;
      if (!node) return previous;
      return {
        ...previous,
        [id]: appendOutputPort(node),
      };
    });
  }, []);

  return (
    <GraphProvider
      elements={elements}
      links={controlledLinks}
      onElementsChange={setElements}
      onLinksChange={setControlledLinks}
      mapDataToElementAttributes={mapDataToElementAttributes}
    >
      <Paper
        className="bg-gray-100"
        gridSize={5}
        height={670}
        width={900}
        renderElement={(element) => <RenderElement {...(element as NodeType)} onAddPort={onAddPort} />}
        clickThreshold={10}
        magnetThreshold={'onleave'}
        interactive={(cellView) => (cellView.model.isLink() ? false : { linkMove: false })}
        linkPinning={false}
        snapLinks={{ radius: 10 }}
        validateMagnet={(_cellView, magnet) => {
          return magnet.getAttribute('magnet') !== 'passive';
        }}
        validateConnection={(cellViewS, magnetS, cellViewT, magnetT) => {
          if (cellViewS === cellViewT) return false;
          if (cellViewS.model.isLink() || cellViewT.model.isLink()) return false;
          if (magnetS?.getAttribute('port') === 'in') return false;
          return magnetT?.getAttribute('port') === 'in';
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
