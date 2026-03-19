import { useState, useCallback } from 'react';
import {
    GraphProvider,
    Paper,
    useThemeLinkMapper,
    type FlatLinkData,
    type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY, LIGHT } from 'storybook-config/theme';

type ElementData = {
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

const initialElements: Record<string, ElementData> = {
    a: { label: 'Start', x: 50, y: 140, width: 100, height: 40 },
    b: { label: 'Process', x: 250, y: 50, width: 100, height: 40 },
    c: { label: 'Review', x: 250, y: 230, width: 100, height: 40 },
    d: { label: 'Done', x: 480, y: 140, width: 100, height: 40 },
};

const initialLinks: Record<string, FlatLinkData> = {
    'a-b': { source: 'a', target: 'b' },
    'a-c': { source: 'a', target: 'c' },
    'b-d': {
        source: 'b',
        target: 'd',
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

    const renderElement: RenderElement<ElementData> = useCallback(
        (data) => <Node label={data.label} />,
        [],
    );

    return (
        <GraphProvider
            elements={elements}
            links={links}
            onElementsChange={setElements}
            onLinksChange={setLinks}
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
