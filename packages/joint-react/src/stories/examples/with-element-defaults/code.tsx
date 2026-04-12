import { GraphProvider, Paper, HTMLBox, PortalElement, PortalLink, type ElementRecord, type LinkRecord } from '@joint/react';
import { elementPort, linkLabel, linkStyle } from '@joint/react/presets';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
import '../index.css';

// ── Custom element with native JointJS `ports` in defaults ──────────────

class PortsElement extends PortalElement {
  defaults() {
    return {
      ...super.defaults(),
      type: 'PortsElement',
      ports: {
        groups: {
          in: { position: { name: 'left' }, ...elementPort({ width: 10, height: 10, color: SECONDARY, passive: true }) },
          out: { position: { name: 'right' }, ...elementPort({ width: 10, height: 10, color: PRIMARY }) },
        },
        items: [
          { id: 'in1', group: 'in' },
          { id: 'out1', group: 'out' },
        ],
      },
    };
  }
}

// ── Custom element with `portMap` in defaults ───────────────────────────

class PortMapElement extends PortalElement {
  defaults() {
    return {
      ...super.defaults(),
      type: 'PortMapElement',
      // @todo does not work
      portMap: {
        in: { cx: 0, cy: 'calc(0.5 * h)', width: 10, height: 10, color: SECONDARY, passive: true },
        out: { cx: 'calc(w)', cy: 'calc(0.5 * h)', width: 10, height: 10, color: PRIMARY },
      },
    };
  }
}

// ── Custom link with native JointJS `labels` in defaults ────────────────

class LabelsLink extends PortalLink {
  defaults() {
    return {
      ...super.defaults(),
      type: 'LabelsLink',
      labels: [
        {
          ...linkLabel({ text: 'native', fontSize: 10, backgroundBorderRadius: 4 }),
          position: { distance: 0.5 },
        },
      ],
      // @todo should we just use `attrs`?
      // attrs: linkStyle({ color: SECONDARY, targetMarker: 'arrow' }),
      style: { color: SECONDARY, targetMarker: 'arrow' },
    };
  }
}

// ── Custom link with `labelMap` in defaults ─────────────────────────────

class LabelMapLink extends PortalLink {
  defaults() {
    return {
      ...super.defaults(),
      type: 'LabelMapLink',
      // @todo does not work
      labelMap: {
        main: { text: 'labelMap', fontSize: 10, backgroundBorderRadius: 4 },
      },
      // @todo should we just use `attrs`?
      // attrs: linkStyle({ color: PRIMARY, targetMarker: 'arrow' }),
      style: { color: PRIMARY, targetMarker: 'arrow' },
    };
  }
}

// ── Data ────────────────────────────────────────────────────────────────

const elements: Record<string, ElementRecord> = {
  a: {
    type: 'PortsElement',
    data: { label: 'Ports (native)' },
    position: { x: 50, y: 50 },
    size: { width: 140, height: 60 },
  },
  b: {
    type: 'PortsElement',
    data: { label: 'Ports (native)' },
    position: { x: 50, y: 160 },
    size: { width: 140, height: 60 },
  },
  c: {
    type: 'PortMapElement',
    data: { label: 'PortMap' },
    position: { x: 350, y: 50 },
    size: { width: 140, height: 60 },
  },
  d: {
    type: 'PortMapElement',
    data: { label: 'PortMap' },
    position: { x: 350, y: 160 },
    size: { width: 140, height: 60 },
  },
};

const links: Record<string, LinkRecord> = {
  'a-c': {
    type: 'LabelsLink',
    source: { id: 'a', port: 'out1' },
    target: { id: 'c', port: 'in' },
  },
  'b-d': {
    type: 'LabelMapLink',
    source: { id: 'b', port: 'out1' },
    target: { id: 'd', port: 'in' },
  },
};

// ── Component ───────────────────────────────────────────────────────────

function RenderElement({ label }: { label: string }) {
  return <HTMLBox useModelGeometry>{label}</HTMLBox>;
}

export default function App() {
  return (
    <GraphProvider
      elements={elements}
      links={links}
      // @todo should this be called "types" ?
      cellNamespace={{ PortsElement, PortMapElement, LabelsLink, LabelMapLink }}
    >
      <Paper
        className={PAPER_CLASSNAME}
        height={300}
        renderElement={RenderElement}
      />
    </GraphProvider>
  );
}
