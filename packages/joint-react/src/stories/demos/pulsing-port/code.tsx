/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useId, useRef } from 'react';
import { dia, highlighters, linkTools, V } from '@joint/core';
import type { ElementRecord, ElementRecordPort } from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY, LIGHT, BG, SECONDARY } from 'storybook-config/theme';
import {
  GraphProvider,
  jsx,
  Paper,
  SVGText,
  usePaperEvents,
  useLinks,
  useMeasureNode,
  useElementId,
  DefaultElement,
} from '@joint/react';
import { Default } from './story';

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

const NODE_PORTS: Record<string, ElementRecordPort> = {
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

const elements: Record<string, ElementRecord> = {
  '1': { position: { x: 50, y: 50 }, ports: NODE_PORTS },
  '2': { position: { x: 350, y: 50 }, ports: NODE_PORTS },
  '3': { position: { x: 150, y: 250 }, ports: NODE_PORTS },
};

function NodeElement() {
  const id = useElementId();
  const rectRef = useRef<SVGRectElement>(null);
  const { width, height } = useMeasureNode(rectRef);

  const isConnected = useLinks((links) =>
    [...links.values()].some((link) => {
      return link.source?.id === id || link.target?.id === id;
    })
  );

  return (
    <DefaultElement
      label={id}
      style={{
        borderColor: isConnected ? PRIMARY : '',
        minWidth: 100,
        minHeight: 50,
      }}
    />
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
        color: PRIMARY,
        targetMarker: 'arrow',
      }}
      width="100%"
      renderElement={NodeElement}
      className={`${PAPER_CLASSNAME} h-[400px]`}
      sorting={dia.Paper.sorting.APPROX}
      linkPinning={false}
      validateConnection={(cellViewS, magnetS, cellViewT, magnetT) => {
        if (cellViewS === cellViewT) return false;
        if (!magnetS || !magnetT) return false;
        // Prevent linking to output ports.
        return magnetT.getAttribute('port') === 'in';
      }}
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
    <GraphProvider elements={elements}>
      <Main />
    </GraphProvider>
  );
}
