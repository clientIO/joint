import { shapes, dia } from '@joint/core';
import {
  GraphProvider,
  Paper,
  ElementModel,
  useCell,
  useCells,
  useGraph,
  selectElementSize,
  type CellRecord,
  type ElementRecord,
  type RenderElement,
} from '@joint/react';
import { useCallback, useMemo } from 'react';

// Colors — unified dark diagram palette.
const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const SUCCESS = '#36A18B';
const NODE_STROKE_COLOR = '#3c4f63';
const TEXT_COLOR = '#DDE6ED';
const LINK_COLOR = '#8697A6';
const LABEL_BACKGROUND_COLOR = '#243445';

/** Raw `standard.Link` attrs — dark line with a matching label chip. */
const LINK_ATTRS = { line: { stroke: LINK_COLOR } };

/** Builds a raw label JSON for `standard.Link`, themed to the dark palette. */
function linkLabelJSON(text: string) {
  return {
    attrs: {
      text: { text, fill: TEXT_COLOR },
      rect: { fill: LABEL_BACKGROUND_COLOR },
    },
  };
}

/**
 * Element user data stored as raw JointJS cell JSON: the built-in
 * `position`/`size`/`type` fields live at the top level, custom props
 * (`label`, `color`) go inside `data`.
 */
interface ElementData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

const initialCells: ReadonlyArray<
  CellRecord<ElementData, unknown, 'MyElementModel', 'standard.Link'>
> = [
  {
    id: 'node-1',
    type: 'MyElementModel',
    position: { x: 70, y: 100 },
    size: { width: 160, height: 60 },
    data: { label: 'Node 1', color: PRIMARY },
  },
  {
    id: 'node-2',
    type: 'MyElementModel',
    position: { x: 370, y: 70 },
    size: { width: 160, height: 60 },
    data: { label: 'Node 2', color: SECONDARY },
  },
  {
    id: 'node-3',
    type: 'MyElementModel',
    position: { x: 220, y: 250 },
    size: { width: 160, height: 60 },
    data: { label: 'Node 3', color: SUCCESS },
  },
  {
    id: 'link-1',
    type: 'standard.Link',
    source: { id: 'node-1' },
    target: { id: 'node-2' },
    attrs: LINK_ATTRS,
    labels: [linkLabelJSON('Link 1')],
  },
  {
    id: 'link-2',
    type: 'standard.Link',
    source: { id: 'node-1' },
    target: { id: 'node-3' },
    attrs: LINK_ATTRS,
    labels: [linkLabelJSON('Link 2')],
  },
];

function ElementShape({ label, color }: Readonly<ElementData>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <rect
        rx={8}
        ry={8}
        width={width}
        height={height}
        fill={color}
        stroke={NODE_STROKE_COLOR}
        strokeWidth={2}
      />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT_COLOR}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </text>
    </>
  );
}

/** Reads every element back from the store and renders its live cell JSON. */
function DataPanel() {
  const { isElement } = useGraph<ElementRecord<ElementData>>();
  const elements = useCells((cells) => {
    const result: Array<ElementRecord<ElementData>> = [];
    for (const cell of cells) {
      if (isElement(cell)) result.push(cell);
    }
    return result;
  });
  return (
    <aside className="w-56 shrink-0 overflow-auto border-l border-white/10 p-4 font-mono text-sm">
      <h3 className="mb-3 text-base font-bold">Cell JSON data</h3>
      {elements.map((element) => (
        <div key={element.id} className="mb-3 rounded-lg bg-white/5 p-3">
          <div className="mb-1 font-bold">{element.data.label}</div>
          <div>
            position: {'{'} x: {Math.round(element.position?.x ?? 0)}, y:{' '}
            {Math.round(element.position?.y ?? 0)} {'}'}
          </div>
          <div className="mt-1 text-xs opacity-60">
            size: {element.size?.width ?? 0} &times; {element.size?.height ?? 0}
          </div>
          <span className="jj-chip mt-2">{element.type}</span>
        </div>
      ))}
    </aside>
  );
}

function Main() {
  const renderElement: RenderElement<ElementData> = useCallback(
    (data) => (data ? <ElementShape {...data} /> : null),
    []
  );
  return (
    <div className="flex size-full">
      <Paper className="min-w-0 flex-1" renderElement={renderElement} />
      <DataPanel />
    </div>
  );
}

export default function App() {
  const graph = useMemo(
    () =>
      new dia.Graph(
        {},
        { cellNamespace: { ...shapes, MyElementModel: ElementModel } }
      ),
    []
  );
  return (
    <GraphProvider graph={graph} initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
