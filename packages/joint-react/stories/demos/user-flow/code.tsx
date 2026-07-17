/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
// Tailwind utility classes are provided globally by the Storybook preview.
import {
  GraphProvider,
  Paper,
  useCell,
  useCellId,
  useMarkup,
  HTMLHost,
  type CanConnectOptions,
  type CellId,
  type CellRecord,
  type ElementRecord,
  type LinkRecord,
  type RenderElement,
  selectElementSize,
  linkRoutingOrthogonal,
} from '@joint/react';
import { createContext, memo, useCallback, useContext, useMemo, useState } from 'react';
import { appendOutputPort, type OutputPort } from './port-utilities';

const ORTHOGONAL_LINKS = linkRoutingOrthogonal({ mode: 'bottom-top', cornerType: 'line' });

// Links may only end on an element's input port, and may not start from one.
const CONNECTION_RULES: CanConnectOptions = {
  allowRootConnection: false,
  validate: ({ source, target }) => {
    if (source.selector === 'in') return false;
    return target.selector === 'in';
  },
};

const ThemeContext = createContext(true);

// This demo is about the light/dark theme switch, so both palettes are intentional.
// The dark one is the unified diagram palette; red stays as the add-port accent.
const DARK_THEME = {
  canvas: 'bg-[#121c26] border border-[#2f4053]',
  cardBg: 'bg-[#1c2836]',
  cardBorder: 'border-[#3c4f63]',
  cardText: 'text-[#DDE6ED]',
  cardSubtext: 'text-[#93A4B3]',
  cardShadow: 'shadow-xl shadow-black/40',
  portFill: '#DDE6ED',
  portTextFill: '#121c26',
  portButtonCircle: '#121c26',
  portButtonStroke: '#DDE6ED',
  inputFill: '#121c26',
  inputStroke: '#8697A6',
  addButtonFill: '#ED2637',
  addButtonStroke: '#DDE6ED',
  linkColor: '#8697A6',
} as const;

const LIGHT_THEME = {
  canvas: 'bg-gray-100',
  cardBg: 'bg-white',
  cardBorder: 'border-gray-100',
  cardText: 'text-black',
  cardSubtext: 'text-black/60',
  cardShadow: 'shadow-lg',
  portFill: 'black',
  portTextFill: 'white',
  portButtonCircle: 'white',
  portButtonStroke: 'black',
  inputFill: '#FFFFFF',
  inputStroke: '#000000',
  addButtonFill: 'black',
  addButtonStroke: 'white',
  linkColor: '#000000',
} as const;

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

type NodeType = 'user-action' | 'entity' | 'confirm' | 'message';

const NODE_ICONS: Record<NodeType, string> = {
  'user-action': 'user',
  entity: 'building',
  confirm: 'check',
  message: 'comment',
};

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
  readonly nodeType: NodeType;
  readonly outputPorts: readonly OutputPort[];
};

type NodeRecord = ElementRecord<NodeData>;

const INITIAL_OUTPUT_PORTS: readonly OutputPort[] = [
  { id: '1', label: 'Port 1' },
  { id: '2', label: 'Port 2' },
];

const initialElements: Record<string, NodeRecord> = {
  '1': {
    id: '1',
    type: 'element',
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
    id: '2',
    type: 'element',
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
    id: '3',
    type: 'element',
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
    id: 'link1',
    type: 'link',
    source: { id: '1', magnet: '1' },
    target: { id: '2', magnet: 'in' },
    z: 11,
  },
  link2: {
    id: 'link2',
    type: 'link',
    source: { id: '2', magnet: '1' },
    target: { id: '3', magnet: 'in' },
    z: 11,
  },
  link3: {
    id: 'link3',
    type: 'link',
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
  const id = useCellId();
  const { magnetRef } = useMarkup();
  const { width, height } = useCell(selectElementSize);
  const isDark = useContext(ThemeContext);

  const icon = NODE_ICONS[nodeType];
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <>
      <HTMLHost
        style={{
          width: getNodeWidth(outputPorts.length),
          paddingBottom: PORT_PILL_HEIGHT + 10,
        }}
        className={`cursor-move w-75 rounded-lg px-4 py-2 flex flex-col border-2 ${theme.cardBg} ${theme.cardBorder} ${theme.cardText} ${theme.cardShadow}`}
      >
        <div className="flex flex-1 flex-row items-center px-2 py-1 mb-2">
          <i className={`fas fa-${icon} ${theme.cardText}`}></i>
          <div className="flex flex-col flex-1 ml-4">
            <div className={theme.cardText}>{title}</div>
            <div className={`text-sm ${theme.cardText}`}>{description}</div>
          </div>
        </div>
        <div className={`text-xs py-1 ${theme.cardSubtext}`}>
          Ports: in + {outputPorts.length} outputs
        </div>
      </HTMLHost>
      {/* Input port (passive magnet: a valid target, never a source) */}
      <circle
        ref={magnetRef('in', { passive: true })}
        className="port-in"
        cx={INPUT_PORT_CENTER_X}
        cy={0}
        r={INPUT_PORT_RADIUS}
        fill={theme.inputFill}
        stroke={theme.inputStroke}
        strokeWidth={2}
      />
      {/* Output ports (active magnets: links start from here) */}
      {outputPorts.map((port, index) => (
        <g
          key={port.id}
          ref={magnetRef(port.id)}
          className="port-out"
          cursor="crosshair"
          transform={`translate(${getPortCenterX(index)}, ${height - PORT_BOTTOM_MARGIN})`}
        >
          <rect
            x={-PORT_PILL_WIDTH / 2}
            y={-PORT_PILL_HEIGHT / 2}
            width={PORT_PILL_WIDTH}
            height={PORT_PILL_HEIGHT}
            rx={PORT_PILL_RADIUS}
            fill={theme.portFill}
          />
          <text
            x={-6}
            fill={theme.portTextFill}
            fontSize={11}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {port.label}
          </text>
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
            <circle r={PORT_PILL_RADIUS - 3} fill={theme.portButtonCircle} />
            <path
              d="M -3 -3 L 3 3 M 3 -3 L -3 3"
              stroke={theme.portButtonStroke}
              strokeWidth={1.5}
            />
          </g>
        </g>
      ))}
      {/* Add-port button */}
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
        <circle r={12} fill={theme.addButtonFill} />
        <path d="M -5 0 H 5 M 0 -5 V 5" stroke={theme.addButtonStroke} strokeWidth={2} />
      </g>
    </>
  );
}
const RenderElement = memo(RenderElementBase);

function buildInitialCells(): ReadonlyArray<CellRecord<NodeData>> {
  const cells: Array<CellRecord<NodeData>> = [];
  for (const node of Object.values(initialElements)) cells.push(node);
  for (const link of Object.values(initialLinks)) cells.push(link);
  return cells;
}

function Main() {
  const isDark = useContext(ThemeContext);
  const [cells, setCells] = useState<ReadonlyArray<CellRecord<NodeData>>>(buildInitialCells);
  const { linkColor } = isDark ? DARK_THEME : LIGHT_THEME;

  const themedCells = useMemo<ReadonlyArray<CellRecord<NodeData>>>(() => {
    return cells.map((cell): CellRecord<NodeData> => {
      if (cell.type !== 'link') return cell;
      return { ...cell, style: { ...cell.style, color: linkColor } };
    });
  }, [cells, linkColor]);

  const defaultLink = useMemo(() => ({ style: { color: linkColor } }), [linkColor]);

  const onAddPort = useCallback((id: CellId) => {
    setCells((previous) =>
      previous.map((cell): CellRecord<NodeData> => {
        if (cell.type !== 'element' || cell.id !== id || !cell.data) return cell;
        return { ...cell, data: appendOutputPort(cell.data) };
      })
    );
  }, []);

  const onRemovePort = useCallback((id: CellId, portId: string) => {
    const keepPort = (port: OutputPort) => port.id !== portId;
    setCells((previous) =>
      previous
        .map((cell): CellRecord<NodeData> | undefined => {
          if (cell.type === 'element') {
            if (cell.id !== id || !cell.data) return cell;
            return {
              ...cell,
              data: { ...cell.data, outputPorts: cell.data.outputPorts.filter(keepPort) },
            };
          }
          if (cell.type === 'link') {
            const isSource = cell.source?.id === id && cell.source?.magnet === portId;
            const isTarget = cell.target?.id === id && cell.target?.magnet === portId;
            return isSource || isTarget ? undefined : cell;
          }
          return cell;
        })
        .filter((cell): cell is CellRecord<NodeData> => cell !== undefined)
    );
  }, []);

  const renderElement: RenderElement<NodeData> = useCallback(
    (data) => {
      if (!data) return null;
      return <RenderElement {...data} onAddPort={onAddPort} onRemovePort={onRemovePort} />;
    },
    [onAddPort, onRemovePort]
  );

  return (
    <GraphProvider cells={themedCells} onCellsChange={setCells}>
      <Paper
        className="size-full"
        gridSize={5}
        drawGrid={false}
        defaultLink={defaultLink}
        renderElement={renderElement}
        clickThreshold={10}
        magnetThreshold="onleave"
        linkPinning={false}
        snapLinks={{ radius: 50 }}
        validateConnection={CONNECTION_RULES}
        linkRouting={ORTHOGONAL_LINKS}
      />
    </GraphProvider>
  );
}

function ThemeSwitch({ isDark, onClick }: Readonly<{ isDark: boolean; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Switch between light and dark mode"
      className={`absolute top-6 right-6 z-10 w-[70px] h-[30px] rounded-full cursor-pointer border-0 transition-colors duration-300 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}
    >
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
      <div
        className={`w-[24px] h-[24px] rounded-full absolute top-[3px] transition-transform duration-500 ease-in-out ${isDark ? 'translate-x-[40px] bg-slate-300' : 'translate-x-[4px] bg-white'}`}
      />
    </button>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const toggleTheme = useCallback(() => setIsDark((value) => !value), []);
  const { canvas } = isDark ? DARK_THEME : LIGHT_THEME;
  return (
    <ThemeContext.Provider value={isDark}>
      <div className={`relative size-full rounded-xl ${canvas}`}>
        <Main />
        <ThemeSwitch isDark={isDark} onClick={toggleTheme} />
      </div>
    </ThemeContext.Provider>
  );
}
