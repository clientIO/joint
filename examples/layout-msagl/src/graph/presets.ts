import { dia } from '@joint/core';
import { EdgeRoutingMode, LayerDirectionEnum } from '@joint/layout-msagl';
import { paletteLibrary } from './palette';
import { buildGraph } from './builders-from-blueprint';
import { createLink, createNode, makePaletteCycler } from './builders';
import { cycleBlueprint, dagBlueprint, networkBlueprint, treeBlueprint, completeBlueprint, nestedBlueprint } from './blueprints';
import { GraphMeta, GraphPreset, GraphType, PaletteCycler } from './types';

const graphPresets: Record<GraphType, GraphPreset> = {
    tree: {
        id: 'tree',
        title: 'Product Decision Tree',
        description: 'Top-down planning where joint-layout-msagl keeps discovery, design, and delivery phases neatly layered.',
        palette: paletteLibrary.canopy,
        layout: {
            layerDirection: LayerDirectionEnum.TB,
            edgeRoutingMode: EdgeRoutingMode.Rectilinear,
            layerSeparation: 110,
            nodeSeparation: 80,
            margin: 40,
            useVertices: true
        },
        build: (palette: PaletteCycler) => buildGraph(treeBlueprint, palette)
    },
    dag: {
        id: 'dag',
        title: 'Data Platform DAG',
        description: 'A directed acyclic graph that shows how joint-layout-msagl aligns concurrent data flows without overlaps.',
        palette: paletteLibrary.data,
        layout: {
            layerDirection: LayerDirectionEnum.LR,
            edgeRoutingMode: EdgeRoutingMode.Rectilinear,
            layerSeparation: 120,
            nodeSeparation: 90,
            margin: 40,
            useVertices: true
        },
        build: (palette: PaletteCycler) => buildGraph(dagBlueprint, palette)
    },
    network: {
        id: 'network',
        title: 'Collaboration Network',
        description: 'Bundled splines highlight collaboration clusters while MSAGL finds balanced spacing for every squad.',
        palette: paletteLibrary.network,
        layout: {
            layerDirection: LayerDirectionEnum.LR,
            edgeRoutingMode: EdgeRoutingMode.SplineBundling,
            layerSeparation: 140,
            nodeSeparation: 130,
            margin: 40,
            useVertices: true
        },
        build: (palette: PaletteCycler) => buildGraph(networkBlueprint, palette)
    },
    cycle: {
        id: 'cycle',
        title: 'Creative Delivery Loop',
        description: 'A circular workflow where joint-layout-msagl routes feedback loops and keeps the cadence readable.',
        palette: paletteLibrary.loop,
        layout: {
            layerDirection: LayerDirectionEnum.LR,
            edgeRoutingMode: EdgeRoutingMode.SplineBundling,
            layerSeparation: 120,
            nodeSeparation: 110,
            margin: 40,
            useVertices: true
        },
        build: (palette: PaletteCycler) => buildGraph(cycleBlueprint, palette)
    },
    complete: {
        id: 'complete',
        title: 'Expertise Matrix',
        description: 'Dense guild-to-guild connectivity demonstrates MSAGL keeping a fully connected layer approachable.',
        palette: paletteLibrary.matrix,
        layout: {
            layerDirection: LayerDirectionEnum.LR,
            edgeRoutingMode: EdgeRoutingMode.SplineBundling,
            layerSeparation: 150,
            nodeSeparation: 150,
            margin: 40,
            useVertices: true
        },
        build: (palette: PaletteCycler) => buildGraph(completeBlueprint, palette)
    },
    'self-links': {
        id: 'self-links',
        title: 'Feedback Channels',
        description: 'Self-referential loops and mutual dependencies showcase MSAGL animating anchors around each iteration.',
        palette: paletteLibrary.feedback,
        layout: {
            layerDirection: LayerDirectionEnum.TB,
            edgeRoutingMode: EdgeRoutingMode.Rectilinear,
            layerSeparation: 110,
            nodeSeparation: 120,
            margin: 40,
            useVertices: true
        },
        build: (palette: PaletteCycler) => {
            // This graph is built procedurally rather than via blueprint
            // It still uses the same node/link builders
            const platform = createNode('Service Layer', palette.next(), {
                width: 170,
                variant: 'pill',
                fontSize: 15,
                fontWeight: '600'
            });
            const telemetry = createNode('Telemetry', palette.next());
            const compliance = createNode('Compliance', palette.next());

            const loops = [
                createLink(platform, platform),
                createLink(telemetry, telemetry),
                createLink(compliance, compliance)
            ];

            const crossLinks = [
                createLink(platform, telemetry, { label: 'Publishes' }),
                createLink(telemetry, platform, { label: 'Alerts' }),
                createLink(platform, compliance, { label: 'Reports' }),
                createLink(compliance, platform, { label: 'Guides' })
            ];

            return [platform, telemetry, compliance, ...loops, ...crossLinks];
        }
    },
    nested: {
        id: 'nested',
        title: 'Nested Portfolio',
        description: 'Embedded teams remain grouped while joint-layout-msagl routes cross-cutting work around department bounds.',
        palette: paletteLibrary.nested,
        layout: {
            layerDirection: LayerDirectionEnum.LR,
            edgeRoutingMode: EdgeRoutingMode.Rectilinear,
            layerSeparation: 140,
            nodeSeparation: 115,
            margin: 80,
            useVertices: true
        },
        build: (palette: PaletteCycler) => buildGraph(nestedBlueprint, palette)
    }
};

export const graphTitles: Record<GraphType, string> = Object.keys(graphPresets).reduce((titles, key) => {
    const id = key as GraphType;
    titles[id] = graphPresets[id].title;
    return titles;
}, {} as Record<GraphType, string>);

export const defaultGraphType: GraphType = 'nested';

export const createGraph = (graph: dia.Graph, rawType: string): GraphMeta => {
    const preset = graphPresets[(rawType as GraphType)] ?? graphPresets.tree;
    const palette = makePaletteCycler(preset.palette);
    const cells = preset.build(palette);

    graph.resetCells(cells);

    return {
        id: preset.id,
        title: preset.title,
        description: preset.description,
        layout: { ...preset.layout }
    };
};
