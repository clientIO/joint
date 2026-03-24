
import {
    GraphProvider,
    Paper,
    type FlatLinkData,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

// Base theme — provides --jr-* CSS variable defaults (including element styles)
import '../../../css/theme.css';

const initialElements = {
  a: {
    // No width or height — element should size to fit label
    label: 'Lorem ipsum',
    x: 100,
    y: 60,
    ports: { out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' } },
  },
  b: {
    // Explicit width - height is still determined by content
    width: 100,
    label: 'dolor sit amet',
    x: 280,
    y: 60,
    ports: {
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' },
      in: { cx: 0, cy: 'calc(0.5 * h)' },
    },
  },
  c: {
    // Explicit width and height - content should be clipped
    label: 'consectetur adipiscing elit',
    x: 450,
    y: 60,
    width: 100,
    height: 80,
    ports: { in: { cx: 0, cy: 'calc(0.5 * h)', passive: true } },
  },
};

const initialLinks: Record<string, FlatLinkData> = {
    'a-b': {
        source: 'a',
        sourcePort: 'out',
        target: 'b',
        targetPort: 'in',
        targetMarker: 'arrow',
    },
    'b-c': {
        source: 'b',
        sourcePort: 'out',
        target: 'c',
        targetPort: 'in',
        targetMarker: 'arrow',
    },
};

export default function App() {
    return (
        <GraphProvider elements={initialElements} links={initialLinks}>
            <Paper
                className={PAPER_CLASSNAME}
                style={{ backgroundColor: '#EFF2F5' }}
                height={240}
            />
        </GraphProvider>
    );
}
