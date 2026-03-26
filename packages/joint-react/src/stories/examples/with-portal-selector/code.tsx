/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import '../index.css';
import { dia, highlighters, g, util, V } from '@joint/core';
import {
  GraphProvider,
  Paper,
  useGraph,
  usePaper,
  usePaperEvents,
  useMeasureNode,
  useElementSize,
  useFlatElementData,
  useFlatLinkData,
  type CellId,
  type FlatElementData,
  type FlatLinkData,
  type PaperProps,
  type RenderElement,
  PORTAL_ELEMENT_TYPE,
  // PortalLinkView,
  // type LinkMarkerName,
} from '@joint/react';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

// ============================================================================
// Types & Constants
// ============================================================================

const PAPER_CLASSNAME = 'border-1 border-gray-300 rounded-lg shadow-md overflow-hidden p-2 mr-2';

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;

interface ElementUserData {
  readonly [key: string]: unknown;
  readonly type?: 'default' | 'error' | 'info';
  readonly title?: string;
  readonly color?: string;
  readonly jjType?: string;
}

interface LinkUserData {
  readonly [key: string]: unknown;
  readonly jjType?: string;
}

const PAPER_PROPS: PaperProps = {
  defaultAnchor: {
    name: 'midSide',
    args: {
      rotate: true,
      useModelGeometry: true,
    },
  },
  defaultConnectionPoint: {
    name: 'anchor',
    args: {
      offset: 0,
      useModelGeometry: true,
    },
  },
  defaultConnector: {
    name: 'straight',
    args: {
      cornerType: 'line',
      cornerPreserveAspectRatio: true,
      useModelGeometry: true,
    },
  },
  defaultRouter: {
    name: 'rightAngle',
    args: {
      direction: 'right',
      useModelGeometry: true,
    },
  },
  measureNode: (node, view) => {
    if (node === view.el) {
      const size = (view.model as dia.Element).size();
      return new g.Rect(0, 0, size.width, size.height);
    }
    return V(node).getBBox();
  },
};

// ============================================================================
// Data
// ============================================================================

const elements: Record<string, FlatElementData<ElementUserData>> = {
  '1': {
    data: { title: 'This is error element' },
    x: 50,
    y: 110,
    angle: 30,
  },
  '2': {
    data: { title: 'This is info element' },
    x: 550,
    y: 110,
  },
  '3': {
    data: { color: '#f87171' },
    x: 50,
    y: 370,
  },
  '4': {
    data: { jjType: 'standard.Cylinder', color: '#60a5fa' },
    x: 550,
    y: 370,
    width: 100,
    height: 150,
  },
};

// Links now use built-in theme properties: color, width, sourceMarker, targetMarker
const links: Record<string, FlatLinkData<LinkUserData>> = {
  link1: {
    source: '1',
    target: '2',
    width: 4,
    color: 'orange',
    // targetMarker: 'arrow' as LinkMarkerName,
    className: 'dashed-link',
  },
  link2: {
    source: '3',
    target: '4',
    color: 'green',
    // sourceMarker: 'circle' as LinkMarkerName,
    // targetMarker: 'cross' as LinkMarkerName,
  },
  link3: {
    data: { jjType: 'standard.ShadowLink' },
    source: '2',
    target: '4',
    color: 'purple',
  },
};

// ============================================================================
// Helpers
// ============================================================================

function nodeSizeToModelSize({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const padding = 20;
  return {
    x,
    y,
    width: width + padding,
    height: height + padding,
  };
}

// ============================================================================
// Shapes
// ============================================================================

function Shape({
  color = 'lightgray',
  title = 'No Title',
}: Readonly<{
  color?: string;
  title?: string;
}>) {
  const textRef = useRef<SVGTextElement>(null);
  const { width, height } = useMeasureNode(textRef, {
    transform: nodeSizeToModelSize,
  });

  return (
    <>
      <ellipse rx={width / 2} ry={height / 2} cx={width / 2} cy={height / 2} fill={color} />
      <text
        ref={textRef}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 14, fill: 'black' }}
      >
        {title}
      </text>
    </>
  );
}

function MinimapShape({ color = 'lightgray' }: Readonly<ElementUserData>) {
  const { width, height } = useElementSize();
  return <rect width={width} height={height} fill={color} rx={10} ry={10} />;
}

// ============================================================================
// Minimap
// ============================================================================

function MiniMap({ paper }: Readonly<{ paper: dia.Paper }>) {
  const renderElement: RenderElement<ElementUserData> = useCallback(
    ({ color = 'white' }) => <MinimapShape color={color} />,
    []
  );

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const { width, height } = paper.getComputedSize();
    const nextScale = Math.min(MINIMAP_WIDTH / width, MINIMAP_HEIGHT / height);
    setScale(nextScale); // eslint-disable-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect -- Derive scale from paper dimensions
  }, [paper]);

  return (
    <div
      className="absolute bg-black bottom-6 right-6 border border-[#dde6ed] rounded-lg overflow-hidden"
      style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
    >
      <Paper
        {...PAPER_PROPS}
        interactive={false}
        height="100%"
        scale={scale}
        renderElement={renderElement}
      />
    </div>
  );
}

// ============================================================================
// Selection
// ============================================================================

function Selection({ selectedId }: { selectedId: CellId | null }) {
  const { paper } = usePaper();
  const { graph } = useGraph();

  useEffect(() => {
    highlighters.mask.removeAll(paper);

    if (!selectedId) return;

    const cell = graph.getCell(selectedId);
    if (!cell) return;

    const view = paper.findViewByModel(cell);
    highlighters.mask.add(view, 'root', 'selection', {
      padding: 8,
      layer: dia.Paper.Layers.FRONT,
    });
  }, [graph, paper, selectedId]);

  return null;
}

// ============================================================================
// Main
// ============================================================================

function Badge({
  x = 0,
  y = 0,
  size = 10,
  color = 'red',
}: Readonly<{ x?: number; y?: number; size?: number; color?: string }>) {
  return (
    <>
      <circle cx={x} cy={y} r={size} fill={color} />
      <text
        x={x}
        y={y}
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="12"
        fill="white"
        fontWeight="bold"
      >
        !
      </text>
    </>
  );
}

function RenderElementWithBadge({
  jjType,
  color = 'lightgray',
  title = 'No Title',
}: Readonly<ElementUserData>) {
  const { width } = useElementSize();
  return (
    <>
      {jjType ?? <Shape color={color} title={title} />}
      <Badge x={width + 10} y={-10} size={10} color={color} />
    </>
  );
}

function Main() {
  const paperId = useId();
  const [paper, setPaper] = useState<dia.Paper | null>(null);
  const [showMinimap, setShowMinimap] = useState(false);
  const [selectedElement, setSelectedElement] = useState<CellId | null>(null);

  const renderElement = useCallback((data: ElementUserData) => {
    return <RenderElementWithBadge {...data} />;
  }, []);

  const { graph } = useGraph();

  usePaperEvents(
    paperId,
    {
      'element:pointerclick': (elementView) =>
        setSelectedElement((elementView.model.id as CellId) ?? null),
      'element:pointerdblclick': (elementView) => {
        const cell = elementView.model;
        cell.clone().translate(10, 10).addTo(cell.graph);
      },
      'blank:pointerclick': () => setSelectedElement(null),
    },
    [setSelectedElement]
  );

  return (
    <div className="flex flex-col relative w-full h-full">
      <Paper
        id={paperId}
        {...PAPER_PROPS}
        ref={setPaper}
        className={PAPER_CLASSNAME}
        height="calc(100vh - 100px)"
        snapLinks={{ radius: 25 }}
        renderElement={renderElement}
        // linkView={PortalLinkView}
        onViewPostponed={() => false}
        // elementView={PortalElementView}
        validateMagnet={(_, magnet) => magnet.getAttribute('magnet') !== 'passive'}
        linkPinning={false}
        portalSelector={(cellView, defaultSelector) => {
          const type = cellView.model.get('type');
          return type === PORTAL_ELEMENT_TYPE ? defaultSelector : 'root';
        }}
      >
        <Selection selectedId={selectedElement} />
      </Paper>

      {showMinimap && paper && <MiniMap paper={paper} />}

      <button
        type="button"
        className="absolute top-2 right-6 z-10 bg-gray-900 rounded-lg p-2 shadow-md text-white text-sm"
        onClick={() => setShowMinimap((v) => !v)}
      >
        {showMinimap ? 'Hide Minimap' : 'Show Minimap'}
      </button>

      <button
        type="button"
        className="absolute top-2 left-2 z-10 bg-gray-900 rounded-lg p-2 shadow-md text-white text-sm"
        onClick={() => {
          // eslint-disable-next-line no-console
          console.log('Graph log:', graph.toJSON());
        }}
      >
        Log
      </button>
    </div>
  );
}

// ============================================================================
// App
// ============================================================================

export default function App() {
  const elementMappers = useFlatElementData<FlatElementData<ElementUserData>>({
    mapAttributes: ({ attributes, data, graph }) => {
      const userData = data.data as ElementUserData | undefined;
      const { jjType, color = 'lightgray' } = userData ?? {};
      if (!jjType) return attributes;
      const defaults = graph.getTypeDefaults(jjType);
      return {
        ...attributes,
        type: jjType,
        attrs: util.defaultsDeep(
          { body: { fill: color }, top: { fill: color } },
          defaults.attrs || {},
        ),
      };
    },
  }, []);

  const linkMappers = useFlatLinkData<FlatLinkData<LinkUserData>>({
    mapAttributes: ({ attributes, data, graph }) => {
      const userData = data.data as LinkUserData | undefined;
      const { jjType } = userData ?? {};
      if (!jjType) return attributes;
      const { color } = data;
      const defaults = graph.getTypeDefaults(jjType);
      return {
        ...attributes,
        type: jjType,
        attrs: util.defaultsDeep(
          { line: { stroke: color } },
          defaults.attrs || {},
        ),
      };
    },
  }, []);

  return (
    <GraphProvider
      elements={elements}
      links={links}
      {...elementMappers}
      {...linkMappers}
    >
      <Main />
    </GraphProvider>
  );
}
