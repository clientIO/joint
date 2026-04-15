/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-hooks/exhaustive-deps */

/* eslint-disable unicorn/prevent-abbreviations */

/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
// We have pre-loaded tailwind css
import {
  GraphProvider,
  Paper,
  useElementId,
  useElementSize,
  useMarkup,
  HTMLHost,
  type CellId,
  type ElementRecord,
  type LinkRecord,
  type RenderElement,
} from '@joint/react';

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from 'react';
import { appendOutputPort, type OutputPort } from './port-utilities';
import { linkRoutingOrthogonal } from '@joint/react/presets';

const ORTHOGONAL_LINKS = linkRoutingOrthogonal({ mode: 'bottom-top', cornerType: 'line' });

const ThemeContext = createContext(false);

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
    NODE_PADDING_LEFT +
      portCount * PORT_PILL_WIDTH +
      (portCount - 1) * PORT_GAP +
      NODE_PADDING_RIGHT
  );
}

function getPortCenterX(index: number) {
  return NODE_PADDING_LEFT + PORT_PILL_WIDTH / 2 + index * (PORT_PILL_WIDTH + PORT_GAP);
}

type NodeData = {
  readonly title: string;
  readonly description: string;
  readonly nodeType: 'user-action' | 'entity' | 'confirm' | 'message';
  readonly outputPorts: readonly OutputPort[];
};

type NodeType = ElementRecord<NodeData>;

const INITIAL_OUTPUT_PORTS: readonly OutputPort[] = [
  { id: '1', label: 'Port 1' },
  { id: '2', label: 'Port 2' },
];

const initialElements: Record<string, NodeType> = {
  '1': {
    data: {
      title: 'User Action',
      description: 'Transfer funds',
      nodeType: 'user-action',
      outputPorts: INITIAL_OUTPUT_PORTS,
    },
    position: { x: 50, y: 50 },
    z: 10,
  },
  '2': {
    data: {
      title: 'Entity',
      description: 'Transfer funds',
      nodeType: 'entity',
      outputPorts: INITIAL_OUTPUT_PORTS,
    },
    position: { x: 120, y: 240 },
    z: 10,
  },
  '3': {
    data: {
      title: 'User Action',
      description: 'Get account balance',
      nodeType: 'user-action',
      outputPorts: INITIAL_OUTPUT_PORTS,
    },
    position: { x: 190, y: 440 },
    z: 10,
  },
};

const initialLinks: Record<string, LinkRecord> = {
  link1: {
    source: { id: '1', magnet: '1' },
    target: { id: '2', magnet: 'in' },
    z: 11,
  },
  link2: {
    source: { id: '2', magnet: '1' },
    target: { id: '3', magnet: 'in' },
    z: 11,
  },
  link3: {
    source: { id: '3', magnet: '2' },
    target: { id: '1', magnet: 'in' },
    z: 11,
  },
};

type RenderElementProps = NodeData & {
  readonly onAddPort: (id: CellId) => void;
  readonly onRemovePort: (id: CellId, portId: string) => void;
};

function RenderElementBase({
  title,
  description,
  nodeType,
  outputPorts,
  onAddPort,
  onRemovePort,
}: Readonly<RenderElementProps>) {
  const id = useElementId();
  const { selectorRef } = useMarkup();
  const { width, height } = useElementSize();

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

  const isDark = useContext(ThemeContext);

  // Dark: frosted glass on deep navy. Red only as small accent (add btn). Ports are subtle light pills.
  const cardBg = isDark ? 'bg-[#162231]' : 'bg-white';
  const cardBorder = isDark ? 'border-transparent' : 'border-gray-100';
  const cardText = isDark ? 'text-[#dde6ed]' : 'text-black';
  const cardSubtext = isDark ? 'text-[#dde6ed]/35' : 'text-black/60';
  const cardShadow = isDark ? 'shadow-xl shadow-black/40' : 'shadow-lg';
  const draggingClass = 'border-2 border-transparent';

  const portFill = isDark ? '#dde6ed' : 'black';
  const portTextFill = isDark ? '#131e29' : 'white';
  const portBtnCircle = isDark ? '#131e29' : 'white';
  const portBtnStroke = isDark ? '#dde6ed' : 'black';
  const inputFill = isDark ? '#131e29' : '#FFFFFF';
  const inputStroke = isDark ? 'rgba(255,255,255,0.35)' : '#000000';
  const addBtnFill = isDark ? '#ed2637' : 'black';
  const addBtnStroke = isDark ? '#dde6ed' : 'white';

  return (
    <>
      {/* Content of the node */}
      <HTMLHost
        style={{
          width: getNodeWidth(outputPorts.length),
          paddingBottom: PORT_PILL_HEIGHT + 10,
        }}
        className={`cursor-move w-75 rounded-lg px-4 py-2 flex flex-col border ${cardBg} ${cardBorder} ${cardText} ${cardShadow} ${draggingClass}`}
      >
        <div className="flex flex-1 flex-row items-center px-2 py-1 mb-2">
          <i className={`fas fa-${icon} ${cardText}`}></i>
          <div className="flex flex-col flex-1 ml-4">
            <div className={cardText}>{title}</div>
            <div className={`text-sm ${cardText}`}>{description}</div>
          </div>
        </div>
        <div className={`text-xs py-1 ${cardSubtext}`}>
          Ports: in + {outputPorts.length} outputs
        </div>
      </HTMLHost>
      {/* Input port */}
      <circle
        ref={selectorRef('in')}
        className="port-in"
        magnet="passive"
        cx={INPUT_PORT_CENTER_X}
        cy={0}
        r={INPUT_PORT_RADIUS}
        fill={inputFill}
        stroke={inputStroke}
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
            fill={portFill}
          />
          <text
            x={-6}
            fill={portTextFill}
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
            <circle r={PORT_PILL_RADIUS - 3} fill={portBtnCircle} />
            <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke={portBtnStroke} strokeWidth={1.5} />
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
        <circle r={12} fill={addBtnFill} />
        <path d="M -5 0 H 5 M 0 -5 V 5" stroke={addBtnStroke} strokeWidth={2} />
      </g>
    </>
  );
}
const RenderElement = memo(RenderElementBase);
function Main() {
  const [elements, setElements] = useState<Record<string, ElementRecord<NodeData>>>(initialElements);
  const isDark = useContext(ThemeContext);

  function fixLinks(initialLinks: Record<string, LinkRecord>) {
    const next: Record<string, LinkRecord> = {};
    for (const [linkId, link] of Object.entries(initialLinks)) {
      next[linkId] = {
        ...link,
        style: { ...link.style, color: isDark ? 'rgba(255,255,255,0.35)' : '#000000' },
      };
    }
    return next;
  }
  const [links, setLinks] = useState<Record<string, LinkRecord>>(() => fixLinks(initialLinks));
  useLayoutEffect(() => {
    setLinks(fixLinks); // eslint-disable-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect -- Sync link colors with theme
  }, [isDark]);
  const onAddPort = useCallback((id: CellId) => {
    setElements((previous) => {
      const node = previous[id];
      if (!node?.data) return previous;
      const updated = appendOutputPort(node.data);
      return {
        ...previous,
        [id]: { ...node, data: updated },
      };
    });
  }, []);

  const onRemovePort = useCallback((id: CellId, portId: string) => {
    setElements((previous) => {
      const node = previous[id];
      if (!node?.data) return previous;
      return {
        ...previous,
        [id]: {
          ...node,
          data: {
            ...node.data,
            outputPorts: node.data.outputPorts.filter((p) => p.id !== portId),
          },
        },
      };
    });
    setLinks((previous) => {
      const next: Record<string, LinkRecord> = {};
      for (const [linkId, link] of Object.entries(previous)) {
        const isSource = link.source?.id === id && link.source?.magnet === portId;
        const isTarget = link.target?.id === id && link.target?.magnet === portId;
        if (!isSource && !isTarget) {
          next[linkId] = link;
        }
      }
      return next;
    });
  }, []);

  const renderElement: RenderElement<NodeData> = useCallback(
    (element) => <RenderElement {...element} onAddPort={onAddPort} onRemovePort={onRemovePort} />,
    [onAddPort, onRemovePort]
  );

  return (
    <GraphProvider
      elements={elements}
      links={links}
      onElementsChange={setElements}
      onLinksChange={setLinks}
    >
      <Paper
        gridSize={5}
        drawGrid={false}
        style={{ backgroundColor: 'transparent' }}
        height={'100%'}
        defaultLink={{
          style: { color: isDark ? 'rgba(255,255,255,0.35)' : '#000000' },
        }}
        width={'100%'}
        renderElement={renderElement}
        clickThreshold={10}
        magnetThreshold={'onleave'}
        interactive={(cellView) => (cellView.model.isLink() ? false : { linkMove: false })}
        linkPinning={false}
        snapLinks={{ radius: 50 }}
        validateMagnet={(_cellView, magnet) => {
          return magnet.getAttribute('magnet') !== 'passive';
        }}
        validateConnection={{
          validate: ({ source, target }) => {
            if (source.selector === 'in') return false;
            return target.selector === 'in';
          },
        }}
        {...ORTHOGONAL_LINKS}
      />
    </GraphProvider>
  );
}

function ThemeSwitch({ isDark, onClick }: Readonly<{ isDark: boolean; onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      title="Switch between light and dark mode"
      className={`absolute top-6 right-6 z-10 w-[70px] h-[30px] rounded-full cursor-pointer border-0 transition-colors duration-300 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}
    >
      {/* Sun icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute top-[7px] left-[8px]"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      {/* Moon icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={isDark ? '#1e293b' : '#e2e8f0'}
        className="absolute top-[7px] right-[8px]"
      >
        <path d="M12.0557 3.59974C12.2752 3.2813 12.2913 2.86484 12.0972 2.53033C11.9031 2.19582 11.5335 2.00324 11.1481 2.03579C6.02351 2.46868 2 6.76392 2 12C2 17.5228 6.47715 22 12 22C17.236 22 21.5313 17.9764 21.9642 12.8518C21.9967 12.4664 21.8041 12.0968 21.4696 11.9027C21.1351 11.7086 20.7187 11.7248 20.4002 11.9443C19.4341 12.6102 18.2641 13 17 13C13.6863 13 11 10.3137 11 6.99996C11 5.73589 11.3898 4.56587 12.0557 3.59974Z" />
      </svg>
      {/* Toggle knob */}
      <div
        className={`w-[24px] h-[24px] rounded-full absolute top-[3px] transition-transform duration-500 ease-in-out ${isDark ? 'translate-x-[40px] bg-slate-300' : 'translate-x-[4px] bg-white'}`}
      />
    </button>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  return (
    <ThemeContext.Provider value={isDark}>
      <div
        className={`relative w-full h-[700px] rounded-xl ${isDark ? 'bg-[#131e29] border border-[rgba(255,255,255,0.35)]' : 'bg-gray-100'}`}
      >
        <Main />
        <ThemeSwitch isDark={isDark} onClick={() => setIsDark((v) => !v)} />
      </div>
    </ThemeContext.Provider>
  );
}
