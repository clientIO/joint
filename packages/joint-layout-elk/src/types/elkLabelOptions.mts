import type { EdgeLabelPlacement, CenterEdgeLabelPlacementStrategy } from './elkEnums.mjs';

export interface LabelElkLayoutOptions {
    // Falls back to a plain string for any ELK option beyond this package's Core/Layered coverage.
    [key: string]: string | undefined;
    /**
     * Allows to specify individual spacing values for graph elements that shall be different from the
     * value specified for the element's parent.
     */
    'elk.spacing.individual'?: string;
    /**
     * Hints for where node labels are to be placed; if empty, the node label's position is not
     * modified.
     * @defaultValue `NodeLabelPlacement.fixed`
     */
    'elk.nodeLabels.placement'?: string;
    /**
     * The position of a node, port, or label. This is used by the 'Fixed Layout' algorithm to specify
     * a pre-defined position.
     */
    'elk.position'?: string;
    /**
     * Gives a hint on where to put edge labels.
     * @defaultValue 'CENTER'
     */
    'elk.edgeLabels.placement'?: EdgeLabelPlacement;
    /**
     * If true, an edge label is placed directly on its edge. May only apply to center edge labels.
     * This kind of label placement is only advisable if the label's rendering is such that it is not
     * crossed by its edge and thus stays legible.
     * @defaultValue 'false'
     */
    'elk.edgeLabels.inline'?: 'true' | 'false';
    /**
     * Font name used for a label.
     */
    'elk.font.name'?: string;
    /**
     * Font size used for a label.
     */
    'elk.font.size'?: `${number}`;
    /**
     * Determines the amount of fuzziness to be used when performing softwrapping on labels. The value
     * expresses the percent of overhang that is permitted for each line. If the next line would take
     * up less space than this threshold, it is appended to the current line instead of being placed in
     * a new line.
     * @defaultValue '0.0'
     */
    'elk.softwrappingFuzziness'?: `${number}`;
    /**
     * No layout is done for the associated element. This is used to mark parts of a diagram to avoid
     * their inclusion in the layout graph, or to mark parts of the layout graph to prevent layout
     * engines from processing them. If you wish to exclude the contents of a compound node from
     * automatic layout, while the node itself is still considered on its own layer, use the 'Fixed
     * Layout' algorithm for that node.
     * @defaultValue 'false'
     */
    'elk.noLayout'?: 'true' | 'false';
    /**
     * Determines in which layer center labels of long edges should be placed.
     * @defaultValue 'MEDIAN_LAYER'
     */
    'elk.layered.edgeLabels.centerLabelPlacementStrategy'?: CenterEdgeLabelPlacementStrategy;
}
