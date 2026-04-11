import type { LinkRecord, ElementRecord, ElementPort } from '@joint/react';
import { GraphProvider, Paper, HTMLBox } from '@joint/react';
import { straightLinks } from '@joint/react/presets';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import type { LinkMarkerName } from '../../../theme/markers';
import { linkMarkerShapes } from '../../../theme/markers';

const PORT_GAP = 30;
const PORT_SIZE = 8;
const ELEMENT_WIDTH = 80;
const ELEMENT_GAP = 200;
const PADDING = 40;

const STRAIGHT_LINKS = straightLinks();

const markerNames = Object.keys(linkMarkerShapes).filter(
  (name) => name !== 'none'
) as LinkMarkerName[];

function buildPortMap(side: 'left' | 'right'): Record<string, ElementPort> {
  const cx = side === 'right' ? 'calc(w)' : '0';
  const ports: Record<string, ElementPort> = {};
  for (const [index, name] of markerNames.entries()) {
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

const elementHeight = PADDING * 2 + (markerNames.length - 1) * PORT_GAP;

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

const links: Record<string, LinkRecord> = {};
for (const name of markerNames) {
  links[name] = {
    source: { id: 'left', port: name },
    target: { id: 'right', port: name },
    style: {
      width: 2,
      sourceMarker: name,
      targetMarker: name,
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

function RenderElement() {
  return <HTMLBox useModelGeometry />;
}

export default function App() {
  return (
    <GraphProvider elements={elements} links={links}>
      <Paper
        scale={2}
        className={`${PAPER_CLASSNAME} h-[1400px]`}
        width="100%"
        drawGrid={false}
        renderElement={RenderElement}
        {...STRAIGHT_LINKS}
      />
    </GraphProvider>
  );
}
