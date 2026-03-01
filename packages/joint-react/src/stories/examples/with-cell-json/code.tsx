import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { util, type dia } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  Paper,
  useElement,
  useElements,
  type GraphElement,
  type GraphLink,
  type ElementToGraphOptions,
  type GraphToElementOptions,
  type LinkToGraphOptions,
  type GraphToLinkOptions,
  type RenderElement,
} from '@joint/react';
import { useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

const SECONDARY = '#6366f1';

/**
 * Element data is raw JointJS cell JSON — nested `position`/`size`,
 * with custom properties (`label`, `color`) at the top level.
 * The mapper is near-identity.
 */
interface CellJsonElement extends GraphElement {
  readonly type: string;
  readonly position: { x: number; y: number };
  readonly size: { width: number; height: number };
  readonly label: string;
  readonly color: string;
}

interface CellJsonLink extends GraphLink {
  readonly type: string;
}

// ============================================================================
// Data
// ============================================================================

const initialElements: Record<string, CellJsonElement> = {
  'node-1': {
    type: 'ReactElement',
    position: { x: 70, y: 100 },
    size: { width: 160, height: 60 },
    label: 'Node 1',
    color: PRIMARY,
  },
  'node-2': {
    type: 'ReactElement',
    position: { x: 370, y: 70 },
    size: { width: 160, height: 60 },
    label: 'Node 2',
    color: SECONDARY,
  },
  'node-3': {
    type: 'ReactElement',
    position: { x: 220, y: 250 },
    size: { width: 160, height: 60 },
    label: 'Node 3',
    color: '#10b981',
  },
};

const initialLinks: Record<string, CellJsonLink> = {
  'link-1': {
    type: 'ReactLink',
    source: 'node-1',
    target: 'node-2',
  },
  'link-2': {
    type: 'ReactLink',
    source: 'node-1',
    target: 'node-3',
  },
};

// ============================================================================
// Identity Mappers: data IS JointJS cell JSON
// ============================================================================

// Derive pick keys from the data so the reverse mappers stay in sync
// with the types automatically — add a property to the data and it flows through.
const ELEMENT_KEYS = Object.keys(Object.values(initialElements)[0]);
const LINK_KEYS = Object.keys(Object.values(initialLinks)[0]);

/**
 * Forward mapper: data is already cell JSON — pass it through as-is.
 * The store handles `id` automatically.
 */
const mapDataToElementAttributes = ({
  data,
}: ElementToGraphOptions<GraphElement>): dia.Cell.JSON => {
  return { ...data } as dia.Cell.JSON;
};

/**
 * Reverse mapper: pick only the keys defined in the data format.
 */
const mapElementAttributesToData = ({
  cell,
}: GraphToElementOptions<GraphElement>): GraphElement => {
  return util.pick(cell.attributes, ELEMENT_KEYS) as GraphElement;
};

/**
 * Forward mapper for links: data is already cell JSON — pass it through as-is.
 * The store handles `id` automatically.
 */
const mapDataToLinkAttributes = ({
  data,
}: LinkToGraphOptions<GraphLink>): dia.Cell.JSON => {
  return { ...data } as unknown as dia.Cell.JSON;
};

/**
 * Reverse mapper: pick only the keys defined in the data format.
 */
const mapLinkAttributesToData = ({
  cell,
}: GraphToLinkOptions<GraphLink>): GraphLink => {
  return util.pick(cell.attributes, LINK_KEYS) as GraphLink;
};

// ============================================================================
// Element Shape
// ============================================================================

function ElementShape({ label, color }: Readonly<CellJsonElement>) {
  const { size } = useElement<CellJsonElement>();
  const { width = 160, height = 60 } = size ?? {};
  return (
    <>
      <rect
        rx={8}
        ry={8}
        width={width}
        height={height}
        fill={color}
        stroke="#333"
        strokeWidth={2}
      />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </text>
    </>
  );
}

// ============================================================================
// Data Panel — shows live raw cell JSON
// ============================================================================

function DataPanel() {
  const elements = useElements<CellJsonElement>();
  return (
    <div className="p-4 min-w-[200px] text-sm font-mono">
      <h3 className="text-base font-bold mb-3">Cell JSON Data</h3>
      {Object.entries(elements).map(([id, element]) => (
        <div key={id} className="mb-3 p-2 rounded bg-gray-800">
          <div className="font-bold mb-1">{element.label}</div>
          <div>
            position: {'{'}x: {Math.round(element.position.x)}, y:{' '}
            {Math.round(element.position.y)}{'}'}
          </div>
          <div className="text-gray-400 text-xs mt-1">
            size: {element.size.width} &times; {element.size.height}
          </div>
          <div className="text-gray-400 text-xs">type: {element.type}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main
// ============================================================================

const PAPER_STYLE = { flex: 1 };

function Main() {
  const renderElement: RenderElement<CellJsonElement> = useCallback(
    (props) => <ElementShape {...props} />,
    []
  );
  return (
    <div className="flex w-full h-full">
      <Paper
        className={PAPER_CLASSNAME}
        height={400}
        renderElement={renderElement}
        style={PAPER_STYLE}
      />
      <DataPanel />
    </div>
  );
}

// ============================================================================
// App
// ============================================================================

export default function App() {
  return (
    <GraphProvider
      elements={initialElements}
      links={initialLinks}
      mapDataToElementAttributes={mapDataToElementAttributes}
      mapElementAttributesToData={mapElementAttributesToData}
      mapDataToLinkAttributes={mapDataToLinkAttributes}
      mapLinkAttributesToData={mapLinkAttributesToData}
    >
      <Main />
    </GraphProvider>
  );
}
