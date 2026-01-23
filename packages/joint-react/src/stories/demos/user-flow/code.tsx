/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
// We have pre-loaded tailwind css
import { GraphProvider, Paper, Port, type GraphLink } from '@joint/react';
import type { dia } from '@joint/core';
import { util } from '@joint/core';
import { useCallback, useState } from 'react';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';

type NodeType = {
  id: string;
  title: string;
  description: string;
  nodeType: 'user-action' | 'entity' | 'confirm' | 'message';
  x: number;
  y: number;
  attrs?: {
    root?: {
      magnet?: boolean;
    };
  };
};

const nodes: NodeType[] = [
  {
    id: '1',
    title: 'User Action',
    description: 'Transfer funds',
    nodeType: 'user-action',
    x: 50,
    y: 50,
    attrs: {
      root: {
        magnet: false,
      },
    },
  },
  {
    id: '2',
    title: 'Entity',
    description: 'Transfer funds',
    nodeType: 'entity',
    x: 120,
    y: 200,
    attrs: {
      root: {
        magnet: false,
      },
    },
  },
  {
    id: '3',
    title: 'User Action',
    description: 'Get account balance',
    nodeType: 'user-action',
    attrs: {
      root: {
        magnet: false,
      },
    },
    x: 190,
    y: 350,
  },
];

const links: GraphLink[] = [
  {
    id: 'link1',
    source: { id: '1', port: '1' },
    target: { id: '2', port: 'in' },
  },
  {
    id: 'link2',
    source: { id: '2', port: '1' },
    target: { id: '3', port: 'in' },
  },
  {
    id: 'link3',
    source: { id: '3', port: '2' },
    target: { id: '1', port: 'in' },
  },
];

interface PortProps {
  id: string;
  label?: string;
  onRemove: (id: dia.Cell.ID) => void;
  x: number;
}
function PortItem({ id, label, onRemove, x }: Readonly<PortProps>) {
  const onRemovePress = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onRemove(id);
    },
    [id, onRemove]
  );
  return (
    <Port.Item x={10 + x} id={id}>
      <foreignObject width={100} height={20} className="w-20 h-6 overflow-visible">
        <div className="w-full h-full bg-black rounded-full flex flex-row items-center justify-center px-1 shadow-xl">
          <div className="flex flex-1 text-white text-xs ml-2">{label}</div>
          <button
            onClick={onRemovePress}
            type="button"
            className="cursor-pointer size-4 min-w-4 rounded-full bg-white flex items-center justify-center
            hover:opacity-65 transition-opacity duration-200 ease-in-out"
          >
            <i className="fa-solid fa-xmark text-black text-xs group-hover:text-red-500"></i>
          </button>
        </div>
      </foreignObject>
    </Port.Item>
  );
}
function RenderElement({ title, description, nodeType }: Readonly<NodeType>) {
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

  const [ports, setPorts] = useState([
    { id: '1', label: 'Port 1' },
    { id: '2', label: 'Port 2' },
  ]);

  const PORT_IN_SIZE = 15;

  const onRemove = useCallback(
    (id: dia.Cell.ID) => {
      setPorts((previous) => previous.filter((port) => port.id !== id));
    },
    [setPorts]
  );
  return (
    <HTMLNode
      style={{
        width: ports.length * 85 + 55,
        minWidth: 250,
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
      <Port.Group id="port-in-group" position="top" x={10} dy={-PORT_IN_SIZE / 2}>
        <Port.Item id="in">
          <foreignObject width={PORT_IN_SIZE} height={PORT_IN_SIZE} overflow="visible">
            <div className="bg-white w-full h-full border-2 border-black rounded-full opacity-50" />
          </foreignObject>
        </Port.Item>
      </Port.Group>
      <Port.Group id="port-out-group" position="bottom" x={10} dy={-15}>
        {ports.map((port, index) => (
          <PortItem
            x={index * 85}
            key={port.id}
            id={port.id}
            label={port.label}
            onRemove={onRemove}
          />
        ))}
      </Port.Group>
      <button
        onClick={() => {
          setPorts((previous) => [
            ...previous,
            {
              id: util.uuid(),
              label: `Port ${ports.length + 1}`,
            },
          ]);
        }}
        type="button"
        className="cursor-pointer size-5 rounded-full bg-black flex items-center justify-center absolute right-2 -bottom-2
            hover:opacity-65 transition-opacity duration-200 ease-in-out
            disabled:opacity-50 disabled:cursor-not-allowed
            "
      >
        <i className="fa-solid fa-plus text-white text-xs group-hover:text-red-500"></i>
      </button>
    </HTMLNode>
  );
}

function Main() {
  return (
    <Paper
      className="bg-gray-100"
      gridSize={5}
      height={670}
      width={900}
      renderElement={RenderElement}
      clickThreshold={10}
      magnetThreshold={'onleave'}
      interactive={{ linkMove: false }}
      linkPinning={false}
      snapLinks={{ radius: 10 }}
      validateMagnet={(_cellView, magnet) => {
        return magnet.getAttribute('magnet') !== 'passive';
      }}
      validateConnection={(cellViewS, magnetS, cellViewT, magnetT) => {
        if (cellViewS === cellViewT) return false;
        if (cellViewS.model.isLink() || cellViewT.model.isLink()) return false;
        if (cellViewS.findAttribute('port-group', magnetS) === 'port-in-group') return false;
        return cellViewT.findAttribute('port-group', magnetT) !== 'port-out-group';
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
  );
}

export default function App() {
  return (
    <GraphProvider elements={nodes} links={links}>
      <Main />
    </GraphProvider>
  );
}
