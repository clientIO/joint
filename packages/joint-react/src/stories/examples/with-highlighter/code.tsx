/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { GraphProvider, Paper, useHighlighter, type GraphElement, type GraphLink } from '@joint/react';
import { highlighters } from '@joint/core';
import '../index.css';
import { useRef, useState, type RefObject } from 'react';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';

const initialElements: Record<string, GraphElement & { label: string }> = {
  '1': {
    label: 'Node 1',
    x: 100,
    y: 50,
    width: 125,
    height: 25,
  },
  '2': {
    label: 'Node 2',
    x: 100,
    y: 200,
    width: 120,
    height: 25,
  },
};

const initialEdges: Record<string, GraphLink> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

type HighlighterVariant = 'mask' | 'opacity' | 'custom';

interface RenderItemWithChildrenProps {
  readonly width?: number;
  readonly height?: number;
  readonly label?: string;
  readonly variant: HighlighterVariant;
}

function createHighlighterConfig(
  variant: HighlighterVariant,
  isEnabled: boolean,
  highlighterRef: RefObject<SVGRectElement | null>
): {
  readonly config: Parameters<typeof useHighlighter>[0];
} {
  if (variant === 'mask') {
    return {
      config: {
        type: 'mask',
        isEnabled,
        padding: 5,
        attrs: {
          stroke: SECONDARY,
          'stroke-width': 2,
        },
        ref: highlighterRef,
      },
    };
  }

  if (variant === 'opacity') {
    return {
      config: {
        type: 'opacity',
        isEnabled,
        alphaValue: 0.5,
        target: 'root',
      },
    };
  }

  return {
    config: {
      type: 'custom',
      isEnabled,
      padding: 6,
      attrs: {
        stroke: '#f97316',
        'stroke-width': 2,
      },
      ref: highlighterRef,
      create: ({ cellView, element, highlighterId, options }) =>
        highlighters.mask.add(cellView, element, highlighterId, options),
    },
  };
}

function RenderItemWithChildren({
  height = 0,
  width = 0,
  label,
  variant,
}: Readonly<RenderItemWithChildrenProps>) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const highlighterRef = useRef<SVGRectElement | null>(null);
  const { config } = createHighlighterConfig(variant, isHighlighted, highlighterRef);
  useHighlighter(config);

  return (
    <g
      width={width}
      height={height}
      onMouseEnter={() => setIsHighlighted(true)}
      onMouseLeave={() => setIsHighlighted(false)}
      className="node"
    >
      <rect ref={highlighterRef} rx={10} ry={10} width={width} height={height} fill={PRIMARY} />
      <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="middle" fill="#fff">
        {label ?? 'Node'} ({variant})
      </text>
    </g>
  );
}
interface MainProps {
  readonly variant: HighlighterVariant;
}

function Main({ variant }: Readonly<MainProps>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={(data) => <RenderItemWithChildren {...data} variant={variant} />}
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
