import { useCallback, useMemo, useState, type ChangeEvent } from 'react';
import type { CellRecord, ElementPort, ElementRecord, LinkRecord } from '@joint/react';
import {
  GraphProvider,
  Paper,
  HTMLBox,
  linkRoutingSmooth,
  linkMarkerArrow,
  linkMarkerArrowOpen,
  linkMarkerArrowSunken,
  linkMarkerArrowQuill,
  linkMarkerArrowDouble,
  linkMarkerCircle,
  linkMarkerDiamond,
  linkMarkerLine,
  linkMarkerCross,
  linkMarkerFork,
  linkMarkerForkClose,
  linkMarkerMany,
  linkMarkerManyOptional,
  linkMarkerOne,
  linkMarkerOneOptional,
  linkMarkerOneOrMany,
} from '@joint/react';

// Colors — unified dark diagram palette.
const PRIMARY = '#ED2637';
const LABEL_TEXT_COLOR = '#DDE6ED';
const LABEL_BODY_COLOR = '#1c2836';
const LABEL_STROKE_COLOR = '#3c4f63';

const PORT_GAP = 30;
const PORT_SIZE = 8;
const ELEMENT_WIDTH = 80;
const ELEMENT_GAP = 200;
const PADDING = 40;

const SMOOTH_LINKS = linkRoutingSmooth();

// Each entry: [display name, marker factory, extra options for the outline variant].
const MARKER_ENTRIES = [
  ['arrow', linkMarkerArrow],
  ['arrow-outline', linkMarkerArrow, { fill: 'none' }],
  ['arrow-open', linkMarkerArrowOpen],
  ['arrow-sunken', linkMarkerArrowSunken],
  ['arrow-sunken-outline', linkMarkerArrowSunken, { fill: 'none' }],
  ['arrow-quill', linkMarkerArrowQuill],
  ['arrow-quill-outline', linkMarkerArrowQuill, { fill: 'none' }],
  ['arrow-double', linkMarkerArrowDouble],
  ['arrow-double-outline', linkMarkerArrowDouble, { fill: 'none' }],
  ['circle', linkMarkerCircle],
  ['circle-outline', linkMarkerCircle, { fill: 'none' }],
  ['diamond', linkMarkerDiamond],
  ['diamond-outline', linkMarkerDiamond, { fill: 'none' }],
  ['line', linkMarkerLine],
  ['cross', linkMarkerCross],
  ['fork', linkMarkerFork],
  ['fork-outline', linkMarkerFork, { fill: 'none' }],
  ['fork-close', linkMarkerForkClose],
  ['fork-close-outline', linkMarkerForkClose, { fill: 'none' }],
  ['many', linkMarkerMany],
  ['many-optional', linkMarkerManyOptional],
  ['one', linkMarkerOne],
  ['one-optional', linkMarkerOneOptional],
  ['one-or-many', linkMarkerOneOrMany],
] as const;

function buildPortMap(side: 'left' | 'right'): Record<string, ElementPort> {
  const cx = side === 'right' ? 'calc(w)' : '0';
  const ports: Record<string, ElementPort> = {};
  for (const [index, [name]] of MARKER_ENTRIES.entries()) {
    ports[name] = {
      cx,
      cy: PADDING + index * PORT_GAP,
      shape: 'rect',
      width: PORT_SIZE,
      height: PORT_SIZE,
      color: PRIMARY,
      outline: PRIMARY,
    };
  }
  return ports;
}

const elementHeight = PADDING * 2 + (MARKER_ENTRIES.length - 1) * PORT_GAP;

const initialElements: readonly ElementRecord[] = [
  {
    id: 'left',
    type: 'element',
    data: {},
    position: { x: 50, y: 30 },
    size: { width: ELEMENT_WIDTH, height: elementHeight },
    portMap: buildPortMap('right'),
  },
  {
    id: 'right',
    type: 'element',
    data: {},
    position: { x: 50 + ELEMENT_WIDTH + ELEMENT_GAP, y: 30 },
    size: { width: ELEMENT_WIDTH, height: elementHeight },
    portMap: buildPortMap('left'),
  },
];

function buildLinks(scale: number): LinkRecord[] {
  return MARKER_ENTRIES.map(([name, factory, extraOptions]) => {
    const marker = factory({ scale, ...extraOptions });
    return {
      id: name,
      type: 'link',
      source: { id: 'left', port: name },
      target: { id: 'right', port: name },
      style: {
        width: 2,
        sourceMarker: marker,
        targetMarker: marker,
      },
      labelMap: {
        label: {
          text: name,
          color: LABEL_TEXT_COLOR,
          backgroundColor: LABEL_BODY_COLOR,
          backgroundOutline: LABEL_STROKE_COLOR,
          backgroundBorderRadius: 4,
          fontSize: 10,
        },
      },
    };
  });
}

function RenderElement() {
  return <HTMLBox className="jj-node" useModelGeometry />;
}

export default function App() {
  const [scale, setScale] = useState(1);
  const [links, setLinks] = useState<LinkRecord[]>(() => buildLinks(1));

  const cells = useMemo<readonly CellRecord[]>(() => [...initialElements, ...links], [links]);

  const handleScaleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextScale = Number(event.target.value);
    setScale(nextScale);
    setLinks(buildLinks(nextScale));
  }, []);

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <label className="jj-field">
          <span className="jj-label">Scale</span>
          <input
            className="w-40"
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={scale}
            onChange={handleScaleChange}
          />
        </label>
        <span className="jj-chip">{scale.toFixed(1)}×</span>
      </div>
      <GraphProvider cells={cells}>
        <Paper className="min-h-0 flex-1" renderElement={RenderElement} linkRouting={SMOOTH_LINKS} />
      </GraphProvider>
    </div>
  );
}
