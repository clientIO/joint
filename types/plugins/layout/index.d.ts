declare namespace joint {
    namespace layout {
        interface LayoutOptions {
            nodeSep?: number;
            edgeSep?: number;
            rankSep?: number;
            rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
            marginX?: number;
            marginY?: number;
            resizeCluster?: boolean;
            setPosition?: (element: dia.Element, position: dia.BBox) => void;
            setLinkVertices?: (link: dia.Link, vertices: Position[]) => void;
        }
    }
}