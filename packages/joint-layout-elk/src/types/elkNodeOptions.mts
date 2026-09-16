import type {
    Alignment,
    HierarchyHandling,
    PortAlignment,
    PortConstraints,
    LayerConstraint,
    NodeFlexibility,
    SelfLoopDistributionStrategy,
    SelfLoopOrderingStrategy,
    TopdownNodeTypes
} from './elkEnums.mjs';

export interface NodeElkLayoutOptions {
    // Falls back to a plain string for any ELK option beyond this package's Core/Layered coverage.
    [key: string]: string | undefined;
    /**
     * Alignment of the selected node relative to other nodes; the exact meaning depends on the used
     * algorithm.
     * @defaultValue 'AUTOMATIC'
     */
    'elk.alignment'?: Alignment;
    /**
     * Determines whether separate layout runs are triggered for different compound nodes in a
     * hierarchical graph. Setting a node's hierarchy handling to `INCLUDE_CHILDREN` will lay out that
     * node and all of its descendants in a single layout run, until a descendant is encountered which
     * has its hierarchy handling set to `SEPARATE_CHILDREN`. In general, `SEPARATE_CHILDREN` will
     * ensure that a new layout run is triggered for a node with that setting. Including multiple
     * levels of hierarchy in a single layout run may allow cross-hierarchical edges to be laid out
     * properly. If the root node is set to `INHERIT` (or not set at all), the default behavior is
     * `SEPARATE_CHILDREN`.
     * @defaultValue 'INHERIT'
     */
    'elk.hierarchyHandling'?: HierarchyHandling;
    /**
     * The padding to be left to a parent element's border when placing child elements. This can also
     * serve as an output option of a layout algorithm if node size calculation is setup appropriately.
     * @defaultValue `new ElkPadding(12)`
     */
    'elk.padding'?: string;
    /**
     * Spacing between pairs of ports of the same node.
     * @defaultValue '10'
     */
    'elk.spacing.portPort'?: `${number}`;
    /**
     * Allows to specify individual spacing values for graph elements that shall be different from the
     * value specified for the element's parent.
     */
    'elk.spacing.individual'?: string;
    /**
     * Partition to which the node belongs. This requires Layout Partitioning to be active. Nodes with
     * lower partition IDs will appear to the left of nodes with higher partition IDs (assuming a
     * left-to-right layout direction).
     */
    'elk.partitioning.partition'?: `${number}`;
    /**
     * Hints for where node labels are to be placed; if empty, the node label's position is not
     * modified.
     * @defaultValue `NodeLabelPlacement.fixed`
     */
    'elk.nodeLabels.placement'?: string;
    /**
     * Defines the default port distribution for a node. May be overridden for each side individually.
     * @defaultValue 'DISTRIBUTED'
     */
    'elk.portAlignment.default'?: PortAlignment;
    /**
     * Defines how ports on the northern side are placed, overriding the node's general port alignment.
     */
    'elk.portAlignment.north'?: PortAlignment;
    /**
     * Defines how ports on the southern side are placed, overriding the node's general port alignment.
     */
    'elk.portAlignment.south'?: PortAlignment;
    /**
     * Defines how ports on the western side are placed, overriding the node's general port alignment.
     */
    'elk.portAlignment.west'?: PortAlignment;
    /**
     * Defines how ports on the eastern side are placed, overriding the node's general port alignment.
     */
    'elk.portAlignment.east'?: PortAlignment;
    /**
     * Defines constraints of the position of the ports of a node.
     * @defaultValue 'UNDEFINED'
     */
    'elk.portConstraints'?: PortConstraints;
    /**
     * The position of a node, port, or label. This is used by the 'Fixed Layout' algorithm to specify
     * a pre-defined position.
     */
    'elk.position'?: string;
    /**
     * Defines the priority of an object; its meaning depends on the specific layout algorithm and the
     * context where it is used.
     */
    'elk.priority'?: `${number}`;
    /**
     * What should be taken into account when calculating a node's size. Empty size constraints specify
     * that a node's size is already fixed and should not be changed.
     * @defaultValue `EnumSet.noneOf(SizeConstraint)`
     */
    'elk.nodeSize.constraints'?: string;
    /**
     * Options modifying the behavior of the size constraints set on a node. Each member of the set
     * specifies something that should be taken into account when calculating node sizes. The empty set
     * corresponds to no further modifications.
     * @defaultValue `EnumSet.of(SizeOptions.DEFAULT_MINIMUM_SIZE)`
     */
    'elk.nodeSize.options'?: string;
    /**
     * The minimal size to which a node can be reduced.
     * @defaultValue `new KVector(0, 0)`
     */
    'elk.nodeSize.minimum'?: string;
    /**
     * Whether the node should be regarded as a comment box instead of a regular node. In that case its
     * placement should be similar to how labels are handled. Any edges incident to a comment box
     * specify to which graph elements the comment is related.
     * @defaultValue 'false'
     */
    'elk.commentBox'?: 'true' | 'false';
    /**
     * Whether the node should be handled as a hypernode.
     * @defaultValue 'false'
     */
    'elk.hypernode'?: 'true' | 'false';
    /**
     * Margins define additional space around the actual bounds of a graph element. For instance, ports
     * or labels being placed on the outside of a node's border might introduce such a margin. The
     * margin is used to guarantee non-overlap of other graph elements with those ports or labels.
     * @defaultValue `new ElkMargin()`
     */
    'elk.margins'?: string;
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
     * Decides on a placement method for port labels; if empty, the node label's position is not
     * modified.
     * @defaultValue `PortLabelPlacement.outside`
     */
    'elk.portLabels.placement'?: string;
    /**
     * Use 'portLabels.placement': NEXT_TO_PORT_OF_POSSIBLE.
     * @defaultValue 'false'
     */
    'elk.portLabels.nextToPortIfPossible'?: 'true' | 'false';
    /**
     * If this option is true (default), the labels of a port will be treated as a group when it comes
     * to centering them next to their port. If this option is false, only the first label will be
     * centered next to the port, with the others being placed below. This only applies to labels of
     * eastern and western ports and will have no effect if labels are not placed next to their port.
     * @defaultValue 'true'
     */
    'elk.portLabels.treatAsGroup'?: 'true' | 'false';
    /**
     * The scaling factor to be applied to the corresponding node in recursive layout. It causes the
     * corresponding node's size to be adjusted, and its ports and labels to be sized and placed
     * accordingly after the layout of that node has been determined (and before the node itself and
     * its siblings are arranged). The scaling is not reverted afterwards, so the resulting layout
     * graph contains the adjusted size and position data. This option is currently not supported if
     * 'Layout Hierarchy' is set.
     * @defaultValue '1'
     */
    'elk.scaleFactor'?: `${number}`;
    /**
     * The size approximator to be used to set sizes of hierarchical nodes during topdown layout. The
     * default value is null, which results in nodes keeping whatever size is defined for them e.g.
     * through parent parallel node or by manually setting the size.
     * @defaultValue `null`
     */
    'elk.topdown.sizeApproximator'?: string;
    /**
     * The fixed size of a hierarchical node when using topdown layout. If this value is set on a
     * parallel node it applies to its children, when set on a hierarchical node it applies to the node
     * itself.
     * @defaultValue '150'
     */
    'elk.topdown.hierarchicalNodeWidth'?: `${number}`;
    /**
     * The fixed aspect ratio of a hierarchical node when using topdown layout. Default is 1/sqrt(2).
     * If this value is set on a parallel node it applies to its children, when set on a hierarchical
     * node it applies to the node itself.
     * @defaultValue '1.414'
     */
    'elk.topdown.hierarchicalNodeAspectRatio'?: `${number}`;
    /**
     * The different node types used for topdown layout. If the node type is set to
     * `TopdownNodeTypes.PARALLEL_NODE` the algorithm must be set to a `TopdownLayoutProvider` such as
     * `TopdownPacking`. The `nodeSize.fixedGraphSize` option is technically only required for
     * hierarchical nodes.
     * @defaultValue `null`
     */
    'elk.topdown.nodeType'?: TopdownNodeTypes;
    /**
     * Whether this node allows to route self loops inside of it instead of around it. If set to true,
     * this will make the node a compound node if it isn't already, and will require the layout
     * algorithm to support compound nodes with hierarchical ports.
     * @defaultValue 'false'
     */
    'elk.insideSelfLoops.activate'?: 'true' | 'false';
    /**
     * Determines a constraint on the placement of the node regarding the layering.
     * @defaultValue 'NONE'
     */
    'elk.layered.layering.layerConstraint'?: LayerConstraint;
    /**
     * Allows to set a constraint regarding the layer placement of a node. Let i be the value of teh
     * constraint. Assumed the drawing has n layers and i < n. If set to i, it expresses that the node
     * should be placed in i-th layer. Should i>=n be true then the node is placed in the last layer of
     * the drawing. Note that this option is not part of any of ELK Layered's default configurations
     * but is only evaluated as part of the `InteractiveLayeredGraphVisitor`, which must be applied
     * manually or used via the `DiagramLayoutEngine.
     * @defaultValue `null`
     */
    'elk.layered.layering.layerChoiceConstraint'?: `${number}`;
    /**
     * Layer identifier that was calculated by ELK Layered for a node. This is only generated if
     * interactiveLayot or generatePositionAndLayerIds is set.
     * @defaultValue '-1'
     */
    'elk.layered.layering.layerId'?: `${number}`;
    /**
     * Allows to set a constraint which specifies of which node the current node is the predecessor. If
     * set to 's' then the node is the predecessor of 's' and is in the same layer
     * @defaultValue `null`
     */
    'elk.layered.crossingMinimization.inLayerPredOf'?: string;
    /**
     * Allows to set a constraint which specifies of which node the current node is the successor. If
     * set to 's' then the node is the successor of 's' and is in the same layer
     * @defaultValue `null`
     */
    'elk.layered.crossingMinimization.inLayerSuccOf'?: string;
    /**
     * Allows to set a constraint regarding the position placement of a node in a layer. Assumed the
     * layer in which the node placed includes n other nodes and i < n. If set to i, it expresses that
     * the node should be placed at the i-th position. Should i>=n be true then the node is placed at
     * the last position in the layer. Note that this option is not part of any of ELK Layered's
     * default configurations but is only evaluated as part of the `InteractiveLayeredGraphVisitor`,
     * which must be applied manually or used via the `DiagramLayoutEngine.
     * @defaultValue `null`
     */
    'elk.layered.crossingMinimization.positionChoiceConstraint'?: `${number}`;
    /**
     * Position within a layer that was determined by ELK Layered for a node. This is only generated if
     * interactiveLayot or generatePositionAndLayerIds is set.
     * @defaultValue '-1'
     */
    'elk.layered.crossingMinimization.positionId'?: `${number}`;
    /**
     * Aims at shorter and straighter edges. Two configurations are possible: (a) allow ports to move
     * freely on the side they are assigned to (the order is always defined beforehand), (b)
     * additionally allow to enlarge a node wherever it helps. If this option is not configured for a
     * node, the 'nodeFlexibility.default' value is used, which is specified for the node's parent.
     */
    'elk.layered.nodePlacement.networkSimplex.nodeFlexibility'?: NodeFlexibility;
    /**
     * Alter the distribution of the loops around the node. It only takes effect for
     * PortConstraints.FREE.
     * @defaultValue 'NORTH'
     */
    'elk.layered.edgeRouting.selfLoopDistribution'?: SelfLoopDistributionStrategy;
    /**
     * Alter the ordering of the loops they can either be stacked or sequenced. It only takes effect
     * for PortConstraints.FREE.
     * @defaultValue 'STACKED'
     */
    'elk.layered.edgeRouting.selfLoopOrdering'?: SelfLoopOrderingStrategy;
    /**
     * Use a heuristic to decide whether or not to actually perform the layer split with the goal of
     * minimizing the total edge length. This option only works when layerSplit is set to 2. The
     * property can be set to the nodes in a layer, which then applies the property for the layer. If
     * any node sets the value to true, then the value is set to true for the entire layer.
     * @defaultValue 'false'
     */
    'elk.layered.layerUnzipping.minimizeEdgeLength'?: 'true' | 'false';
    /**
     * Defines the number of sublayers to split a layer into. The property can be set to the nodes in a
     * layer, which then applies the property for the layer. If multiple nodes set the value to
     * different values, then the lowest value is chosen.
     * @defaultValue '2'
     */
    'elk.layered.layerUnzipping.layerSplit'?: `${number}`;
    /**
     * If set to true, nodes will always be placed in the first sublayer after a long edge when using
     * the ALTERNATING strategy. Otherwise long edge dummies are treated the same as regular nodes. The
     * default value is true. The property can be set to the nodes in a layer, which then applies the
     * property for the layer. If any node sets the value to false, then the value is set to false for
     * the entire layer.
     * @defaultValue 'true'
     */
    'elk.layered.layerUnzipping.resetOnLongEdges'?: 'true' | 'false';
    /**
     * Set on a node to not set a model order for this node even though it is a real node.
     * @defaultValue 'false'
     */
    'elk.layered.considerModelOrder.noModelOrder'?: 'true' | 'false';
    /**
     * Used to define partial ordering groups during cycle breaking. A lower group id means that the
     * group is sorted before other groups. A group model order of 0 is the default group.
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.groupModelOrder.cycleBreakingId'?: `${number}`;
    /**
     * Used to define partial ordering groups during crossing minimization. A lower group id means that
     * the group is sorted before other groups. A group model order of 0 is the default group.
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.groupModelOrder.crossingMinimizationId'?: `${number}`;
    /**
     * Used to define partial ordering groups during component packing. A lower group id means that the
     * group is sorted before other groups. A group model order of 0 is the default group.
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.groupModelOrder.componentGroupId'?: `${number}`;
}
