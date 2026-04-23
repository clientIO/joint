/* eslint-disable @eslint-react/no-array-index-key */
/* eslint-disable sonarjs/no-small-switch */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import React from 'react';
import { dia, highlighters, linkTools } from '@joint/core';
import { PAPER_CLASSNAME, LIGHT, SECONDARY } from 'storybook-config/theme';
import { linkRoutingOrthogonal } from '@joint/react/presets';
import {
  GraphProvider,
  Paper,
  useElement,
  useGraph,
  useMeasureNode,
  useNodesMeasuredEffect,
  useCells,
  type Cells,
  type CellId,
  type CellRecord,
  type ElementRecord,
  type ElementPort,
  type PaperProps,
  usePaperEvents,
} from '@joint/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ShowJson } from 'storybook-config/decorators/with-simple-data';

// Define types for the elements
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

const MESSAGE_NODE_CLASSNAME =
  'flex flex-row border-1 border-solid border-white/20 text-white rounded-lg p-4 min-w-[250px] min-h-[100px] bg-gray-900 shadow-sm';

const BUTTON_CLASSNAME =
  'bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm flex items-center';

const ROW_HEIGHT_OFFSET = 45;
const PORT_START_Y = 65;

function buildTablePorts(rows: string[][]): Record<string, ElementPort> {
  return Object.fromEntries(
    rows.map((_, index) => [
      `out-3-${index}`,
      {
        cx: 400,
        cy: index * ROW_HEIGHT_OFFSET + PORT_START_Y,
        width: 20,
        height: 20,
        color: 'transparent',
      },
    ])
  );
}

// Define static properties for the view's Paper - used by minimap and main view
const PAPER_PROPS: PaperProps = {
  ...linkRoutingOrthogonal({ cornerType: 'line', margin: 25 }),
  snapLinks: { radius: 25 },
  linkPinning: false,
  width: '100%',
};

// Create initial cells with typing support.
const initialCells: Cells<ElementData> = [
  {
    id: '1',
    type: 'ElementModel',
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
    type: 'ElementModel',
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
    type: 'ElementModel',
    data: {
      elementType: 'table',
      columnNames: ['Column 1', 'Column 2', 'Column 3'],
      rows: [
        ['Row 1', 'Row 2', 'Row 3'],
        ['Row 4', 'Row 5', 'Row 6'],
        ['Row 7', 'Row 8', 'Row 9'],
      ],
    },
    position: { x: 50, y: 370 },
    size: { width: 400, height: 200 },
    portMap: buildTablePorts([
      ['Row 1', 'Row 2', 'Row 3'],
      ['Row 4', 'Row 5', 'Row 6'],
      ['Row 7', 'Row 8', 'Row 9'],
    ]),
  },
  {
    id: 'link2',
    type: 'LinkModel',
    source: { id: '3', port: 'out-3-0' }, // Port from table element
    target: { id: '1' },
    style: {
      color: LIGHT,
      width: 2,
      dasharray: '5,5',
      targetMarker: {
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
      },
    },
  },
];

// Define the message component
function MessageComponent({
  elementType,
  title,
  description,
  inputText,
}: Readonly<MessageElementData>) {
  let iconContent;
  let titleText;
  switch (elementType) {
    case 'alert': {
      iconContent = (
        <i className="fa-solid fa-triangle-exclamation text-rose-500 text-3xl mt-2"></i>
      );
      titleText = <span className="text-rose-500 font-bold">{title}</span>;
      break;
    }
    default: {
      iconContent = <i className="fa-solid fa-circle-info text-3xl mt-2"></i>;
      titleText = <span className="font-bold">{title}</span>;
      break;
    }
  }
  const id = useElement((element) => element.id);
  const { setCell } = useGraph<ElementData>();
  const elementRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useMeasureNode(elementRef);
  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div ref={elementRef} className={MESSAGE_NODE_CLASSNAME}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 items-start">
            <div className="text-2xl">{iconContent}</div>
            <div className="text-lg ml-2">
              {titleText}
              <div className="text-sm mt-1">{description}</div>
            </div>
          </div>
          {/* Divider */}
          <div className="border-1 border-dashed border-rose-white mt-2 opacity-10" />
          <input
            type="text"
            value={inputText}
            className="w-full border-1 border-solid border-rose-white rounded-lg p-2 mt-3"
            placeholder="Type here..."
            onChange={({ target: { value } }) => {
              setCell((previous) => {
                const previousElement = previous as ElementRecord<ElementData>;
                const data = previousElement.data as MessageElementData | undefined;
                if (!data) {
                  return { ...previousElement, id } as ElementRecord<ElementData>;
                }
                return {
                  ...previousElement,
                  id,
                  data: { ...data, inputText: value },
                } as ElementRecord<ElementData>;
              });
            }}
          />
        </div>
      </div>
    </foreignObject>
  );
}

const ROW_HEIGHT = 45;
const ROW_START = 65;
// Define the table element
function TableElementComponent({ columnNames, rows }: Readonly<TableElementData>) {
  const { width, height } = useElement((element) => element.size);
  const tableWidth = width;
  const tableHeight = height;
  return (
    <>
      <foreignObject width={tableWidth} height={tableHeight} overflow="visible">
        <div
          style={{ width: tableWidth, height: tableHeight }}
          className="flex flex-col border-1 border-solid border-white/20 text-white rounded-lg p-4 w-full h-full bg-gray-900 shadow-sm"
        >
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
                    <td key={cellIndex} className="p-2 border-t border-white/20 border-dashed">
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
          x={tableWidth - 10}
          y={index * ROW_HEIGHT + ROW_START - 10}
          width={20}
          height={20}
          style={{ pointerEvents: 'none' }}
          overflow="visible"
        >
          <div
            style={{ pointerEvents: 'none' }}
            className="flex flex-col items-center justify-center bg-white rounded-full w-5 h-5"
          >
            <i className="fa-solid fa-arrow-right text-black text-sm"></i>
          </div>
        </foreignObject>
      ))}
    </>
  );
}

function MinimapRenderElement() {
  const { width, height } = useElement((element) => element.size);
  return <rect width={width} height={height} fill={'white'} rx={10} ry={10} />;
}
// Minimap component
function MiniMap() {
  const minimapId = useId();

  useNodesMeasuredEffect(minimapId, ({ paper, graph }) => {
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
    <div className="absolute bottom-6 right-6 w-[200px] h-[150px] border border-[#dde6ed] rounded-lg overflow-hidden">
      <Paper
        id={minimapId}
        {...PAPER_PROPS}
        interactive={false}
        width={'100%'}
        className={`${PAPER_CLASSNAME} h-full bg-gray-900 shadow-md`}
        height={'100%'}
        renderElement={MinimapRenderElement}
        drawGrid={false}
      />
    </div>
  );
}

// Define the remove tool for the link
const removeTool = new linkTools.Remove({
  scale: 1.5,
  style: { stroke: '#999' },
});

// Define the tools view for the link - so we can remove the link when hovered
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
  readonly paperCtxRef: React.RefObject<dia.Paper | null>;
}
// Toolbar component with some actions
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
  const paper = paperCtxRef.current;
  return (
    <div className="flex flex-row absolute top-2 left-2 z-10 bg-gray-900  rounded-lg p-2 shadow-md gap-2">
      <button
        type="button"
        className={BUTTON_CLASSNAME}
        onClick={() => {
          onToggleMinimap(!isMinimapVisible);
        }}
      >
        {isMinimapVisible ? (
          <i className="fa-solid fa-eye"></i>
        ) : (
          <i className="fa-solid fa-eye-slash"></i>
        )}
        <span className="ml-2">Toggle Minimap</span>
      </button>
      <button
        type="button"
        className={`${BUTTON_CLASSNAME} ${selectedId ? '' : 'opacity-20 cursor-not-allowed'}`}
        disabled={!selectedId}
        onClick={() => {
          if (!selectedId) {
            return;
          }
          const cell = graph.getCell(selectedId);
          if (!cell) {
            return;
          }
          if (!cell.isElement()) {
            return;
          }
          const clone = cell.clone();
          clone.translate(20, 20);
          graph.addCell(clone);
          setSelectedId(clone.id as CellId);
        }}
      >
        <i className="fa-solid fa-clone"></i>
        <span className="ml-2">Duplicate</span>
      </button>
      <button
        type="button"
        className={`${BUTTON_CLASSNAME} ${selectedId ? '' : 'opacity-20 cursor-not-allowed'}`}
        disabled={!selectedId}
        onClick={() => {
          if (!selectedId) {
            return;
          }
          const cell = graph.getCell(selectedId);
          if (!cell) {
            return;
          }
          if (!cell.isElement()) {
            return;
          }
          cell.remove();
          setSelectedId(null);
        }}
      >
        <i className="fa-solid fa-trash"></i>
        <span className="ml-2">Remove selected element</span>
      </button>
      <button
        type="button"
        className={BUTTON_CLASSNAME}
        onClick={() => {
          paper?.transformToFitContent({
            verticalAlign: 'middle',
            horizontalAlign: 'middle',
            padding: 20,
          });
        }}
      >
        <i className="fa-solid fa-undo"></i>
        <span className="ml-2">Zoom to fit</span>
      </button>
      <button
        type="button"
        className={BUTTON_CLASSNAME}
        onClick={() => {
          setShowElementsInfo(!showElementsInfo);
        }}
      >
        {showElementsInfo ? (
          <i className="fa-solid fa-eye-slash"></i>
        ) : (
          <i className="fa-solid fa-eye"></i>
        )}
        <span className="ml-2">Toggle info</span>
      </button>
    </div>
  );
}

// Show elements and links info
function ElementsInfo() {
  const cells = useCells<ElementData>();
  const { isElement, isLink } = useGraph();
  const elements: Record<string, CellRecord<ElementData>> = {};
  const links: Record<string, CellRecord<ElementData>> = {};
  for (const cell of cells) {
    if (isElement(cell)) elements[String(cell.id)] = cell;
    else if (isLink(cell)) links[String(cell.id)] = cell;
  }
  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex flex-col gap-2">
        <div className="text-white text-sm">Elements</div>
        <ShowJson data={JSON.stringify(elements, null, 2)} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-white text-sm">Links</div>
        <ShowJson data={JSON.stringify(links, null, 2)} />
      </div>
    </div>
  );
}

// Define main view component and render elements
function Main() {
  const [isMinimapVisible, setIsMinimapVisible] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<CellId | null>(null);
  const [showElementsInfo, setShowElementsInfo] = useState(false);
  const paperCtxRef = useRef<dia.Paper | null>(null);

  const renderElement = useCallback((data: ElementData | undefined) => {
    if (!data) return null;
    const { elementType } = data;
    switch (elementType) {
      case 'alert':
      case 'info': {
        return <MessageComponent {...data} />;
      }
      case 'table': {
        return <TableElementComponent {...data} />;
      }
    }
  }, []);

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

  const paperId = useId();

  usePaperEvents(
    paperId,
    {
      'link:mouseenter': (linkView) => linkView.addTools(toolsView),
      'link:mouseleave': (linkView) => linkView.removeTools(),
      'element:pointerclick': (elementView) => {
        setSelectedElementId(elementView.model.id as CellId);
      },
      'link:pointerclick': () => {
        setSelectedElementId(null);
      },
      'blank:pointerclick': () => {
        setSelectedElementId(null);
      },
    },
    [setSelectedElementId]
  );

  return (
    <div className="flex flex-col relative">
      <div className="flex flex-col relative">
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
          defaultLink={{
            style: {
              color: LIGHT,
              width: 2,
              className: 'link',
              dasharray: '5,5',
              targetMarker: {
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
              },
            },
          }}
          renderElement={renderElement}
          className={`${PAPER_CLASSNAME} h-[600px] bg-gray-900 shadow-md`}
        />

        {isMinimapVisible && <MiniMap />}
      </div>
      {showElementsInfo && <ElementsInfo />}
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider<ElementData> initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
