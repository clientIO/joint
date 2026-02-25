/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useRef } from 'react';
import { dia, highlighters, linkTools, V } from '@joint/core';
import { shapes } from '@joint/core';
import type { ElementToGraphOptions, GraphElement } from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY, LIGHT, BG } from 'storybook-config/theme';
import {
  getCellId,
  GraphProvider,
  jsx,
  Paper,
  TextNode,
  useLinks,
  useNodeSize,
  useCellId,
  flatMapper,
} from '@joint/react';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 55;
const NODE_BORDER_RADIUS = 10;
const PORT_SIZE = 20;
const unit = 10;

const Pulse = dia.HighlighterView.extend({
  tagName: 'g',
  attributes: {
    'pointer-events': 'none',
  },
  children() {
    const { radius = PORT_SIZE / 2 } = this.options;

    return jsx(
      <circle fill="none" r={radius} stroke={LIGHT} strokeWidth={2}>
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

const NODE_PORTS = {
  items: [
    {
      id: 'in',
      args: { x: NODE_WIDTH / 2, y: 0 },
      attrs: { circle: { magnet: true }, text: { display: 'none' } },
    },
    {
      id: 'out',
      args: { x: NODE_WIDTH / 2, y: NODE_HEIGHT },
      attrs: { circle: { magnet: true }, text: { display: 'none' } },
    },
  ],
};

const mapDataToElementAttributes = (
  options: ElementToGraphOptions<GraphElement>
): dia.Cell.JSON => {
  const result = flatMapper.mapDataToElementAttributes(options);
  return {
    ...result,
    ports: NODE_PORTS,
  };
};

const elements: Record<string, GraphElement> = {
  '1': { x: 50, y: 50 },
  '2': { x: 350, y: 50 },
  '3': { x: 150, y: 250 },
};

function NodeElement(_props: Readonly<GraphElement>) {
  const id = useCellId();
  const rectRef = useRef<SVGRectElement>(null);
  const { width, height } = useNodeSize(rectRef);

  const isConnected = useLinks((links) =>
    Object.values(links).some((link) => {
      const sourceId = getCellId(link.source);
      const targetId = getCellId(link.target);
      return sourceId === id || targetId === id;
    })
  );

  return (
    <>
      <rect
        ref={rectRef}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        stroke={PRIMARY}
        strokeWidth={2}
        strokeDasharray={isConnected ? '0' : '5,5'}
        fill={isConnected ? PRIMARY : BG}
        rx={NODE_BORDER_RADIUS}
        ry={NODE_BORDER_RADIUS}
      />
      <TextNode fill="white" x={width / 2} y={height / 2 + 4} textAnchor="middle" fontSize={16}>
        {id}
      </TextNode>
    </>
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
  return (
    <Paper
      defaultLink={() => new shapes.standard.Link({ attrs: { line: { stroke: LIGHT } } })}
      renderElement={NodeElement}
      className={PAPER_CLASSNAME}
      sorting={dia.Paper.sorting.APPROX}
      linkPinning={false}
      validateConnection={(cellViewS, magnetS, cellViewT, magnetT) => {
        if (cellViewS === cellViewT) return false;
        if (!magnetS || !magnetT) return false;
        // Prevent linking to output ports.
        return magnetT.getAttribute('port') === 'in';
      }}
      onLinkMouseEnter={({ linkView }) => linkView.addTools(toolsView)}
      onLinkMouseLeave={({ linkView }) => linkView.removeTools()}
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
      defaultRouter={{
        name: 'rightAngle',
        args: {
          margin: unit,
        },
      }}
      defaultConnector={{
        name: 'straight',
        args: { cornerType: 'line', cornerPreserveAspectRatio: true },
      }}
      snapLinks={{ radius: 25 }}
      validateMagnet={(_cellView, magnet) => {
        return magnet.getAttribute('magnet') !== 'passive';
      }}
    />
  );
}

export default function App() {
  return (
    <GraphProvider elements={elements} mapDataToElementAttributes={mapDataToElementAttributes}>
      <Main />
    </GraphProvider>
  );
}
