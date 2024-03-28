import { dia, g } from '@joint/core';

export namespace DirectedGraph {

    interface Edge {
        minLen?: number;
        weight?: number;
        labelpos?: 'l' | 'c' | 'r';
        labeloffset?: number;
        width?: number;
        height?: number;
    }

    interface Node {
        width?: number;
        height?: number;
    }

    interface LayoutOptions {
        align?: 'UR' | 'UL' | 'DR' | 'DL';
        rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
        ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
        nodeSep?: number;
        edgeSep?: number;
        rankSep?: number;
        marginX?: number;
        marginY?: number;
        resizeClusters?: boolean;
        clusterPadding?: dia.Padding;
        setPosition?: (element: dia.Element, position: dia.BBox) => void;
        setVertices?: boolean | ((link: dia.Link, vertices: dia.Point[]) => void);
        setLabels?: boolean | ((link: dia.Link, position: dia.Point, points: dia.Point[]) => void);
        debugTiming?: boolean;
        exportElement?: (element: dia.Element) => Node;
        exportLink?: (link: dia.Link) => Edge;
        // deprecated
        setLinkVertices?: boolean;
    }

    interface toGraphLibOptions {
        [key: string]: any;
    }

    interface fromGraphLibOptions {
        graph?: dia.Graph;
        [key: string]: any;
    }

    export function layout(graph: dia.Graph | dia.Cell[], opt?: LayoutOptions): g.Rect;

    export function toGraphLib(graph: dia.Graph, opt?: toGraphLibOptions): any;

    export function fromGraphLib(glGraph: any, opt?: fromGraphLibOptions): dia.Graph;
}
