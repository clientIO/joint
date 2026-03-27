/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { GraphProvider, Paper, useMarkup, useElementSize, type FlatElementData, type FlatLinkData, type PortalPaper, usePaperEvents } from '@joint/react';
import { type dia, highlighters } from '@joint/core';
import '../index.css';
import { useId, useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialElements: Record<string, FlatElementData<NodeData>> = {
  '1': {
    data: { label: 'Node 1' },
    x: 100,
    y: 50,
    width: 125,
    height: 25,
  },
  '2': {
    data: { label: 'Node 2' },
    x: 100,
    y: 200,
    width: 120,
    height: 25,
  },
};

const initialEdges: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

type HighlighterVariant = 'mask' | 'opacity';

function RenderElement({ label }: Readonly<NodeData>) {
  const { selectorRef } = useMarkup();
  const { width, height } = useElementSize();
  return (
    <g width={width} height={height} className="node">
      <rect ref={selectorRef('body')} rx={10} ry={10} width={width} height={height} fill={PRIMARY} />
      <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="middle" fill="#fff">
        {label ?? 'Node'}
      </text>
    </g>
  );
}

interface MainProps {
  readonly variant: HighlighterVariant;
}

function addHighlighter(variant: HighlighterVariant, elementView: dia.ElementView) {
  switch (variant) {
    case 'mask': {
      highlighters.mask.add(elementView, 'body', 'hover', {
        padding: 5,
        attrs: {
          stroke: SECONDARY,
          'stroke-width': 2,
        },
      });
      break;
    }
    case 'opacity': {
      highlighters.opacity.add(elementView, 'root', 'hover', {
        alphaValue: 0.5,
      });
      break;
    }
  }
}

function removeHighlighter(variant: HighlighterVariant, elementView: dia.ElementView) {
  switch (variant) {
    case 'mask': {
      highlighters.mask.remove(elementView, 'hover');
      break;
    }
    case 'opacity': {
      highlighters.opacity.remove(elementView, 'hover');
      break;
    }
  }
}

function Main({ variant }: Readonly<MainProps>) {
  const paperId = useId();
  const paperRef = useRef<dia.Paper | null>(null);

  usePaperEvents(
    paperId,
    {
      'element:mouseenter': (elementView) => addHighlighter(variant, elementView),
      'element:mouseleave': (elementView) => removeHighlighter(variant, elementView),
    },
    [variant]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        id={paperId}
        ref={paperRef}
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={RenderElement}
      />
    </div>
  );
}

export interface AppProps {
  readonly variant?: HighlighterVariant;
}

export default function App({ variant = 'mask' }: Readonly<AppProps>) {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main variant={variant} />
    </GraphProvider>
  );
}
