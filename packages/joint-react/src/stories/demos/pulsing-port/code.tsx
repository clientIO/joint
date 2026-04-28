/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useId } from 'react';
import { dia, highlighters, linkTools, V } from '@joint/core';
import type { CellRecordBase, ElementPort } from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { GraphProvider, jsx, Paper, usePaperEvents, useCells, useCellId, HTMLBox } from '@joint/react';

import { linkRoutingOrthogonal } from '@joint/react/presets';

const PORT_SIZE = 20;
const unit = 10;
const ORTHOGONAL_LINKS = linkRoutingOrthogonal({ cornerType: 'line', margin: unit * 2 });

const Pulse = dia.HighlighterView.extend({
  tagName: 'g',
  attributes: {
    'pointer-events': 'none',
  },
  children() {
    const { radius = PORT_SIZE / 2 } = this.options;

    return jsx(
      <circle fill="none" r={radius} stroke={PRIMARY} strokeWidth={2}>
        <animate
          attributeName="r"
          from="8"
          to="20"
          dur="1.5s"
          begin="0s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          from="1"
          to="0"
          dur="1.5s"
          begin="0s"
          repeatCount="indefinite"
        />
      </circle>
    );
  },

  highlight(elementView: dia.ElementView, node: SVGElement) {
    this.renderChildren();
    const nodeBBox = elementView.getNodeBoundingRect(node);
    const nodeMatrix = elementView.getNodeMatrix(node);
    const position = V.transformRect(nodeBBox, nodeMatrix).center();
    this.el.setAttribute('transform', `translate(${position.x}, ${position.y})`);
  },
});

const NODE_PORTS: Record<string, ElementPort> = {
  in: {
    cx: 'calc(w / 2)',
    cy: 0,
    width: PORT_SIZE,
    height: PORT_SIZE,
    color: PRIMARY,
    passive: true,
  },
  out: {
    cx: 'calc(w / 2)',
    cy: 'calc(h)',
    width: PORT_SIZE,
    height: PORT_SIZE,
    color: PRIMARY,
  },
};

const initialCells: readonly CellRecordBase[] = [
  { id: '1', type: 'element', position: { x: 50, y: 50 }, portMap: NODE_PORTS },
  { id: '2', type: 'element', position: { x: 350, y: 50 }, portMap: NODE_PORTS },
  { id: '3', type: 'element', position: { x: 150, y: 250 }, portMap: NODE_PORTS },
];

function NodeElement() {
  const id = useCellId();

  const isConnected = useCells((cells) =>
    cells.some((cell) => {
      if (cell.type !== 'link') return false;
      const { source } = cell as { source?: { id?: unknown } };
      const { target } = cell as { target?: { id?: unknown } };
      return source?.id === id || target?.id === id;
    })
  );

  return (
    <HTMLBox
      style={{
        textAlign: 'center',
        borderColor: isConnected ? PRIMARY : '',
        minWidth: 100,
        minHeight: 50,
      }}
    >
      {id}
    </HTMLBox>
  );
}

const removeTool = new linkTools.Remove({
  scale: 1.5,
  style: { stroke: '#999' },
});
const toolsView = new dia.ToolsView({
  tools: [removeTool],
});

function Main() {
  const paperId = useId();
  usePaperEvents(paperId, {
    'link:mouseenter': (linkView) => linkView.addTools(toolsView),
    'link:mouseleave': (linkView) => linkView.removeTools(),
  });

  return (
    <Paper
      id={paperId}
      defaultLink={{
        style: { color: PRIMARY, targetMarker: 'arrow' },
      }}
      width="100%"
      renderElement={NodeElement}
      className={`${PAPER_CLASSNAME} h-[400px]`}
      linkPinning={false}
      validateConnection={({ target }) => target.port === 'in'}
      markAvailable
      highlighting={{
        [dia.CellView.Highlighting.MAGNET_AVAILABILITY]: {
          name: 'pulse',
          options: {
            radius: PORT_SIZE / 2 + 4,
          },
        },
      }}
      highlighterNamespace={{
        ...highlighters,
        pulse: Pulse,
      }}
      {...ORTHOGONAL_LINKS}
      snapLinks={{ radius: 25 }}
    />
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
