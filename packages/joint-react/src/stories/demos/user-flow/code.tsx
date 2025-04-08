/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
// We have pre-loaded tailwind css
import {
  createElements,
  createLinks,
  GraphProvider,
  HTMLNode,
  Paper,
  Port,
  type InferElement,
} from '@joint/react';
import { dia } from '@joint/core';
import { useCallback, useState } from 'react';

interface Data {
  title: string;
  description: string;
  type: 'user-action' | 'entity' | 'confirm' | 'message';
}

const nodes = createElements<Data>([
  {
    id: '1',
    data: {
      title: 'User Action',
      description: 'Transfer funds',
      type: 'user-action',
    },
    x: 50,
    y: 50,
  },
  {
    id: '2',
    data: {
      title: 'Entity',
      description: 'Transfer funds',
      type: 'entity',
    },
    x: 100,
    y: 150,
  },
  {
    id: '3',
    data: {
      title: 'User Action',
      description: 'Get account balance',
      type: 'user-action',
    },
    x: 150,
    y: 250,
  },

  {
    id: '4',
    data: {
      title: 'Confirmation',
      description: 'Balance information',
      type: 'confirm',
    },
    x: 200,
    y: 350,
  },
  {
    id: '5',
    data: {
      title: 'Message',
      description: 'Information about the transfer',
      type: 'message',
    },
    x: 250,
    y: 450,
  },

  {
    id: '6',
    data: {
      title: 'Entity',
      description: 'Some transfer information',
      type: 'entity',
    },
    x: 500,
    y: 250,
  },
  {
    id: '7',
    data: {
      title: 'Entity',
      description: 'Verifying transfer information',
      type: 'entity',
    },
    x: 550,
    y: 350,
  },

  {
    id: '8',
    data: {
      title: 'Message',
      description: 'Message about the transfer',
      type: 'message',
    },
    x: 600,
    y: 450,
  },
]);
const links = createLinks([]);

type NodeType = InferElement<typeof nodes>;

interface PortProps {
  id: string;
  label?: string;
  onRemove: () => void;
  x: number;
}
function PortIem({ id, label, onRemove, x }: Readonly<PortProps>) {
  const onRemovePress = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onRemove();
    },
    [onRemove]
  );
  return (
    <Port.Item x={10 + x} id={id}>
      <foreignObject className="w-20 h-6 overflow-visible">
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
function RenderElement({ data: { title, description, type } }: NodeType) {
  let icon: string;
  switch (type) {
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

  const [ports, setPorts] = useState([{ id: '1', label: 'Port 1' }]);

  const isDisabled = ports.length >= 3;
  return (
    <HTMLNode className="cursor-move text-white w-75 bg-white rounded-lg shadow-lg text-black px-4 py-2 flex flex-col border border-gray-100">
      <div className="flex flex-1 flex-row items-center px-2 py-2  mb-2">
        <i className={`fas fa-${icon} text-black`}></i>
        <div className="flex flex-col flex-1 ml-4">
          <div className="text-black">{title}</div>
          <div className="text-black text-sm">{description}</div>
        </div>
      </div>
      <Port.Group id="port-group" position="bottom" x={10} dy={-15}>
        {ports.map((port, index) => (
          <PortIem
            x={index * 85}
            key={port.id}
            id={port.id}
            label={port.label}
            onRemove={() => {
              setPorts((previous) => previous.filter((item) => item.id !== port.id));
            }}
          />
        ))}
      </Port.Group>
      <button
        disabled={isDisabled}
        onClick={() => {
          setPorts((previous) => [
            ...previous,
            {
              // eslint-disable-next-line sonarjs/pseudo-random
              id: `${Math.random()}`,
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
      height={600}
      width={900}
      renderElement={RenderElement}
      scrollWhileDragging
      sorting={dia.Paper.sorting.APPROX}
      snapLabels
      clickThreshold={10}
      interactive={{ linkMove: false }}
      defaultConnectionPoint={{
        name: 'boundary',
        args: {
          offset: 10,
          extrapolate: true,
        },
      }}
      defaultRouter={{ name: 'rightAngle', args: { margin: 20 } }}
      defaultConnector={{
        name: 'straight',
        args: { cornerType: 'line', cornerPreserveAspectRatio: true },
      }}
    />
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={nodes} defaultLinks={links}>
      <Main />
    </GraphProvider>
  );
}
