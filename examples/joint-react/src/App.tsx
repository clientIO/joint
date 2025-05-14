import { dia, linkTools, shapes } from "@joint/core";
import "./index.css";
import {
  createElements,
  createLinks,
  GraphProvider,
  Highlighter,
  MeasuredNode,
  Paper,
  Port,
  useCellId,
  useGraph,
  usePaper,
  useUpdateElement,
  type GraphElement,
  type PaperProps,
  type RenderElement,
} from "@joint/react";
import { useCallback, useState } from "react";

const PAPER_CLASSNAME =
  "border-1 border-gray-300 rounded-lg shadow-md overflow-hidden p-2 mr-2";
const LIGHT = "#DDE6ED";
// Define the class name for the paper
const BUTTON_CLASSNAME =
  "bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm flex items-center";

// Define types for the elements
interface ElementBase extends GraphElement {
  readonly elementType: "alert" | "info" | "table";
}

interface MessageElement extends ElementBase {
  readonly elementType: "alert" | "info";
  readonly title: string;
  readonly description: string;
  readonly inputText: string;
}

interface TableElement extends ElementBase {
  readonly elementType: "table";
  readonly columnNames: string[];
  readonly rows: string[][];
}

type Element = MessageElement | TableElement;

type ElementWithSelected<T> = { readonly isSelected: boolean } & T;

// Define static properties for the paper - used by minimap and main paper
const PAPER_PROPS: PaperProps<Element> = {
  defaultRouter: {
    name: "rightAngle",
    args: {
      margin: 25,
    },
  },
  defaultConnector: {
    name: "straight",
    args: { cornerType: "line", cornerPreserveAspectRatio: true },
  },
  snapLinks: { radius: 25 },
  validateMagnet: (_cellView, magnet) => {
    return magnet.getAttribute("magnet") !== "passive";
  },
  sorting: dia.Paper.sorting.APPROX,
  linkPinning: false,
  onLinkMouseEnter: ({ linkView }) => linkView.addTools(toolsView),
  onLinkMouseLeave: ({ linkView }) => linkView.removeTools(),
};

// Create initial elements and links with typing support
const elements = createElements<Element>([
  {
    id: "1",
    x: 50,
    y: 110,
    elementType: "alert",
    title: "This is error element",
    description:
      "This is longer text, it can be any message provided by the user",
    inputText: "Node Text",
  },
  {
    id: "2",
    x: 550,
    y: 110,
    elementType: "info",
    title: "This is info element",
    description:
      "This is longer text, it can be any message provided by the user",
    inputText: "",
  },
  {
    id: "3",
    x: 50,
    y: 370,
    elementType: "table",
    columnNames: ["Column 1", "Column 2", "Column 3"],
    rows: [
      ["Row 1", "Row 2", "Row 3"],
      ["Row 4", "Row 5", "Row 6"],
      ["Row 7", "Row 8", "Row 9"],
    ],
    inputText: "",
    width: 400,
    height: 200,
    attrs: {
      root: {
        magnet: false,
      },
    },
  },
]);

// Create initial links from table element port to another element
const links = createLinks([
  {
    id: "link2",
    source: { id: "3", port: "out-3-0" }, // Port from table element
    target: { id: "1" },
    attrs: {
      line: {
        stroke: LIGHT,
        class: "link",
        strokeWidth: 2,
        strokeDasharray: "5,5",
        targetMarker: {
          d: `M 0 0 L 8 4 L 8 -4 Z`, // Larger arrowhead
        },
      },
    },
  },
]);

// Define the message component
function MessageComponent({
  elementType,
  title,
  description,
  inputText,
  width,
  height,
  isSelected,
}: ElementWithSelected<MessageElement>) {
  let iconContent;
  let titleText;
  switch (elementType) {
    case "alert": {
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
  const setMessage = useUpdateElement<MessageElement>(id, "inputText");
  return (
    <Highlighter.Stroke
      padding={10}
      rx={5}
      ry={5}
      strokeWidth={3}
      stroke={LIGHT}
      isHidden={!isSelected}
    >
      <foreignObject width={width} height={height} overflow="visible">
        <MeasuredNode>
          <div className="flex flex-row border-1 border-solid border-white/20 text-white rounded-lg p-4 min-w-[250px] min-h-[100px] bg-gray-900 shadow-sm">
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
                  setMessage(value);
                }}
              />
            </div>
          </div>
        </MeasuredNode>
      </foreignObject>
    </Highlighter.Stroke>
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
  isSelected,
}: ElementWithSelected<TableElement>) {
  const cellId = useCellId();
  return (
    <>
      <Highlighter.Stroke
        padding={25}
        rx={5}
        ry={5}
        strokeWidth={3}
        stroke={LIGHT}
        isHidden={!isSelected}
      >
        <foreignObject width={width} height={height} overflow="visible">
          <div
            style={{ width, height }}
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
                      <td
                        key={cellIndex}
                        className="p-2 border-t border-white/20 border-dashed"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </foreignObject>
      </Highlighter.Stroke>
      <Port.Group position="right" id="out" dx={-10}>
        {rows.map((_, index) => (
          <Port.Item
            key={index}
            id={`out-${cellId}-${index}`}
            y={index * ROW_HEIGHT + ROW_START}
          >
            <foreignObject width={20} height={20} overflow="visible">
              <div className="flex flex-col items-center justify-center bg-white rounded-full w-5 h-5">
                <i className="fa-solid fa-arrow-right text-black text-sm"></i>
              </div>
            </foreignObject>
          </Port.Item>
        ))}
      </Port.Group>
    </>
  );
}

// Minimap component
function MiniMap() {
  const renderElement: RenderElement<Element> = useCallback(
    ({ width, height }) => (
      <rect width={width} height={height} fill={"white"} rx={10} ry={10} />
    ),
    [],
  );
  // On change, the minimap will be resized to fit the content automatically
  const onElementReady = useCallback(({ paper }: { paper: dia.Paper }) => {
    const { model: graph } = paper;
    paper.transformToFitContent({
      contentArea: graph.getCellsBBox(graph.getElements()) ?? undefined,
      verticalAlign: "middle",
      horizontalAlign: "middle",
      padding: 20,
    });
  }, []);

  return (
    <div className="absolute bg-black bottom-6 right-6 w-[200px] h-[150px] border border-[#dde6ed] rounded-lg overflow-hidden">
      <Paper
        {...PAPER_PROPS}
        interactive={false}
        width={"100%"}
        className={PAPER_CLASSNAME}
        height={"100%"}
        renderElement={renderElement}
        onElementsSizeReady={onElementReady}
        onRenderDone={onElementReady}
      />
    </div>
  );
}

// Define the remove tool for the link
const removeTool = new linkTools.Remove({
  scale: 1.5,
  style: { stroke: "#999" },
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
}
// Toolbar component with some actions
function ToolBar(props: ToolbarProps) {
  const { onToggleMinimap, isMinimapVisible, selectedId, setSelectedId } =
    props;
  const graph = useGraph();
  const paper = usePaper();
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
        className={`${BUTTON_CLASSNAME} ${selectedId ? "" : "opacity-20 cursor-not-allowed"}`}
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
        className={`${BUTTON_CLASSNAME} ${selectedId ? "" : "opacity-20 cursor-not-allowed"}`}
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
          const lastElement = graph.getElements().at(-1);
          setSelectedId(lastElement?.id ?? null);
        }}
      >
        <i className="fa-solid fa-trash"></i>
        <span className="ml-2">Remove selected element</span>
      </button>
      <button
        type="button"
        className={BUTTON_CLASSNAME}
        onClick={() => {
          if (!paper) {
            return;
          }
          paper.transformToFitContent({
            verticalAlign: "middle",
            horizontalAlign: "middle",
            padding: 20,
          });
        }}
      >
        <i className="fa-solid fa-undo"></i>
        <span className="ml-2">Zoom to fit</span>
      </button>
    </div>
  );
}

// Define main paper component and render elements
function Main() {
  const [isMinimapVisible, setIsMinimapVisible] = useState(false);
  const [selectedElement, setSelectedElement] = useState<dia.Cell.ID | null>(
    null,
  );

  const renderElement = useCallback(
    (element: Element) => {
      const { elementType, id } = element;

      const isSelected = id === selectedElement;
      switch (elementType) {
        case "alert":
        case "info": {
          return <MessageComponent {...element} isSelected={isSelected} />;
        }
        case "table": {
          return <TableElement {...element} isSelected={isSelected} />;
        }
      }
    },
    [selectedElement],
  );
  return (
    <div className="flex flex-col relative w-full h-full">
      <div className="flex flex-col relative h-full">
        <Paper
          {...PAPER_PROPS}
          defaultLink={new shapes.standard.Link(links[0])}
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
          width="100%"
          height="calc(100vh - 100px)"
        >
          <ToolBar
            onToggleMinimap={setIsMinimapVisible}
            isMinimapVisible={isMinimapVisible}
            selectedId={selectedElement}
            setSelectedId={setSelectedElement}
          />
        </Paper>

        {isMinimapVisible && <MiniMap />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialElements={elements} initialLinks={links}>
      <Main />
    </GraphProvider>
  );
}
