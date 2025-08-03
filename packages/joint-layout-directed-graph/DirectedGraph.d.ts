import { dia, g } from '@joint/core';
import { Graph as GLibGraph} from '@dagrejs/graphlib';
import { graphlib, configUnion } from '@dagrejs/dagre';

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

    interface DagreNodeProperties {
        order?: number;
        rank?: number;
    }

    type CustomOrderCallback = (
        dagreGraph: graphlib.Graph<DagreNodeProperties>,
        graph: dia.Graph,
        order: (graph: graphlib.Graph<DagreNodeProperties>, opts?: configUnion) => void
    ) => void;

    interface LayoutOptions extends ImportOptions, ExportOptions {
        align?: 'UR' | 'UL' | 'DR' | 'DL';
        rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
        ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
        nodeSep?: number;
        edgeSep?: number;
        rankSep?: number;
        marginX?: number;
        marginY?: number;
        resizeClusters?: boolean;
        clusterPadding?: dia.Padding | 'default';
        debugTiming?: boolean;
        disableOptimalOrderHeuristic?: boolean;
        customOrder?: CustomOrderCallback
    }

    interface ImportOptions {
        setPosition?: (element: dia.Element, position: dia.BBox) => void;
        setVertices?: boolean | ((link: dia.Link, vertices: dia.Point[]) => void);
        setLabels?: boolean | ((link: dia.Link, position: dia.Point, points: dia.Point[]) => void);
        /** @deprecated use `setVertices` instead */
        setLinkVertices?: boolean;
    }

    interface ExportOptions {
        exportElement?: (element: dia.Element) => Node;
        exportLink?: (link: dia.Link) => Edge;
    }

    interface ToGraphLibOptions extends ExportOptions {
        [key: string]: any;
    }

    interface FromGraphLibOptions extends ImportOptions {
        graph?: dia.Graph;
        [key: string]: any;
    }

    export function layout(graph: dia.Graph | dia.Cell[], opt?: LayoutOptions): g.Rect;

    export function toGraphLib(graph: dia.Graph, opt?: ToGraphLibOptions): GLibGraph;

    export function fromGraphLib(glGraph: GLibGraph, opt?: FromGraphLibOptions): dia.Graph;

    /** @deprecated pass the `graph` option instead */
    export function fromGraphLib(this: dia.Graph, glGraph: any, opt?: { [key: string]: any }): dia.Graph;

    /** @deprecated use `FromGraphLibOptions` instead */
    type fromGraphLibOptions = FromGraphLibOptions;

    /** @deprecated use `ToGraphLibOptions` instead */
    type toGraphLibOptions = ToGraphLibOptions;
}
