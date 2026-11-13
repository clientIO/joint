/* eslint-disable @typescript-eslint/no-explicit-any */
import type { dia, g } from '@joint/core';
import type { Graph as GLibGraph } from '@dagrejs/graphlib';
import type { graphlib, configUnion } from '@dagrejs/dagre';

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
        /**
         * The rank of the node. Used by the `fixed` ranker only and ignored for clusters
         * (elements with embedded children), which are ranked by their children.
         * It is rounded to the nearest integer; a missing, non-numeric or non-finite rank is 0.
         * The empty ranks between the first and the last rank are kept (see `emptyRankSize`).
         */
        rank?: number;
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
        /**
         * The algorithm to assign a rank to each element.
         * `fixed` takes the ranks from `exportElement()` (the `rank` property of the node).
         * With `fixed`, the backward links are routed from the source to the target,
         * the links within one rank are not laid out (their vertices are reset with `setVertices`)
         * and link `minLen` is ignored.
         */
        ranker?: 'network-simplex' | 'tight-tree' | 'longest-path' | 'fixed';
        /**
         * The extra size (along the rank direction) of every empty rank
         * between the first and the last rank. Used by the `fixed` ranker only.
         * Without it, an empty rank is as large as `rankSep`.
         */
        emptyRankSize?: number;
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
