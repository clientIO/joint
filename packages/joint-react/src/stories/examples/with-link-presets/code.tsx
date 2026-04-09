import { useEffect, useState } from 'react';
import { GraphProvider, Paper, HTMLBox, type ElementRecord, type ElementPort, type LinkRecord, usePaper } from '@joint/react';
import { directLinks, orthogonalLinks, curveLinks } from '../../../presets';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
import '../index.css';
import type { dia } from '@joint/core';

interface NodeData {
  readonly label: string;
  readonly [key: string]: unknown;
}

const PORT_OUT: ElementPort = { cx: 'calc(w)', cy: 'calc(h/2)', width: 16, height: 16 };
const PORT_IN: ElementPort = { cx: 0, cy: 'calc(h/2)', passive: true, width: 16, height: 16 };
const PORT_ERROR: ElementPort = { cx: 'calc(w/2)', cy: 'calc(h)', width: 16, height: 16, attrs: { body: { fill: 'red' } } };

const initialElements: Record<string, ElementRecord<NodeData>> = {
  a: {
    data: { label: 'Node A' },
    position: { x: 50, y: 50 },
    size: { width: 120, height: 60 },
    portMap: { out: PORT_OUT, error: PORT_ERROR },
  },
  b: {
    data: { label: 'Node B' },
    position: { x: 350, y: 50 },
    size: { width: 120, height: 60 },
    portMap: { in: PORT_IN, out: PORT_OUT },
  },
  c: {
    data: { label: 'Node C' },
    position: { x: 200, y: 200 },
    size: { width: 120, height: 60 },
  },
  d: {
    data: { label: 'Node D' },
    position: { x: 500, y: 200 },
    size: { width: 120, height: 60 },
  },
};

const initialLinks: Record<string, LinkRecord> = {
  'a-b': {
    source: { id: 'a', port: 'out' },
    target: { id: 'b', port: 'in' },
    style: { color: PRIMARY, targetMarker: 'arrow' },
  },

  'c-d': {
    source: { id: 'c' },
    target: { id: 'd' },
    style: { color: SECONDARY, targetMarker: 'arrow' },
  },
};

const PRESETS = {
  direct: directLinks,
  orthogonal: orthogonalLinks,
  curve: curveLinks,
} as const;

type PresetName = keyof typeof PRESETS;

function RenderElement({ label }: Readonly<NodeData>) {
  return <HTMLBox useModelGeometry>{label}</HTMLBox>;
}

const TOOLBAR_STYLE = {
  display: 'flex',
  gap: 12,
  marginBottom: 8,
  alignItems: 'center',
  fontFamily: 'sans-serif',
  fontSize: 14,
} as const;

const LABEL_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  cursor: 'pointer',
} as const;


function PresetPicker() {
  const [preset, setPreset] = useState<PresetName>('curve');
  const { paper } = usePaper('main-paper');

  useEffect(() => {
      for (const link of paper?.model.getLinks() ?? []) {
        const linkView = paper.findViewByModel(link) as dia.LinkView | null;
        if (linkView) {
          linkView.requestConnectionUpdate();
        }
      }
    }, [preset, paper]
  );

  return (
    <>
      <div style={TOOLBAR_STYLE}>
        <span style={{ fontWeight: 600 }}>Link style:</span>
        {(Object.keys(PRESETS) as PresetName[]).map((name) => (
          <label key={name} style={LABEL_STYLE}>
            <input
              type="radio"
              name="preset"
              value={name}
              checked={preset === name}
              onChange={() => setPreset(name)}
            />
            {name}
          </label>
        ))}
      </div>
      <Paper
        id="main-paper"
        className={PAPER_CLASSNAME}
        height={340}
        renderElement={RenderElement}
        {...PRESETS[preset]}
      />
    </>
  );
}

export default function App() {
  return (
    <div>
      <GraphProvider elements={initialElements} links={initialLinks}>
        <PresetPicker />
      </GraphProvider>
    </div>
  );
}
