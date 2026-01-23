/**
 * Joint React Demo Application
 * 
 * This demo showcases the key features of @joint/react:
 * - Custom element rendering with HTML content
 * - Dynamic node sizing using useNodeSize hook
 * - Interactive selection and highlighting
 * - Port-based connections
 * - Minimap navigation
 * - Link tools and interactions
 * - Graph manipulation (duplicate, delete, zoom to fit)
 */

import { dia, linkTools, shapes } from '@joint/core';
import './index.css';
import {
    createElements,
    createLinks,
    GraphProvider,
    Highlighter,
    Paper,
    Port,
    useCellId,
    useGraph,
    usePaper,
    useCellActions,
    useNodeSize,
    type GraphElement,
    type PaperProps,
    type RenderElement,
} from '@joint/react';
import React, { useCallback, useRef, useState } from 'react';

// ============================================================================
// Constants
// ============================================================================

/** CSS class name for Paper components (main view and minimap) */
const PAPER_CLASSNAME =
  'border-1 border-gray-300 rounded-lg shadow-md overflow-hidden p-2 mr-2';

/** Light color used for links and highlights */
const LIGHT = '#DDE6ED';

/** CSS class name for toolbar buttons */
const BUTTON_CLASSNAME =
  'bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm flex items-center';

/** Height of each table row for port positioning */
const ROW_HEIGHT = 45;

/** Starting Y position for table row ports */
const ROW_START = 65;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Base interface for all graph elements in this demo.
 * Extends GraphElement with a discriminator field for element type.
 */
interface ElementBase extends GraphElement {
  readonly elementType: 'alert' | 'info' | 'table';
}

/**
 * Message element type - displays alert or info messages with editable text.
 */
interface MessageElement extends ElementBase {
  readonly elementType: 'alert' | 'info';
  readonly title: string;
  readonly description: string;
  readonly inputText: string;
}

/**
 * Table element type - displays tabular data with ports for each row.
 */
interface TableElement extends ElementBase {
  readonly elementType: 'table';
  readonly columnNames: string[];
  readonly rows: string[][];
}

/** Union type of all element types in this demo */
type Element = MessageElement | TableElement;

/** Helper type that adds selection state to an element */
type ElementWithSelected<T> = { readonly isSelected: boolean } & T;

// ============================================================================
// Paper Configuration
// ============================================================================

/**
 * Shared Paper configuration used by both the main view and minimap.
 * 
 * Key features:
 * - Right-angle router for links (creates L-shaped connections)
 * - Link snapping for easier connection creation
 * - Link tools appear on hover
 * - Magnet validation to prevent connections to passive magnets
 */
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
        // Only allow connections to active magnets (not passive ones)
        return magnet.getAttribute('magnet') !== 'passive';
    },
    sorting: dia.Paper.sorting.APPROX,
    linkPinning: false,
    // Show link tools when hovering over links
    onLinkMouseEnter: ({ linkView }) => linkView.addTools(toolsView),
    onLinkMouseLeave: ({ linkView }) => linkView.removeTools(),
};

// ============================================================================
// Initial Graph Data
// ============================================================================

/**
 * Initial elements in the graph.
 * 
 * Note: Message elements don't specify width/height - they use useNodeSize
 * to automatically measure their content size.
 */
const elements = createElements<Element>([
    {
        id: '1',
        x: 50,
        y: 110,
        elementType: 'alert',
        title: 'This is error element',
        description:
      'This is longer text, it can be any message provided by the user',
        inputText: 'Node Text',
    },
    {
        id: '2',
        x: 550,
        y: 110,
        elementType: 'info',
        title: 'This is info element',
        description:
      'This is longer text, it can be any message provided by the user',
        inputText: '',
    },
    {
        id: '3',
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
        attrs: {
            root: {
                magnet: false,
            },
        },
    },
]);

/**
 * Initial links connecting elements in the graph.
 * 
 * This link connects from a port on the table element (row 0) to the alert element.
 * Ports are created dynamically based on table rows.
 */
const links = createLinks([
    {
        id: 'link2',
        source: { id: '3', port: 'out-3-0' }, // Port from table element, row 0
        target: { id: '1' },
        attrs: {
            line: {
                stroke: LIGHT,
                class: 'link',
                strokeWidth: 2,
                strokeDasharray: '5,5', // Dashed line style
                targetMarker: {
                    d: 'M 0 0 L 8 4 L 8 -4 Z', // Custom arrowhead
                },
            },
        },
    },
]);

// ============================================================================
// Element Components
// ============================================================================

/**
 * Message Component - Renders alert or info message elements.
 * 
 * Features:
 * - Uses useNodeSize hook to automatically measure and update element size
 * - Editable text input that updates the graph element
 * - Visual highlighting when selected
 * - Different styling for alert vs info types
 * 
 * @param props - Message element properties with selection state
 */
function MessageComponent({
    elementType,
    title,
    description,
    inputText,
    isSelected,
    id,
}: ElementWithSelected<MessageElement>) {
    // Create a ref to the DOM element we want to measure
    const contentRef = useRef<HTMLDivElement>(null);
    
  
    // useNodeSize automatically measures the contentRef element and updates the graph element size
    // It returns the current element dimensions (which may differ from measured if transform is used)
    const { width, height } = useNodeSize(contentRef);
    
    // Determine icon and title styling based on element type
    let iconContent: React.ReactNode;
    let titleText: React.ReactNode;
    
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
    
    // Get cell actions to update the element
    const { set } = useCellActions<MessageElement>();
    
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
                <div
                    ref={contentRef}
                    className="flex flex-row border-1 border-solid border-white/20 text-white rounded-lg p-4 min-w-[250px] min-h-[100px] bg-gray-900 shadow-sm"
                >
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
                            onChange={({ target: { value }}) => {
                                // Update the element's inputText property using the set action
                                set(id, (previous: MessageElement) => ({
                                    ...previous,
                                    inputText: value,
                                }));
                            }}
                        />
                    </div>
                </div>
            </foreignObject>
        </Highlighter.Stroke>
    );
}

/**
 * Table Element Component - Renders a table with ports for each row.
 * 
 * Features:
 * - Fixed size (width/height specified in element data)
 * - Dynamic ports created for each table row
 * - Visual highlighting when selected
 * - Ports positioned to align with table rows
 * 
 * @param props - Table element properties with selection state
 */
function TableElement({
    columnNames,
    rows,
    width,
    height,
    isSelected,
}: ElementWithSelected<TableElement>) {
    // Get the current cell ID to create unique port IDs
    const cellId = useCellId();
    
    return (
        <>
            {/* Selection highlight - appears when element is selected */}
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
            
            {/* Port Group - Creates connection points on the right side */}
            <Port.Group position="right" id="out" dx={-10}>
                {rows.map((_, index) => (
                    <Port.Item
                        key={index}
                        // Unique port ID: "out-{cellId}-{rowIndex}"
                        // Example: "out-3-0" for cell 3, row 0
                        id={`out-${cellId}-${index}`}
                        // Position port to align with table row
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

// ============================================================================
// Minimap Component
// ============================================================================

/**
 * Minimap Component - Provides an overview of the entire graph.
 * 
 * Features:
 * - Simplified element rendering (just rectangles)
 * - Non-interactive (view-only)
 * - Automatically fits content when rendered
 * - Positioned in bottom-right corner
 */
function MiniMap() {
    // Simple render function for minimap - just shows rectangles
    const renderElement: RenderElement<Element> = useCallback(
        ({ width, height }) => (
            <rect width={width} height={height} fill={'white'} rx={10} ry={10} />
        ),
        []
    );
    
    // Fit content to view when minimap is ready
    // This ensures all elements are visible in the minimap viewport
    const onElementsSizeReady = useCallback(({ paper }: { paper: dia.Paper }) => {
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
                renderElement={renderElement}
                onElementsSizeReady={onElementsSizeReady}
            />
        </div>
    );
}

// ============================================================================
// Link Tools Configuration
// ============================================================================

/**
 * Link tools that appear when hovering over links.
 * 
 * Currently includes:
 * - Remove tool: Allows deleting links by clicking the tool
 */
const removeTool = new linkTools.Remove({
    scale: 1.5,
    style: { stroke: '#999' },
});

const toolsView = new dia.ToolsView({
    tools: [removeTool],
});

// ============================================================================
// Toolbar Component
// ============================================================================

interface ToolbarProps {
    readonly onToggleMinimap: (visible: boolean) => void;
    readonly isMinimapVisible: boolean;
    readonly selectedId: dia.Cell.ID | null;
    readonly setSelectedId: (id: dia.Cell.ID | null) => void;
}

/**
 * Toolbar Component - Provides graph manipulation actions.
 * 
 * Actions:
 * - Toggle minimap visibility
 * - Duplicate selected element
 * - Remove selected element
 * - Zoom to fit all content
 */
function ToolBar(props: ToolbarProps) {
    const { onToggleMinimap, isMinimapVisible, selectedId, setSelectedId } = props;
    
    // Get graph and paper instances for direct manipulation
    const graph = useGraph();
    const paper = usePaper();
    
    return (
        <div className="flex flex-row absolute top-2 left-2 z-10 bg-gray-900 rounded-lg p-2 shadow-md gap-2">
            {/* Toggle Minimap Button */}
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
            
            {/* Duplicate Button - Only enabled when an element is selected */}
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
                    
                    // Clone the element and offset it slightly
                    const clone = cell.clone();
                    clone.translate(20, 20);
                    graph.addCell(clone);
                    
                    // Select the newly created clone
                    setSelectedId(clone.id);
                }}
            >
                <i className="fa-solid fa-clone"></i>
                <span className="ml-2">Duplicate</span>
            </button>
            
            {/* Remove Button - Only enabled when an element is selected */}
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
                    
                    // Remove the element from the graph
                    cell.remove();
                    setSelectedId(null);
                }}
            >
                <i className="fa-solid fa-trash"></i>
                <span className="ml-2">Remove selected element</span>
            </button>
            
            {/* Zoom to Fit Button - Always enabled */}
            <button
                type="button"
                className={BUTTON_CLASSNAME}
                onClick={() => {
                    paper.transformToFitContent({
                        verticalAlign: 'middle',
                        horizontalAlign: 'middle',
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

// ============================================================================
// Main Application Component
// ============================================================================

/**
 * Main Component - Contains the primary Paper view and manages selection state.
 * 
 * Features:
 * - Element selection handling
 * - Conditional rendering based on element type
 * - Minimap toggle state
 * - Event handlers for user interactions
 */
function Main() {
    // State for minimap visibility
    const [isMinimapVisible, setIsMinimapVisible] = useState(false);
    
    // State for selected element ID
    const [selectedElement, setSelectedElement] = useState<dia.Cell.ID | null>(null);

    /**
     * Render function that determines which component to render based on element type.
     * 
     * This function is called by Paper for each element in the graph.
     * It receives the element data and returns the appropriate React component.
     */
    const renderElement = useCallback(
        (element: Element) => {
            const { elementType, id } = element;
            const isSelected = id === selectedElement;
            
            switch (elementType) {
                case 'alert':
                case 'info': {
                    return <MessageComponent {...element} isSelected={isSelected} />;
                }
                case 'table': {
                    return <TableElement {...element} isSelected={isSelected} />;
                }
            }
        },
        [selectedElement]
    );
    
    return (
        <div className="flex flex-col relative w-full h-full">
            <div className="flex flex-col relative h-full">
                <Paper
                    {...PAPER_PROPS}
                    // Default link template for new connections
                    // Callback creates a new link instance each time (without id) to avoid reusing the same component
                    defaultLink={() => {
                        const linkTemplate = links[0];
                        return new shapes.standard.Link({
                            source: linkTemplate.source,
                            target: linkTemplate.target,
                            attrs: linkTemplate.attrs,
                        });
                    }}
                    renderElement={renderElement}
                    className={PAPER_CLASSNAME}
                    
                    // Selection handlers
                    onCellPointerClick={({ cellView }) => {
                        const cell = cellView.model;
                        setSelectedElement(cell.id ?? null);
                    }}
                    onLinkPointerClick={() => {
                        // Deselect when clicking on a link
                        setSelectedElement(null);
                    }}
                    onBlankPointerClick={() => {
                        // Deselect when clicking on empty space
                        setSelectedElement(null);
                    }}
                    
                    width="100%"
                    height="calc(100vh - 100px)"
                >
                    {/* Toolbar is rendered as a child of Paper */}
                    <ToolBar
                        onToggleMinimap={setIsMinimapVisible}
                        isMinimapVisible={isMinimapVisible}
                        selectedId={selectedElement}
                        setSelectedId={setSelectedElement}
                    />
                </Paper>

                {/* Conditionally render minimap */}
                {isMinimapVisible && <MiniMap />}
            </div>
        </div>
    );
}

// ============================================================================
// Root Application Component
// ============================================================================

/**
 * App Component - Root component that provides the Graph context.
 * 
 * GraphProvider is required at the root level to provide:
 * - Graph state management
 * - Element and link synchronization
 * - Store access for hooks
 */
export default function App() {
    return (
        <GraphProvider elements={elements} links={links}>
            <Main />
        </GraphProvider>
    );
}
