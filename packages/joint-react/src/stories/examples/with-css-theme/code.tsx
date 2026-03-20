/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useState, useCallback, useRef } from 'react';
import {
    GraphProvider,
    Paper,
    useElementLayout,
    useLinkDefaults,
    type FlatElementData,
    type FlatLinkData,
    type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

// Base theme — provides --joint-* CSS variable defaults
import '../../../css/theme.css';

// Plain CSS overrides for light/dark (no Tailwind)
import './theme-overrides.css';

interface NodeData extends FlatElementData {
    label: string;
}

const initialElements: Record<string, NodeData> = {
    a: { label: 'Source', x: 50, y: 60, width: 120, height: 50 },
    b: { label: 'Process', x: 280, y: 20, width: 120, height: 50 },
    c: { label: 'Review', x: 280, y: 120, width: 120, height: 50 },
    d: { label: 'Output', x: 510, y: 60, width: 120, height: 50 },
};

// Links: no explicit color/width — CSS variables provide styling.
// One link overrides color to show per-link precedence.
const initialLinks: Record<string, FlatLinkData> = {
    'a→b': { source: 'a', target: 'b' },
    'a→c': { source: 'a', target: 'c' },
    'b→d': {
        source: 'b',
        target: 'd',
        labels: { info: { text: 'approved' } },
    },
    'c→d': {
        source: 'c',
        target: 'd',
        color: '#0075f2', // explicit override — inline style beats CSS variables
        width: 3,
    },
};

function Node({ label }: Readonly<{ label: string }>) {
    const { width, height } = useElementLayout();
    return (
        <>
            <rect
                width={width}
                height={height}
                rx="8"
                fill="var(--node-bg)"
                stroke="var(--node-stroke)"
                strokeWidth="1.5"
            />
            <text
                x={width / 2}
                y={height / 2}
                dominantBaseline="middle"
                textAnchor="middle"
                fill="var(--node-text)"
            >
                {label}
            </text>
        </>
    );
}

function Diagram() {
    const [elements, setElements] = useState(initialElements);
    const [links, setLinks] = useState(initialLinks);
    const [isDark, setIsDark] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { mapDataToLinkAttributes } = useLinkDefaults({
        targetMarker: 'arrow',
    });

    const renderElement: RenderElement<NodeData> = useCallback(
        (data) => <Node label={data.label} />,
        [],
    );

    const toggleTheme = useCallback(() => {
        setIsDark((previous) => {
            const next = !previous;
            wrapperRef.current?.classList.toggle('dark', next);
            return next;
        });
    }, []);

    return (
        <div ref={wrapperRef}>
            <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                    type="button"
                    onClick={toggleTheme}
                    style={{
                        padding: '4px 12px',
                        cursor: 'pointer',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        background: isDark ? '#1e293b' : '#fff',
                        color: isDark ? '#e2e8f0' : '#1e293b',
                    }}
                >
                    {isDark ? 'Light mode' : 'Dark mode'}
                </button>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Links inherit color from <code>--joint-link-color</code>.
                    The blue link overrides via <code>color</code> prop.
                </span>
            </div>
            <GraphProvider
                elements={elements}
                links={links}
                onElementsChange={setElements}
                onLinksChange={setLinks}
                mapDataToLinkAttributes={mapDataToLinkAttributes}
            >
                <Paper
                    className={PAPER_CLASSNAME}
                    style={{ background: 'var(--paper-bg)' }}
                    height={240}
                    renderElement={renderElement}
                />
            </GraphProvider>
        </div>
    );
}

export default function App() {
    return <Diagram />;
}
