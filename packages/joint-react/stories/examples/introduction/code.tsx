/* eslint-disable @eslint-react/no-array-index-key */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { dia, highlighters, linkTools } from '@joint/core';
import {
  GraphProvider,
  Paper,
  useCell,
  useCellId,
  useCells,
  useGraph,
  useMeasureElement,
  useOnElementsMeasured,
  type CellId,
  type CellRecord,
  type Computed,
  type ElementRecord,
  type LinkRecord,
  type ElementPort,
  type PaperProps,
  selectElementSize,
  linkRoutingOrthogonal,
} from '@joint/react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from 'react';

// Colors — unified dark diagram palette.
const NODE_FILL = '#1c2836';
const NODE_STROKE = '#3c4f63';
const LINK_COLOR = '#8697A6';
// Selection highlight around the clicked element.
const SECONDARY = '#FF9505';

// Types for the two custom node kinds this demo renders.
type MessageElementData = {
  readonly elementType: 'alert' | 'info';
  readonly title: string;
  readonly description: string;
  readonly inputText: string;
};

type TableElementData = {
  readonly elementType: 'table';
  readonly columnNames: string[];
  readonly rows: string[][];
};

type ElementData = MessageElementData | TableElementData;

// Tailwind needs literal class strings, so the palette hexes are inlined here.
const MESSAGE_NODE_CLASSNAME =
  'flex flex-row border-1 border-solid border-[#3c4f63] text-[#DDE6ED] rounded-lg p-4 min-w-[250px] min-h-[100px] bg-[#1c2836] shadow-sm';

const TABLE_NODE_CLASSNAME =
  'flex flex-col border-1 border-solid border-[#3c4f63] text-[#DDE6ED] rounded-lg p-4 w-full h-full bg-[#1c2836] shadow-sm';

const PORT_DOT_CLASSNAME =
  'flex flex-col items-center justify-center bg-[#8697A6] rounded-full w-5 h-5';

const PORT_ROW_HEIGHT = 45;
const PORT_START_Y = 65;
const TABLE_WIDTH = 400;

function buildTablePorts(rows: string[][]): Record<string, ElementPort> {
  return Object.fromEntries(
    rows.map((_, index) => [
      `out-3-${index}`,
      {
        cx: TABLE_WIDTH,
        cy: index * PORT_ROW_HEIGHT + PORT_START_Y,
        width: 20,
        height: 20,
        color: 'transparent',
      },
    ])
  );
}

const ARROW_MARKER = {
  markup: [
    {
      tagName: 'path',
      attributes: {
        d: 'M 0 0 L 8 4 L 8 -4 Z',
        fill: 'context-stroke',
        stroke: 'context-stroke',
      },
    },
  ],
};

// Static paper options shared by the main view and the minimap.
const PAPER_PROPS: PaperProps = {
  linkRouting: linkRoutingOrthogonal({ cornerType: 'line', margin: 25 }),
  snapLinks: { radius: 25 },
  linkPinning: false,
};

// Style applied to links the user draws by dragging from a table port.
const DEFAULT_LINK: NonNullable<PaperProps['defaultLink']> = {
  style: {
    color: LINK_COLOR,
    width: 2,
    className: 'link',
    dasharray: '5,5',
    targetMarker: ARROW_MARKER,
  },
};

const tableRows = [
  ['Row 1', 'Row 2', 'Row 3'],
  ['Row 4', 'Row 5', 'Row 6'],
  ['Row 7', 'Row 8', 'Row 9'],
];

const initialCells: ReadonlyArray<CellRecord<ElementData>> = [
  {
    id: '1',
    type: 'element',
    data: {
      elementType: 'alert',
      title: 'This is error element',
      description: 'This is longer text, it can be any message provided by the user',
      inputText: 'Node Text',
    },
    position: { x: 50, y: 110 },
  },
  {
    id: '2',
    type: 'element',
    data: {
      elementType: 'info',
      title: 'This is info element',
      description: 'This is longer text, it can be any message provided by the user',
      inputText: '',
    },
    position: { x: 550, y: 110 },
  },
  {
    id: '3',
    type: 'element',
    data: {
      elementType: 'table',
      columnNames: ['Column 1', 'Column 2', 'Column 3'],
      rows: tableRows,
    },
    position: { x: 50, y: 370 },
    size: { width: TABLE_WIDTH, height: 200 },
    portMap: buildTablePorts(tableRows),
  },
  {
    id: 'link2',
    type: 'link',
    source: { id: '3', port: 'out-3-0' },
    target: { id: '1' },
    style: {
      color: LINK_COLOR,
      width: 2,
      dasharray: '5,5',
      targetMarker: ARROW_MARKER,
    },
  },
];

function MessageComponent({
  elementType,
  title,
  description,
  inputText,
}: Readonly<MessageElementData>) {
  const isAlert = elementType === 'alert';
  const id = useCellId();
  const { setCell } = useGraph<ElementRecord<ElementData>, LinkRecord>();
  const divRef = useRef<HTMLDivElement>(null);
  const { width, height } = useMeasureElement(divRef);

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setCell(id, (previous) => {
        if (previous.type !== 'element') return previous;
        const { data } = previous;
        if (data.elementType === 'table') return previous;
        return { ...previous, data: { ...data, inputText: value } };
      });
    },
    [id, setCell]
  );

  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div ref={divRef} className={MESSAGE_NODE_CLASSNAME}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 items-start">
            <div className="text-2xl">
              {isAlert ? (
                <i className="fa-solid fa-triangle-exclamation text-[#ED2637] text-3xl mt-2" />
              ) : (
                <i className="fa-solid fa-circle-info text-3xl mt-2" />
              )}
            </div>
            <div className="text-lg ml-2">
              <span className={isAlert ? 'text-[#ED2637] font-bold' : 'font-bold'}>{title}</span>
              <div className="text-sm mt-1">{description}</div>
            </div>
          </div>
          <div className="border-t border-dashed border-[#3c4f63] mt-2" />
          <input
            type="text"
            value={inputText}
            className="jj-input w-full mt-3"
            placeholder="Type here..."
            onChange={handleInput}
          />
        </div>
      </div>
    </foreignObject>
  );
}

function TableElementComponent({ columnNames, rows }: Readonly<TableElementData>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <foreignObject width={width} height={height} overflow="visible">
        <div style={{ width, height }} className={TABLE_NODE_CLASSNAME}>
          <table className="w-full">
            <thead>
              <tr>
                {columnNames.map((name) => (
                  <th key={name} className="text-left p-2">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="p-2 border-t border-[#3c4f63] border-dashed">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </foreignObject>
      {rows.map((_, index) => (
        <foreignObject
          key={index}
          x={width - 10}
          y={index * PORT_ROW_HEIGHT + PORT_START_Y - 10}
          width={20}
          height={20}
          style={{ pointerEvents: 'none' }}
          overflow="visible"
        >
          <div className={PORT_DOT_CLASSNAME}>
            <i className="fa-solid fa-arrow-right text-[#121c26] text-sm" />
          </div>
        </foreignObject>
      ))}
    </>
  );
}

function MinimapRenderElement() {
  const { width, height } = useCell(selectElementSize);
  return (
    <rect
      width={width}
      height={height}
      fill={NODE_FILL}
      stroke={NODE_STROKE}
      rx={10}
      ry={10}
    />
  );
}

function MiniMap() {
  const minimapId = useId();

  useOnElementsMeasured(minimapId, ({ paper, graph }) => {
    const contentArea = graph.getBBox();
    if (!contentArea) return;
    paper.transformToFitContent({
      contentArea,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
      padding: 20,
    });
  });

  return (
    <div className="absolute bottom-6 right-6 z-10 h-[150px] w-[200px] overflow-hidden rounded-lg border border-[#2f4053] bg-[#121c26] shadow-md">
      <Paper
        id={minimapId}
        {...PAPER_PROPS}
        interactive={false}
        className="size-full"
        renderElement={MinimapRenderElement}
        drawGrid={false}
      />
    </div>
  );
}

const removeTool = new linkTools.Remove({
  scale: 1.5,
  style: { stroke: LINK_COLOR },
});

const toolsView = new dia.ToolsView({
  tools: [removeTool],
});

interface ToolbarProps {
  readonly onToggleMinimap: (visible: boolean) => void;
  readonly isMinimapVisible: boolean;
  readonly selectedId: CellId | null;
  readonly setSelectedId: (id: CellId | null) => void;
  readonly showElementsInfo: boolean;
  readonly setShowElementsInfo: (show: boolean) => void;
  readonly paperCtxRef: RefObject<dia.Paper | null>;
}

function ToolBar(props: Readonly<ToolbarProps>) {
  const {
    onToggleMinimap,
    isMinimapVisible,
    selectedId,
    setSelectedId,
    setShowElementsInfo,
    showElementsInfo,
    paperCtxRef,
  } = props;
  const { graph } = useGraph();

  const toggleMinimap = useCallback(
    () => onToggleMinimap(!isMinimapVisible),
    [isMinimapVisible, onToggleMinimap]
  );

  const toggleInfo = useCallback(
    () => setShowElementsInfo(!showElementsInfo),
    [showElementsInfo, setShowElementsInfo]
  );

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const cell = graph.getCell(selectedId);
    if (!cell?.isElement()) return;
    const clone = cell.clone();
    clone.translate(20, 20);
    graph.addCell(clone);
    setSelectedId(clone.id as CellId);
  }, [graph, selectedId, setSelectedId]);

  const removeSelected = useCallback(() => {
    if (!selectedId) return;
    const cell = graph.getCell(selectedId);
    if (!cell?.isElement()) return;
    cell.remove();
    setSelectedId(null);
  }, [graph, selectedId, setSelectedId]);

  const zoomToFit = useCallback(() => {
    paperCtxRef.current?.transformToFitContent({
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
      padding: 20,
    });
  }, [paperCtxRef]);

  return (
    <div className="jj-controls absolute top-3 left-3 z-10">
      <button type="button" className="jj-btn" onClick={toggleMinimap}>
        <i className={isMinimapVisible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'} />
        <span>Toggle minimap</span>
      </button>
      <button
        type="button"
        className="jj-btn"
        disabled={!selectedId}
        onClick={duplicateSelected}
      >
        <i className="fa-solid fa-clone" />
        <span>Duplicate</span>
      </button>
      <button type="button" className="jj-btn" disabled={!selectedId} onClick={removeSelected}>
        <i className="fa-solid fa-trash" />
        <span>Remove</span>
      </button>
      <button type="button" className="jj-btn" onClick={zoomToFit}>
        <i className="fa-solid fa-undo" />
        <span>Zoom to fit</span>
      </button>
      <button type="button" className="jj-btn" onClick={toggleInfo}>
        <i className={showElementsInfo ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
        <span>Toggle info</span>
      </button>
    </div>
  );
}

// Live view of every cell — updates as nodes are edited, moved, or removed.
function ElementsInfo() {
  const cells = useCells<Computed<CellRecord>>();
  const cellsById: Record<string, Computed<CellRecord>> = {};
  for (const cell of cells) {
    if (cell.id == undefined) continue;
    cellsById[String(cell.id)] = cell;
  }
  return (
    <div className="absolute left-3 top-20 bottom-3 z-10 w-80 overflow-auto rounded-lg border border-[#2f4053] bg-[#121c26]/95 p-3 shadow-md">
      <div className="mb-2 text-sm font-semibold text-[#DDE6ED]">Cells</div>
      <pre className="whitespace-pre-wrap break-all text-xs leading-relaxed text-[#93A4B3]">
        {JSON.stringify(cellsById, null, 2)}
      </pre>
    </div>
  );
}

function Main() {
  const [isMinimapVisible, setIsMinimapVisible] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<CellId | null>(null);
  const [showElementsInfo, setShowElementsInfo] = useState(false);
  const paperCtxRef = useRef<dia.Paper | null>(null);
  const paperId = useId();

  const renderElement = useCallback((data: ElementData) => {
    switch (data.elementType) {
      case 'alert':
      case 'info': {
        return <MessageComponent {...data} />;
      }
      case 'table': {
        return <TableElementComponent {...data} />;
      }
    }
  }, []);

  const handleLinkMouseEnter = useCallback<NonNullable<PaperProps['onLinkMouseEnter']>>(
    ({ view }) => view.addTools(toolsView),
    []
  );

  const handleLinkMouseLeave = useCallback<NonNullable<PaperProps['onLinkMouseLeave']>>(
    ({ view }) => view.removeTools(),
    []
  );

  const handleElementClick = useCallback<NonNullable<PaperProps['onElementPointerClick']>>(
    ({ id }) => setSelectedElementId(id as CellId),
    []
  );

  const clearSelection = useCallback(() => setSelectedElementId(null), []);

  useEffect(() => {
    const paper = paperCtxRef.current;
    if (!paper) return;
    highlighters.stroke.removeAll(paper, 'selection');
    if (!selectedElementId) return;
    const cellView = paper.findViewByModel(selectedElementId);
    if (!cellView) return;
    highlighters.stroke.add(cellView, 'root', 'selection', {
      z: -1,
      padding: 10,
      rx: 10,
      ry: 10,
      attrs: {
        stroke: SECONDARY,
        strokeWidth: 3,
      },
    });
  }, [selectedElementId]);

  return (
    <div className="relative size-full">
      <ToolBar
        onToggleMinimap={setIsMinimapVisible}
        isMinimapVisible={isMinimapVisible}
        selectedId={selectedElementId}
        setSelectedId={setSelectedElementId}
        showElementsInfo={showElementsInfo}
        setShowElementsInfo={setShowElementsInfo}
        paperCtxRef={paperCtxRef}
      />
      <Paper
        id={paperId}
        ref={paperCtxRef}
        {...PAPER_PROPS}
        defaultLink={DEFAULT_LINK}
        renderElement={renderElement}
        className="size-full"
        onLinkMouseEnter={handleLinkMouseEnter}
        onLinkMouseLeave={handleLinkMouseLeave}
        onElementPointerClick={handleElementClick}
        onLinkPointerClick={clearSelection}
        onBlankPointerClick={clearSelection}
      />
      {isMinimapVisible && <MiniMap />}
      {showElementsInfo && <ElementsInfo />}
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
