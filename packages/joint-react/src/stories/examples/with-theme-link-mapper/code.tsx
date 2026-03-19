import { useState, useCallback } from 'react';
import {
    GraphProvider,
    Paper,
    useThemeElementMapper,
    useThemeLinkMapper,
    type FlatElementData,
    type FlatLinkData,
    type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY, LIGHT } from 'storybook-config/theme';

const initialElements: Record<string, FlatElementData> = {
    a: {
        label: 'Start',
        x: 50,
        y: 140,
        width: 100,
        height: 40,
        ports: {
            out: { cx: 'calc(w)', cy: 'calc(0.5*h)', color: PRIMARY },
        },
    },
    b: {
        label: 'Process',
        x: 250,
        y: 50,
        width: 100,
        height: 40,
        ports: {
            in: { cx: 0, cy: 'calc(0.5*h)', color: LIGHT },
            out: { cx: 'calc(w)', cy: 'calc(0.5*h)', color: PRIMARY },
        },
    },
    c: {
        label: 'Review',
        x: 250,
        y: 230,
        width: 100,
        height: 40,
        ports: {
            in: { cx: 0, cy: 'calc(0.5*h)', color: LIGHT },
        },
    },
    d: {
        label: 'Done',
        x: 480,
        y: 140,
        width: 100,
        height: 40,
        ports: {
            in: { cx: 0, cy: 'calc(0.5*h)', color: LIGHT },
        },
    },
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

function Node({ label }: Readonly<{ label?: string }>) {
    return (
        <rect
            width="100"
            height="40"
            rx="6"
            fill="#1e293b"
            stroke={PRIMARY}
            strokeWidth="2"
        >
            <title>{label}</title>
        </rect>
    );
}

function Diagram() {
    const [elements, setElements] = useState(initialElements);
    const [links, setLinks] = useState(initialLinks);

    const { mapDataToElementAttributes } = useThemeElementMapper({
        portColor: PRIMARY,
        portWidth: 12,
        portHeight: 12,
        portStroke: LIGHT,
        portStrokeWidth: 1
    });

    const { mapDataToLinkAttributes } = useThemeLinkMapper({
        color: PRIMARY,
        width: 3,
        targetMarker: 'arrow',
        labelColor: LIGHT,
        labelFontSize: 11,
        labelFontFamily: 'monospace',
        labelBackgroundPadding: { x: 10, y: 5 },
        labelBackgroundColor: '#1e293b',
        labelBackgroundStroke: PRIMARY,
    });

    const renderElement: RenderElement = useCallback(
        (data) => <Node label={data.label as string} />,
        [],
    );

    return (
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
    );
}

export default function App() {
    return <Diagram />;
}
