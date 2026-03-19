import { useState, useCallback } from 'react';
import {
    GraphProvider,
    Paper,
    useElementDefaults,
    useThemeLinkMapper,
    type FlatElementData,
    type FlatElementPort,
    type FlatLinkData,
    type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY, LIGHT } from 'storybook-config/theme';

interface NodeData extends FlatElementData {
    label: string;
    kind: 'source' | 'process' | 'sink';
}

// Minimal persisted data — no ports, no styling.
// Ports and theme are provided by useElementDefaults based on element kind.
const initialElements: Record<string, NodeData> = {
    a: { label: 'Start', kind: 'source', x: 50, y: 140, width: 100, height: 40 },
    b: { label: 'Process', kind: 'process', x: 250, y: 50, width: 100, height: 40 },
    c: { label: 'Review', kind: 'process', x: 250, y: 230, width: 100, height: 40 },
    d: { label: 'Done', kind: 'sink', x: 480, y: 140, width: 100, height: 40 },
};

const initialLinks: Record<string, FlatLinkData> = {
    'a-b': { source: 'a', target: 'b', sourcePort: 'out', targetPort: 'in' },
    'a-c': { source: 'a', target: 'c', sourcePort: 'out', targetPort: 'in' },
    'b-d': {
        source: 'b',
        target: 'd',
        sourcePort: 'out',
        targetPort: 'in',
        labels: { status: { text: 'approved' } },
    },
};

const outPort: FlatElementPort = { cx: 'calc(w)', cy: 'calc(0.5*h)' };
const inPort: FlatElementPort = { cx: 0, cy: 'calc(0.5*h)' };

const portsByKind: Record<string, Record<string, FlatElementPort>> = {
    source: { out: outPort },
    sink: { in: inPort },
};
const defaultPorts: Record<string, FlatElementPort> = { in: inPort, out: outPort };

function Node({ label, color }: Readonly<{ label: string; color: string }>) {
    return (
        <rect
            width="100"
            height="40"
            rx="6"
            fill="#1e293b"
            stroke={color}
            strokeWidth="2"
        >
            <title>{label}</title>
        </rect>
    );
}

function Diagram() {
    const [elements, setElements] = useState(initialElements);
    const [links, setLinks] = useState(initialLinks);
    const [useSecondaryColor, setUseSecondaryColor] = useState(false);
    const color = useSecondaryColor ? SECONDARY : PRIMARY;

    const { mapDataToElementAttributes } = useElementDefaults<NodeData>((data) => ({
        portStyle: { color, width: 12, height: 12, stroke: LIGHT, strokeWidth: 1 },
        ports: portsByKind[data.kind] ?? defaultPorts,
    }), [color]);

    const { mapDataToLinkAttributes } = useThemeLinkMapper({
        color,
        width: 3,
        targetMarker: 'arrow',
        labelColor: LIGHT,
        labelFontSize: 11,
        labelFontFamily: 'monospace',
        labelBackgroundPadding: { x: 10, y: 5 },
        labelBackgroundColor: '#1e293b',
        labelBackgroundStroke: color,
    });

    const renderElement: RenderElement<NodeData> = useCallback(
        (data) => <Node label={data.label} color={color} />,
        [color],
    );

    return (
        <>
            <button
                type="button"
                onClick={() => setUseSecondaryColor((v) => !v)}
                style={{ marginBottom: 8, padding: '4px 12px', cursor: 'pointer' }}
            >
                Toggle color
            </button>
            <GraphProvider
                elements={elements}
                links={links}
                onElementsChange={setElements}
                onLinksChange={setLinks}
                mapDataToElementAttributes={mapDataToElementAttributes}
                mapDataToLinkAttributes={mapDataToLinkAttributes}
            >
                <Paper
                    className={PAPER_CLASSNAME}
                    height={340}
                    renderElement={renderElement}
                />
            </GraphProvider>
        </>
    );
}

export default function App() {
    return <Diagram />;
}
