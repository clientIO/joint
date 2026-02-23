/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
/* eslint-disable @eslint-react/no-array-index-key */
/* eslint-disable sonarjs/no-small-switch */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import React from 'react';
import { dia, highlighters, linkTools, shapes } from '@joint/core';
import { PAPER_CLASSNAME, LIGHT } from 'storybook-config/theme';
import './index.css';
import {
  GraphProvider,
  Paper,
  useCellId,
  useElements,
  useGraph,
  useHighlighter,
  useNodeSize,
  useLinks,
  type GraphElement,
  type GraphLink,
  type ElementToGraphOptions,
  type PaperStore,
  type PaperProps,
  useNodeLayout,
} from '@joint/react';
import { useCallback, useRef, useState } from 'react';
import { ShowJson } from 'storybook-config/decorators/with-simple-data';
import { useCellActions } from '../../../hooks/use-cell-actions';
import { getMessageNodeClassName } from './get-message-node-class-name';
import { isCellSelected } from './is-cell-selected';

// Define types for the elements
interface ElementBase extends GraphElement {
  readonly elementType: 'alert' | 'info' | 'table';
}

interface MessageElement extends ElementBase {
  readonly elementType: 'alert' | 'info';
  readonly title: string;
  readonly description: string;
  readonly inputText: string;
}

interface TableElement extends ElementBase {
  readonly elementType: 'table';
  readonly columnNames: string[];
  readonly rows: string[][];
}

type Element = MessageElement | TableElement;

type ElementWithSelected<T> = { readonly selectedId: dia.Cell.ID | null } & T;

const BUTTON_CLASSNAME =
  'bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm flex items-center';

const ROW_HEIGHT_OFFSET = 45;
const PORT_START_Y = 65;

function buildTablePorts(rows: string[][]) {
  return {
    items: rows.map((_, index) => ({
      id: `out-3-${index}`,
      args: { x: 400, y: index * ROW_HEIGHT_OFFSET + PORT_START_Y },
      attrs: {
        circle: {
          magnet: true,
          r: 10,
          fill: 'transparent',
          stroke: 'transparent',
          'stroke-width': 16,
          'pointer-events': 'all',
        },
        text: { display: 'none' },
      },
      z: 'auto' as const,
    })),
  };
}

const mapDataToElementAttributes = ({
  data,
  defaultAttributes,
}: ElementToGraphOptions<GraphElement>): dia.Cell.JSON => {
  const result = defaultAttributes();
  const element = data as Element;
  if (element.elementType === 'table') {
    return { ...result, ports: buildTablePorts(element.rows) };
  }
  return result;
};

// Define static properties for the view's Paper - used by minimap and main view
const PAPER_PROPS: PaperProps<Element> = {
  defaultRouter: {
    name: 'rightAngle',
    args: {
      margin: 25,
    },
  },
  defaultConnector: {
    name: 'straight',
    args: { cornerType: 'line', cornerPreserveAspectRatio: true },
  },
  snapLinks: { radius: 25 },
  validateMagnet: (_cellView, magnet) => {
    return magnet.getAttribute('magnet') !== 'passive';
  },
  sorting: dia.Paper.sorting.APPROX,
  linkPinning: false,
  onLinkMouseEnter: ({ linkView }) => linkView.addTools(toolsView),
  onLinkMouseLeave: ({ linkView }) => linkView.removeTools(),
};

// Create initial elements and links with typing support as Records
const elements: Record<string, Element> = {
  '1': {
    x: 50,
    y: 110,
    elementType: 'alert',
    title: 'This is error element',
    description: 'This is longer text, it can be any message provided by the user',
    inputText: 'Node Text',
  },
  '2': {
    x: 550,
    y: 110,
    elementType: 'info',
    title: 'This is info element',
    description: 'This is longer text, it can be any message provided by the user',
    inputText: '',
  },
  '3': {
    x: 50,
    y: 370,
    elementType: 'table',
    columnNames: ['Column 1', 'Column 2', 'Column 3'],
    rows: [
      ['Row 1', 'Row 2', 'Row 3'],
      ['Row 4', 'Row 5', 'Row 6'],
      ['Row 7', 'Row 8', 'Row 9'],
    ],
    width: 400,
    height: 200,
  },
};

// Create initial links from table element port to another element as Record
const links: Record<string, GraphLink> = {
  link2: {
    source: { id: '3', port: 'out-3-0' }, // Port from table element
    target: { id: '1' },
    color: LIGHT,
    width: 2,
    className: 'link',
    pattern: '5,5',
    targetMarker: {
      d: 'M 0 0 L 8 4 L 8 -4 Z', // Larger arrowhead
    },
  },
};

// Define the message component
function MessageComponent({
  elementType,
  title,
  description,
  inputText,
  selectedId,
}: ElementWithSelected<MessageElement>) {
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
  const id = useCellId();
  const { set } = useCellActions<MessageElement>();
  const elementRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useNodeSize(elementRef);
  const isSelected = isCellSelected(id, selectedId);
  return (
    <foreignObject width={width} height={height} overflow="visible" magnet="passive">
      <div ref={elementRef} className={getMessageNodeClassName(isSelected)}>
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
              set(id, (previous) => ({ ...previous, inputText: value }));
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
function TableElement({
  columnNames,
  rows,
  width,
  height,
  selectedId,
}: ElementWithSelected<TableElement>) {
  const tableWidth = width ?? 0;
  const tableHeight = height ?? 0;
  const id = useCellId();
  const isSelected = isCellSelected(id, selectedId);
  const highlighterRef = useRef<SVGForeignObjectElement | null>(null);
  useHighlighter({
    type: 'custom',
    isEnabled: isSelected,
    padding: 25,
    rx: 5,
    ry: 5,
    attrs: {
      stroke: LIGHT,
      'stroke-width': 3,
    },
    create: ({ cellView, element, highlighterId, options }) => {
      return highlighters.stroke.add(cellView, element, highlighterId, options);
    },
    ref: highlighterRef,
  });
  return (
    <>
      <foreignObject
        ref={highlighterRef}
        width={tableWidth}
        height={tableHeight}
        overflow="visible"
      >
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
  const { width, height } = useNodeLayout();
  return <rect width={width} height={height} fill={'white'} rx={10} ry={10} />;
}
// Minimap component
function MiniMap() {
  // On change, the minimap will be resized to fit the content automatically
  const onElementReady = useCallback(({ paper }: { paper: dia.Paper }) => {
    const { model: graph } = paper;

    const contentArea = graph.getCellsBBox(graph.getElements());
    if (!contentArea) {
      return;
    }
    paper.transformToFitContent({
      contentArea,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
      padding: 20,
    });
  }, []);

  return (
    <div className="absolute bg-black bottom-6 right-6 w-[200px] h-[150px] border border-[#dde6ed] rounded-lg overflow-hidden">
      <Paper
        {...PAPER_PROPS}
        interactive={false}
        width={'100%'}
        className={PAPER_CLASSNAME}
        height={'100%'}
        renderElement={MinimapRenderElement}
        onElementsSizeReady={onElementReady}
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
  readonly selectedId: dia.Cell.ID | null;
  readonly setSelectedId: (id: dia.Cell.ID | null) => void;
  readonly showElementsInfo: boolean;
  readonly setShowElementsInfo: (show: boolean) => void;
  readonly paperCtxRef: React.RefObject<PaperStore | null>;
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
  const graph = useGraph();
  const { paper } = paperCtxRef.current ?? {};
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
          setSelectedId(clone.id);
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
  const elements = useElements();
  const links = useLinks();
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
  const [selectedElement, setSelectedElement] = useState<dia.Cell.ID | null>(null);
  const [showElementsInfo, setShowElementsInfo] = useState(false);
  const paperCtxRef = useRef<PaperStore | null>(null);

  const renderElement = useCallback(
    (element: Element) => {
      const { elementType } = element;
      switch (elementType) {
        case 'alert':
        case 'info': {
          return <MessageComponent {...element} selectedId={selectedElement} />;
        }
        case 'table': {
          return <TableElement {...element} selectedId={selectedElement} />;
        }
      }
    },
    [selectedElement]
  );

  return (
    <div className="flex flex-col relative">
      <div className="flex flex-col relative">
        <ToolBar
          onToggleMinimap={setIsMinimapVisible}
          isMinimapVisible={isMinimapVisible}
          selectedId={selectedElement}
          setSelectedId={setSelectedElement}
          showElementsInfo={showElementsInfo}
          setShowElementsInfo={setShowElementsInfo}
          paperCtxRef={paperCtxRef}
        />
        <Paper
          ref={paperCtxRef}
          {...PAPER_PROPS}
          defaultLink={() => {
            return new shapes.standard.Link({
              attrs: {
                line: {
                  stroke: LIGHT,
                  strokeWidth: 2,
                  strokeDasharray: '5,5',
                  targetMarker: {
                    d: 'M 0 0 L 8 4 L 8 -4 Z',
                  },
                },
              },
              color: LIGHT,
              width: 2,
              className: 'link',
              pattern: '5,5',
              targetMarker: {
                d: 'M 0 0 L 8 4 L 8 -4 Z',
              },
            } as shapes.standard.LinkAttributes);
          }}
          renderElement={renderElement}
          className={PAPER_CLASSNAME}
          onCellPointerClick={({ cellView }) => {
            const cell = cellView.model;
            setSelectedElement(cell.id ?? null);
          }}
          onLinkPointerClick={() => {
            setSelectedElement(null);
          }}
          onBlankPointerClick={() => {
            setSelectedElement(null);
          }}
        />

        {isMinimapVisible && <MiniMap />}
      </div>
      {showElementsInfo && <ElementsInfo />}
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider
      elements={elements}
      links={links}
      mapDataToElementAttributes={mapDataToElementAttributes}
    >
      <Main />
    </GraphProvider>
  );
}
