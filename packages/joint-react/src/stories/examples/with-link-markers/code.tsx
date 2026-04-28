import { useCallback, useMemo, useState, type ChangeEvent } from 'react';
import type { CellRecord, ElementPort, ElementRecord, LinkRecord } from '@joint/react';
import { GraphProvider, Paper, HTMLBox } from '@joint/react';
import { linkMarkerArrow, linkMarkerArrowOpen, linkMarkerArrowSunken, linkMarkerArrowQuill, linkMarkerArrowDouble, linkMarkerCircle, linkMarkerDiamond, linkMarkerLine, linkMarkerCross, linkMarkerFork, linkMarkerForkClose, linkMarkerMany, linkMarkerManyOptional, linkMarkerOne, linkMarkerOneOptional, linkMarkerOneOrMany, linkRoutingSmooth } from '@joint/react/presets';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

const PORT_GAP = 30;
const PORT_SIZE = 8;
const ELEMENT_WIDTH = 80;
const ELEMENT_GAP = 200;
const PADDING = 40;

const SMOOTH_LINKS = linkRoutingSmooth();

// Each entry: [display name, factory function, extra opts for outline variant]
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

const initialElements: ElementRecord[] = [
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
  const result: LinkRecord[] = [];
  for (const entry of MARKER_ENTRIES) {
    const [name, factory, extraOptions] = entry;
    const marker = factory({ scale, ...extraOptions });
    result.push({
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
          backgroundBorderRadius: 4,
          fontSize: 10,
        },
      },
    });
  }
  return result;
}

function RenderElement() {
  return <HTMLBox useModelGeometry />;
}

export default function App() {
  const [scale, setScale] = useState(1);
  const [links, setLinks] = useState<LinkRecord[]>(() => buildLinks(scale));

  const cells = useMemo<readonly CellRecord[]>(() => [...initialElements, ...links], [links]);

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    setLinks(buildLinks(newScale));
  };

  const handleScaleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => handleScaleChange(Number(event.target.value)),
    []
  );

  return (
    <div>
      <div className="flex items-center gap-3 px-3 py-2 mt-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-sans select-none">
        <label className="flex items-center gap-2 text-slate-600">
          <span className="text-xs font-semibold">Scale</span>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={scale}
            onChange={handleScaleInputChange}
            className="w-40"
          />
          <span className="text-xs w-8">{scale.toFixed(1)}</span>
        </label>
      </div>
      <GraphProvider cells={cells}>
        <Paper
          transform={`scale(1.7)`}
          className={`${PAPER_CLASSNAME} h-[1400px]`}
          width="100%"
          drawGrid={false}
          renderElement={RenderElement}
          linkRouting={SMOOTH_LINKS}
        />
      </GraphProvider>
    </div>
  );
}
