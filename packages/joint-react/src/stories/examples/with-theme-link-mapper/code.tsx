import { useState, useCallback } from 'react';
import {
    GraphProvider,
    Paper,
    useElementDefaults,
    useElementLayout,
    useLinkDefaults,
    type FlatElementData,
    type FlatElementPort,
    type FlatLinkData,
    type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY, LIGHT, BG } from 'storybook-config/theme';

interface ElementData extends FlatElementData {
    label: string;
    type: 'source' | 'process' | 'sink';
}

// Minimal persisted data — no ports, no styling.
// Ports and theme are provided by useElementDefaults based on element kind.
const initialElements: Record<string, ElementData> = {
    a: { label: 'Start', type: 'source', x: 50, y: 140 },
    b: { label: 'Process', type: 'process', x: 250, y: 50 },
    c: { label: 'Review', type: 'process', x: 250, y: 230 },
    d: { label: 'Done', type: 'sink', x: 480, y: 140 },
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

const portsByType: Record<string, Record<string, FlatElementPort>> = {
    source: { out: outPort },
    sink: { in: inPort },
};
const defaultPorts: Record<string, FlatElementPort> = { in: inPort, out: outPort };

function Element({ label, color }: Readonly<{ label: string; color: string }>) {
    const { width, height } = useElementLayout();
    return (
        <>
            <rect
                width={width}
                height={height}
                rx="6"
                fill="#1e293b"
                stroke={color}
                strokeWidth="2"
            />
            <text
                x={width / 2}
                y={height / 2}
                fill={color}
                fontSize={14}
                fontFamily="monospace"
                textAnchor="middle"
                dominantBaseline="middle"
            >{label}
            </text>
        </>
    );
}

function Diagram() {
    const [elements, setElements] = useState(initialElements);
    const [links, setLinks] = useState(initialLinks);
    const [alternate, setAlternate] = useState(false);
    const color = alternate ? SECONDARY : PRIMARY;
    const portShape = alternate ? 'rect' as const : 'ellipse' as const;

    const { mapDataToElementAttributes } = useElementDefaults<ElementData>(
      (data) => ({
        width: 100,
        height: 40,
        portStyle: {
            color,
            shape: portShape,
            width: 12,
            height: 12,
            outline: BG,
            outlineWidth: 2
        },
        ports: portsByType[data.type] ?? defaultPorts,
      }),
      [color, portShape]
    );

    const { mapDataToLinkAttributes } = useLinkDefaults({
        color: color,
        width: 3,
        targetMarker: 'arrow',
        labelStyle: {
            color: LIGHT,
            fontSize: 11,
            fontFamily: 'monospace',
            backgroundPadding: { x: 10, y: 5 },
            backgroundColor: '#1e293b',
            backgroundOutline: color,
        },
    }, [color]);

    const renderElement: RenderElement<ElementData> = useCallback(
        (data) => <Element label={data.label} color={color} />,
        [color],
    );

    const changeDefaults = useCallback(() => setAlternate((v) => !v), []);

    return (
        <>
            <button
                type="button"
                onClick={changeDefaults}
                style={{
                    marginBottom: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 14px',
                    cursor: 'pointer',
                    borderRadius: 20,
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    background: alternate ? SECONDARY : PRIMARY,
                    color: LIGHT,
                    transition: 'background 0.2s',
                }}
            >
                {alternate ? '\u25A0 Square ports' : '\u25CF Round ports'}
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
