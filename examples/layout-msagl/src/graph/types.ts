import { dia } from '@joint/core';
import { EdgeRoutingMode, LayerDirectionEnum } from '@joint/layout-msagl';

export type GraphType =
    | 'tree'
    | 'dag'
    | 'network'
    | 'cycle'
    | 'complete'
    | 'self-links'
    | 'nested';

export type LayoutPreset = {
    layerDirection: LayerDirectionEnum;
    edgeRoutingMode: EdgeRoutingMode;
    layerSeparation: number;
    nodeSeparation: number;
    clusterPadding?: number;
    useVertices: boolean;
};

export type GraphMeta = {
    id: GraphType;
    title: string;
    description: string;
    layout: LayoutPreset;
};

export type GraphPreset = GraphMeta & {
    palette: string[];
    build: (palette: PaletteCycler) => dia.Cell[];
};

export type PaletteCycler = {
    next(): string;
};

export type LinkOptions = {
    label?: string;
    showLabel?: boolean;
    color?: string;
    thickness?: number;
};

export type NodeVariant = 'rounded' | 'pill' | 'circle';

export type NodeOptions = {
    width?: number;
    height?: number;
    variant?: NodeVariant;
    fontSize?: number;
    fontWeight?: string;
    textColor?: string;
};
