import { useState } from 'react';
import type { LinkRecord, ElementRecord, ElementPort } from '@joint/react';
import { GraphProvider, Paper, HTMLBox } from '@joint/react';
import {
  linkMarkerArrow, linkMarkerArrowOpen, linkMarkerArrowSunken,
  linkMarkerArrowQuill, linkMarkerArrowDouble,
  linkMarkerCircle, linkMarkerDiamond,
  linkMarkerLine, linkMarkerCross,
  linkMarkerFork, linkMarkerForkClose,
  linkMarkerMany, linkMarkerManyOptional,
  linkMarkerOne, linkMarkerOneOptional, linkMarkerOneOrMany,
  linkRoutingSmooth,
} from '@joint/react/presets';
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

const elements: Record<string, ElementRecord> = {
  left: {
    data: {},
    position: { x: 50, y: 30 },
    size: { width: ELEMENT_WIDTH, height: elementHeight },
    portMap: buildPortMap('right'),
  },
  right: {
    data: {},
    position: { x: 50 + ELEMENT_WIDTH + ELEMENT_GAP, y: 30 },
    size: { width: ELEMENT_WIDTH, height: elementHeight },
    portMap: buildPortMap('left'),
  },
};

function buildLinks(scale: number): Record<string, LinkRecord> {
  const result: Record<string, LinkRecord> = {};
  for (const entry of MARKER_ENTRIES) {
    const [name, factory, extraOptions] = entry;
    const marker = factory({ scale, ...extraOptions });
    result[name] = {
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
    };
  }
  return result;
}

function RenderElement() {
  return <HTMLBox useModelGeometry />;
}

export default function App() {
  const [scale, setScale] = useState(1);
  const [elementState, setElementState] = useState(elements);
  const [linkState, setLinkState] = useState(() => buildLinks(scale));

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    setLinkState((previous) => {
      const next = { ...previous };
      for (const entry of MARKER_ENTRIES) {
        const [name, factory, extraOptions] = entry;
        const marker = factory({ scale: newScale, ...extraOptions });
        next[name] = { ...previous[name], style: { ...previous[name]?.style, sourceMarker: marker, targetMarker: marker } };
      }
      return next;
    });
  };

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
            onChange={(e) => handleScaleChange(Number(e.target.value))}
            className="w-40"
          />
          <span className="text-xs w-8">{scale.toFixed(1)}</span>
        </label>
      </div>
      <GraphProvider elements={elementState} links={linkState} onElementsChange={setElementState} onLinksChange={setLinkState}>
        <Paper
          scale={1.7}
          className={`${PAPER_CLASSNAME} h-[1400px]`}
          width="100%"
          drawGrid={false}
          renderElement={RenderElement}
          {...SMOOTH_LINKS}
        />
      </GraphProvider>
    </div>
  );
}
