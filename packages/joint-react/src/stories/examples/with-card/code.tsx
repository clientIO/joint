import '../../theme/tailwind-theme.css';
import { useCallback, useRef } from 'react';
import type { OnTransformElement } from '@joint/react';
import {
  GraphProvider,
  Paper,
  useMeasureNode,
  type FlatLinkData,
  type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

const sheet = new CSSStyleSheet();
document.adoptedStyleSheets = [sheet];

// 3. Create a layer with rules inside it
// You insert the entire @layer block as a single string
sheet.insertRule(
  `

@layer theme {
  /* ── Links ─────────────────────────────────────────────────────────────── */

  [joint-selector='line'] {
    stroke: var(--joint-link-color, #333333);
    stroke-width: var(--joint-link-width, 2);
    stroke-dasharray: var(--joint-link-dash);
    stroke-linecap: var(--joint-link-line-cap);
    stroke-linejoin: var(--joint-link-line-join);
  }

  :where([joint-selector='wrapper']) {
    stroke: var(--joint-link-wrapper-color, transparent);
  }

  /* ── Labels ────────────────────────────────────────────────────────────── */

  :where([joint-selector='labelText']) {
    fill: var(--joint-label-color, #333333);
    font-size: var(--joint-label-font-size, 12px);
    font-family: var(--joint-label-font-family, sans-serif);
  }

  :where([joint-selector='labelBody']) {
    fill: var(--joint-label-bg, #ffffff);
    stroke: var(--joint-label-stroke, #333333);
    stroke-width: var(--joint-label-stroke-width, 1);
  }

  /* ── Ports ──────────────────────────────────────────────────────────────── */

  :where([joint-selector='portBody']) {
    fill: var(--joint-port-color, #333333);
    stroke: var(--joint-port-stroke, transparent);
    stroke-width: var(--joint-port-stroke-width, 0);
  }

  :where(.joint-port-label) {
    fill: var(--joint-port-label-color, #333333);
  }
}
`,
  0
);

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { label: 'Node 1', x: 100, y: 10 },
  '2': { label: 'Node 2 with longer text', x: 250, y: 150 },
};

const initialEdges: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    // color: 'var(--color-pink-500)',
    strokeWidth: 'var(--stroke-8)',
    className: 'fill-none stroke-blue-500 stroke-4 [stroke-dasharray:12_8]',

    sourceMarker: 'arrow-open',
  },
};

type BaseElementWithData = (typeof initialElements)[string];

function Card({ label }: Readonly<Partial<BaseElementWithData>>) {
  const contentRef = useRef<HTMLDivElement>(null);
  const gap = 10;
  const imageWidth = 50;
  const transformSize: OnTransformElement = useCallback(
    ({ x, y, width: measuredWidth, height: measuredHeight }) => {
      return {
        width: gap + imageWidth + gap + measuredWidth + gap,
        height: gap + Math.max(measuredHeight, imageWidth) + gap,
        x,
        y,
      };
    },
    []
  );
  const { width, height } = useMeasureNode(contentRef, {
    transform: transformSize,
  });

  const imageHeight = height - 2 * gap;
  const iconURL = `https://placehold.co/${imageWidth}x${imageHeight}`;
  const foWidth = Math.max(width - 2 * gap - imageWidth - gap, 0);
  const foHeight = Math.max(height - 2 * gap, 0);

  return (
    <>
      <rect width={width} height={height} fill="#333" stroke="#eee" strokeWidth="2"></rect>
      {imageHeight > 0 && (
        <image href={iconURL} x={gap} y={gap} width={imageWidth} height={imageHeight} />
      )}
      <foreignObject x={gap + imageWidth + gap} y={gap} width={foWidth} height={foHeight}>
        <div
          ref={contentRef}
          style={{
            position: 'absolute',
            color: '#eee',
            maxWidth: '100px',
            overflow: 'hidden',
            overflowWrap: 'break-word',
          }}
        >
          {label}
        </div>
      </foreignObject>
    </>
  );
}

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback((data) => {
    return <Card label={data.label} />;
  }, []);
  return <Paper className={PAPER_CLASSNAME} height={280} renderElement={renderElement} />;
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
