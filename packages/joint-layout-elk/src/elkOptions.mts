import type {
    ElkNode as RawElkNode,
    ElkPort as RawElkPort,
    ElkExtendedEdge as RawElkExtendedEdge,
    ElkLabel as RawElkLabel
} from 'elkjs';

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

export interface EdgeElkLayoutOptions {
    // Falls back to a plain string for any ELK option beyond this package's Core/Layered coverage.
    [key: string]: string | undefined;
    /**
     * A fixed list of bend points for the edge. This is used by the 'Fixed Layout' algorithm to
     * specify a pre-defined routing for an edge. The vector chain must include the source point, any
     * bend points, and the target point, so it must have at least two points.
     */
    'elk.bendPoints'?: string;
    /**
     * Allows to specify individual spacing values for graph elements that shall be different from the
     * value specified for the element's parent.
     */
    'elk.spacing.individual'?: string;
    /**
     * Defines the priority of an object; its meaning depends on the specific layout algorithm and the
     * context where it is used.
     */
    'elk.priority'?: `${number}`;
    /**
     * This option is not used as option, but as output of the layout algorithms. It is attached to
     * edges and determines the points where junction symbols should be drawn in order to represent
     * hyperedges with orthogonal routing. Whether such points are computed depends on the chosen
     * layout algorithm and edge routing style. The points are put into the vector chain with no
     * specific order.
     * @defaultValue `new KVectorChain()`
     */
    'elk.junctionPoints'?: string;
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
     * Whether a self loop should be routed inside a node instead of around that node.
     * @defaultValue 'false'
     */
    'elk.insideSelfLoops.yo'?: 'true' | 'false';
    /**
     * The thickness of an edge. This is a hint on the line width used to draw an edge, possibly
     * requiring more space to be reserved for it.
     * @defaultValue '1'
     */
    'elk.edge.thickness'?: `${number}`;
    /**
     * The type of an edge. This is usually used for UML class diagrams, where associations must be
     * handled differently from generalizations.
     * @defaultValue 'NONE'
     */
    'elk.edge.type'?: EdgeType;
    /**
     * Defines how important it is to have a certain edge point into the direction of the overall
     * layout. This option is evaluated during the cycle breaking phase.
     * @defaultValue '0'
     */
    'elk.layered.priority.direction'?: `${number}`;
    /**
     * Defines how important it is to keep an edge as short as possible. This option is evaluated
     * during the layering phase.
     * @defaultValue '0'
     */
    'elk.layered.priority.shortness'?: `${number}`;
    /**
     * Defines how important it is to keep an edge straight, i.e. aligned with one of the two axes.
     * This option is evaluated during node placement.
     * @defaultValue '0'
     */
    'elk.layered.priority.straightness'?: `${number}`;
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

export interface PortElkLayoutOptions {
    // Falls back to a plain string for any ELK option beyond this package's Core/Layered coverage.
    [key: string]: string | undefined;
    /**
     * Allows to specify individual spacing values for graph elements that shall be different from the
     * value specified for the element's parent.
     */
    'elk.spacing.individual'?: string;
    /**
     * The position of a node, port, or label. This is used by the 'Fixed Layout' algorithm to specify
     * a pre-defined position.
     */
    'elk.position'?: string;
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
     * The offset to the port position where connections shall be attached.
     */
    'elk.port.anchor'?: string;
    /**
     * The index of a port in the fixed order around a node. The order is assumed as clockwise,
     * starting with the leftmost port on the top side. This option must be set if 'Port Constraints'
     * is set to FIXED_ORDER and no specific positions are given for the ports. Additionally, the
     * option 'Port Side' must be defined in this case.
     */
    'elk.port.index'?: `${number}`;
    /**
     * The side of a node on which a port is situated. This option must be set if 'Port Constraints' is
     * set to FIXED_SIDE or FIXED_ORDER and no specific positions are given for the ports.
     * @defaultValue 'UNDEFINED'
     */
    'elk.port.side'?: PortSide;
    /**
     * The offset of ports on the node border. With a positive offset the port is moved outside of the
     * node, while with a negative offset the port is moved towards the inside. An offset of 0 means
     * that the port is placed directly on the node border, i.e. if the port side is north, the port's
     * south border touches the nodes's north border; if the port side is east, the port's west border
     * touches the nodes's east border; if the port side is south, the port's north border touches the
     * node's south border; if the port side is west, the port's east border touches the node's west
     * border.
     */
    'elk.port.borderOffset'?: `${number}`;
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
    /**
     * Specifies whether non-flow ports may switch sides if their node's port constraints are either
     * FIXED_SIDE or FIXED_ORDER. A non-flow port is a port on a side that is not part of the currently
     * configured layout flow. For instance, given a left-to-right layout direction, north and south
     * ports would be considered non-flow ports. Further note that the underlying criterium whether to
     * switch sides or not solely relies on the minimization of edge crossings. Hence, edge length and
     * other aesthetics criteria are not addressed.
     * @defaultValue 'false'
     */
    'elk.layered.allowNonFlowPortsToSwitchSides'?: 'true' | 'false';
}

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

export interface ElkLayoutOptions {
    // Falls back to a plain string for any ELK option beyond this package's Core/Layered coverage.
    [key: string]: string | undefined;
    /**
     * Configures the packing mode used by the `BoxLayoutProvider`. If SIMPLE is not required (neither
     * priorities are used nor the interactive mode), GROUP_DEC can improve the packing and decrease
     * the area. GROUP_MIXED and GROUP_INC may, in very specific scenarios, work better.
     * @defaultValue `BoxLayoutProvider.PackingMode.SIMPLE`
     */
    'elk.box.packingMode'?: string;
    /**
     * Select a specific layout algorithm.
     */
    'elk.algorithm'?: ElkAlgorithm;
    /**
     * Alignment of the selected node relative to other nodes; the exact meaning depends on the used
     * algorithm.
     * @defaultValue 'AUTOMATIC'
     */
    'elk.alignment'?: Alignment;
    /**
     * The desired aspect ratio of the drawing, that is the quotient of width by height.
     */
    'elk.aspectRatio'?: `${number}`;
    /**
     * A fixed list of bend points for the edge. This is used by the 'Fixed Layout' algorithm to
     * specify a pre-defined routing for an edge. The vector chain must include the source point, any
     * bend points, and the target point, so it must have at least two points.
     */
    'elk.bendPoints'?: string;
    /**
     * Specifies how the content of a node are aligned. Each node can individually control the
     * alignment of its contents. I.e. if a node should be aligned top left in its parent node, the
     * parent node should specify that option.
     * @defaultValue `ContentAlignment.topLeft()`
     */
    'elk.contentAlignment'?: string;
    /**
     * Whether additional debug information shall be generated.
     * @defaultValue 'false'
     */
    'elk.debugMode'?: 'true' | 'false';
    /**
     * Overall direction of edges: horizontal (right / left) or vertical (down / up).
     * @defaultValue 'UNDEFINED'
     */
    'elk.direction'?: Direction;
    /**
     * What kind of edge routing style should be applied for the content of a parent node. Algorithms
     * may also set this option to single edges in order to mark them as splines. The bend point list
     * of edges with this option set to SPLINES must be interpreted as control points for a piecewise
     * cubic spline.
     * @defaultValue 'UNDEFINED'
     */
    'elk.edgeRouting'?: EdgeRouting;
    /**
     * If active, nodes are expanded to fill the area of their parent.
     * @defaultValue 'false'
     */
    'elk.expandNodes'?: 'true' | 'false';
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
     * Whether the algorithm should be run in interactive mode for the content of a parent node. What
     * this means exactly depends on how the specific algorithm interprets this option. Usually in the
     * interactive mode algorithms try to modify the current layout as little as possible.
     * @defaultValue 'false'
     */
    'elk.interactive'?: 'true' | 'false';
    /**
     * Whether the graph should be changeable interactively and by setting constraints
     * @defaultValue 'false'
     */
    'elk.interactiveLayout'?: 'true' | 'false';
    /**
     * Node micro layout comprises the computation of node dimensions (if requested), the placement of
     * ports and their labels, and the placement of node labels. The functionality is implemented
     * independent of any specific layout algorithm and shouldn't have any negative impact on the
     * layout algorithm's performance itself. Yet, if any unforeseen behavior occurs, this option
     * allows to deactivate the micro layout.
     * @defaultValue 'false'
     */
    'elk.omitNodeMicroLayout'?: 'true' | 'false';
    /**
     * For layouts transferred into JSON graphs, specify the coordinate system to be used for nodes,
     * ports, and labels of nodes and ports.
     * @defaultValue 'INHERIT'
     */
    'elk.json.shapeCoords'?: ShapeCoords;
    /**
     * For layouts transferred into JSON graphs, specify the coordinate system to be used for edge
     * route points and edge labels.
     * @defaultValue 'INHERIT'
     */
    'elk.json.edgeCoords'?: EdgeCoords;
    /**
     * Spacing to be preserved between a comment box and other comment boxes connected to the same
     * node. The space left between comment boxes of different nodes is controlled by the node-node
     * spacing.
     * @defaultValue '10'
     */
    'elk.spacing.commentComment'?: `${number}`;
    /**
     * Spacing to be preserved between a node and its connected comment boxes. The space left between a
     * node and the comments of another node is controlled by the node-node spacing.
     * @defaultValue '10'
     */
    'elk.spacing.commentNode'?: `${number}`;
    /**
     * Spacing to be preserved between pairs of connected components. This option is only relevant if
     * 'separateConnectedComponents' is activated.
     * @defaultValue '20'
     */
    'elk.spacing.componentComponent'?: `${number}`;
    /**
     * Spacing to be preserved between any two edges. Note that while this can somewhat easily be
     * satisfied for the segments of orthogonally drawn edges, it is harder for general polylines or
     * splines.
     * @defaultValue '10'
     */
    'elk.spacing.edgeEdge'?: `${number}`;
    /**
     * The minimal distance to be preserved between a label and the edge it is associated with. Note
     * that the placement of a label is influenced by the 'edgelabels.placement' option.
     * @defaultValue '2'
     */
    'elk.spacing.edgeLabel'?: `${number}`;
    /**
     * Spacing to be preserved between nodes and edges.
     * @defaultValue '10'
     */
    'elk.spacing.edgeNode'?: `${number}`;
    /**
     * Determines the amount of space to be left between two labels of the same graph element.
     * @defaultValue '0'
     */
    'elk.spacing.labelLabel'?: `${number}`;
    /**
     * Spacing to be preserved between labels and the border of node they are associated with. Note
     * that the placement of a label is influenced by the 'nodelabels.placement' option.
     * @defaultValue '5'
     */
    'elk.spacing.labelNode'?: `${number}`;
    /**
     * Horizontal spacing to be preserved between labels and the ports they are associated with. Note
     * that the placement of a label is influenced by the 'portlabels.placement' option.
     * @defaultValue '1'
     */
    'elk.spacing.labelPortHorizontal'?: `${number}`;
    /**
     * Vertical spacing to be preserved between labels and the ports they are associated with. Note
     * that the placement of a label is influenced by the 'portlabels.placement' option.
     * @defaultValue '1'
     */
    'elk.spacing.labelPortVertical'?: `${number}`;
    /**
     * The minimal distance to be preserved between each two nodes.
     * @defaultValue '20'
     */
    'elk.spacing.nodeNode'?: `${number}`;
    /**
     * Spacing to be preserved between a node and its self loops.
     * @defaultValue '10'
     */
    'elk.spacing.nodeSelfLoop'?: `${number}`;
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
     * Additional space around the sets of ports on each node side. For each side of a node, this
     * option can reserve additional space before and after the ports on each side. For example, a top
     * spacing of 20 makes sure that the first port on the western and eastern side is 20 units away
     * from the northern border.
     * @defaultValue `new ElkMargin(0)`
     */
    'elk.spacing.portsSurrounding'?: string;
    /**
     * Partition to which the node belongs. This requires Layout Partitioning to be active. Nodes with
     * lower partition IDs will appear to the left of nodes with higher partition IDs (assuming a
     * left-to-right layout direction).
     */
    'elk.partitioning.partition'?: `${number}`;
    /**
     * Whether to activate partitioned layout. This will allow to group nodes through the Layout
     * Partition option. a pair of nodes with different partition indices is then placed such that the
     * node with lower index is placed to the left of the other node (with left-to-right layout
     * direction). Depending on the layout algorithm, this may only be guaranteed to work if all nodes
     * have a layout partition configured, or at least if edges that cross partitions are not part of a
     * partition-crossing cycle.
     * @defaultValue 'false'
     */
    'elk.partitioning.activate'?: 'true' | 'false';
    /**
     * Define padding for node labels that are placed inside of a node.
     * @defaultValue `new ElkPadding(5)`
     */
    'elk.nodeLabels.padding'?: string;
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
     * Seed used for pseudo-random number generators to control the layout algorithm. If the value is
     * 0, the seed shall be determined pseudo-randomly (e.g. from the system time).
     */
    'elk.randomSeed'?: `${number}`;
    /**
     * Whether each connected component should be processed separately.
     */
    'elk.separateConnectedComponents'?: 'true' | 'false';
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
     * By default, the fixed layout provider will enlarge a graph until it is large enough to contain
     * its children. If this option is set, it won't do so.
     * @defaultValue 'false'
     */
    'elk.nodeSize.fixedGraphSize'?: 'true' | 'false';
    /**
     * This option is not used as option, but as output of the layout algorithms. It is attached to
     * edges and determines the points where junction symbols should be drawn in order to represent
     * hyperedges with orthogonal routing. Whether such points are computed depends on the chosen
     * layout algorithm and edge routing style. The points are put into the vector chain with no
     * specific order.
     * @defaultValue `new KVectorChain()`
     */
    'elk.junctionPoints'?: string;
    /**
     * Whether the node should be regarded as a comment box instead of a regular node. In that case its
     * placement should be similar to how labels are handled. Any edges incident to a comment box
     * specify to which graph elements the comment is related.
     * @defaultValue 'false'
     */
    'elk.commentBox'?: 'true' | 'false';
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
     * Whether the node should be handled as a hypernode.
     * @defaultValue 'false'
     */
    'elk.hypernode'?: 'true' | 'false';
    /**
     * Determines the amount of fuzziness to be used when performing softwrapping on labels. The value
     * expresses the percent of overhang that is permitted for each line. If the next line would take
     * up less space than this threshold, it is appended to the current line instead of being placed in
     * a new line.
     * @defaultValue '0.0'
     */
    'elk.softwrappingFuzziness'?: `${number}`;
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
     * The offset to the port position where connections shall be attached.
     */
    'elk.port.anchor'?: string;
    /**
     * The index of a port in the fixed order around a node. The order is assumed as clockwise,
     * starting with the leftmost port on the top side. This option must be set if 'Port Constraints'
     * is set to FIXED_ORDER and no specific positions are given for the ports. Additionally, the
     * option 'Port Side' must be defined in this case.
     */
    'elk.port.index'?: `${number}`;
    /**
     * The side of a node on which a port is situated. This option must be set if 'Port Constraints' is
     * set to FIXED_SIDE or FIXED_ORDER and no specific positions are given for the ports.
     * @defaultValue 'UNDEFINED'
     */
    'elk.port.side'?: PortSide;
    /**
     * The offset of ports on the node border. With a positive offset the port is moved outside of the
     * node, while with a negative offset the port is moved towards the inside. An offset of 0 means
     * that the port is placed directly on the node border, i.e. if the port side is north, the port's
     * south border touches the nodes's north border; if the port side is east, the port's west border
     * touches the nodes's east border; if the port side is south, the port's north border touches the
     * node's south border; if the port side is west, the port's east border touches the node's west
     * border.
     */
    'elk.port.borderOffset'?: `${number}`;
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
     * The width of the area occupied by the laid out children of a node.
     */
    'elk.childAreaWidth'?: `${number}`;
    /**
     * The height of the area occupied by the laid out children of a node.
     */
    'elk.childAreaHeight'?: `${number}`;
    /**
     * Turns topdown layout on and off. If this option is enabled, hierarchical layout will be computed
     * first for the root node and then for its children recursively. Layouts are then scaled down to
     * fit the area provided by their parents. Graphs must follow a certain structure for topdown
     * layout to work properly. `TopdownNodeTypes.PARALLEL_NODE` nodes must have children of type
     * `TopdownNodeTypes.HIERARCHICAL_NODE` and must define `topdown.hierarchicalNodeWidth` and
     * `topdown.hierarchicalNodeAspectRatio` for their children. Furthermore they need to be laid out
     * using an algorithm that is a `TopdownLayoutProvider`. Hierarchical nodes can also be parents of
     * other hierarchical nodes and can optionally use a `TopdownSizeApproximator` to dynamically set
     * sizes during topdown layout. In this case `topdown.hierarchicalNodeWidth` and
     * `topdown.hierarchicalNodeAspectRatio` should be set on the node itself rather than the parent.
     * The values are then used by the size approximator as base values. Hierarchical nodes require the
     * layout option `nodeSize.fixedGraphSize` to be true to prevent the algorithm used there from
     * resizing the hierarchical node. This option is not supported if 'Hierarchy Handling' is set to
     * 'INCLUDE_CHILDREN'
     * @defaultValue 'false'
     */
    'elk.topdownLayout'?: 'true' | 'false';
    /**
     * Defines the number of categories to use for the FIXED_INTEGER_RATIO_BOXES size approximator.
     * @defaultValue '3'
     */
    'elk.topdown.sizeCategories'?: `${number}`;
    /**
     * When determining the graph size for the size categorisation, this value determines how many
     * times a node containing children is weighted more than a simple node. For example setting this
     * value to four would result in a graph containing a simple node and a hierarchical node to be
     * counted as having a size of five.
     * @defaultValue '4'
     */
    'elk.topdown.sizeCategoriesHierarchicalNodeWeight'?: `${number}`;
    /**
     * The scaling factor to be applied to the nodes laid out within the node in recursive topdown
     * layout. The difference to 'Scale Factor' is that the node itself is not scaled. This value has
     * to be set on hierarchical nodes.
     * @defaultValue '1'
     */
    'elk.topdown.scaleFactor'?: `${number}`;
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
     * Determines the upper limit for the topdown scale factor. The default value is 1.0 which ensures
     * that nested children never end up appearing larger than their parents in terms of unit sizes
     * such as the font size. If the limit is larger, nodes will fully utilize the available space, but
     * it is counteriniuitive for inner nodes to have a larger scale than outer nodes.
     * @defaultValue '1'
     */
    'elk.topdown.scaleCap'?: `${number}`;
    /**
     * Whether this node allows to route self loops inside of it instead of around it. If set to true,
     * this will make the node a compound node if it isn't already, and will require the layout
     * algorithm to support compound nodes with hierarchical ports.
     * @defaultValue 'false'
     */
    'elk.insideSelfLoops.activate'?: 'true' | 'false';
    /**
     * Whether a self loop should be routed inside a node instead of around that node.
     * @defaultValue 'false'
     */
    'elk.insideSelfLoops.yo'?: 'true' | 'false';
    /**
     * The thickness of an edge. This is a hint on the line width used to draw an edge, possibly
     * requiring more space to be reserved for it.
     * @defaultValue '1'
     */
    'elk.edge.thickness'?: `${number}`;
    /**
     * The type of an edge. This is usually used for UML class diagrams, where associations must be
     * handled differently from generalizations.
     * @defaultValue 'NONE'
     */
    'elk.edge.type'?: EdgeType;
    /**
     * Whether the shift from the old layout to the new computed layout shall be animated.
     * @defaultValue 'true'
     */
    'elk.animate'?: 'true' | 'false';
    /**
     * Factor for computation of animation time. The higher the value, the longer the animation time.
     * If the value is 0, the resulting time is always equal to the minimum defined by 'Minimal
     * Animation Time'.
     * @defaultValue '100'
     */
    'elk.animTimeFactor'?: `${number}`;
    /**
     * Whether the hierarchy levels on the path from the selected element to the root of the diagram
     * shall be included in the layout process.
     * @defaultValue 'false'
     */
    'elk.layoutAncestors'?: 'true' | 'false';
    /**
     * The maximal time for animations, in milliseconds.
     * @defaultValue '4000'
     */
    'elk.maxAnimTime'?: `${number}`;
    /**
     * The minimal time for animations, in milliseconds.
     * @defaultValue '400'
     */
    'elk.minAnimTime'?: `${number}`;
    /**
     * Whether a progress bar shall be displayed during layout computations.
     * @defaultValue 'false'
     */
    'elk.progressBar'?: 'true' | 'false';
    /**
     * Whether the graph shall be validated before any layout algorithm is applied. If this option is
     * enabled and at least one error is found, the layout process is aborted and a message is shown to
     * the user.
     * @defaultValue 'false'
     */
    'elk.validateGraph'?: 'true' | 'false';
    /**
     * Whether layout options shall be validated before any layout algorithm is applied. If this option
     * is enabled and at least one error is found, the layout process is aborted and a message is shown
     * to the user.
     * @defaultValue 'true'
     */
    'elk.validateOptions'?: 'true' | 'false';
    /**
     * Whether the zoom level shall be set to view the whole diagram after layout.
     * @defaultValue 'false'
     */
    'elk.zoomToFit'?: 'true' | 'false';
    /**
     * Strategy for cycle breaking. Cycle breaking looks for cycles in the graph and determines which
     * edges to reverse to break the cycles. Reversed edges will end up pointing to the opposite
     * direction of regular edges (that is, reversed edges will point left if edges usually point
     * right).
     * @defaultValue 'GREEDY'
     */
    'elk.layered.cycleBreaking.strategy'?: CycleBreakingStrategy;
    /**
     * Strategy for node layering.
     * @defaultValue 'NETWORK_SIMPLEX'
     */
    'elk.layered.layering.strategy'?: LayeringStrategy;
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
     * Defines a loose upper bound on the width of the MinWidth layerer. If set to '-1' multiple values
     * are tested and the best result is selected.
     * @defaultValue '4'
     */
    'elk.layered.layering.minWidth.upperBoundOnWidth'?: `${number}`;
    /**
     * Multiplied with Upper Bound On Width for defining an upper bound on the width of layers which
     * haven't been determined yet, but whose maximum width had been (roughly) estimated by the
     * MinWidth algorithm. Compensates for too high estimations. If set to '-1' multiple values are
     * tested and the best result is selected.
     * @defaultValue '2'
     */
    'elk.layered.layering.minWidth.upperLayerEstimationScalingFactor'?: `${number}`;
    /**
     * Reduces number of dummy nodes after layering phase (if possible).
     * @defaultValue 'NONE'
     */
    'elk.layered.layering.nodePromotion.strategy'?: NodePromotionStrategy;
    /**
     * Limits the number of iterations for node promotion.
     * @defaultValue '0'
     */
    'elk.layered.layering.nodePromotion.maxIterations'?: `${number}`;
    /**
     * The maximum number of nodes allowed per layer.
     * @defaultValue 'MAX_VALUE'
     */
    'elk.layered.layering.coffmanGraham.layerBound'?: `${number}`;
    /**
     * Strategy for crossing minimization.
     * @defaultValue 'LAYER_SWEEP'
     */
    'elk.layered.crossingMinimization.strategy'?: CrossingMinimizationStrategy;
    /**
     * The node order given by the model does not change to produce a better layout. E.g. if node A is
     * before node B in the model this is not changed during crossing minimization. This assumes that
     * the node model order is already respected before crossing minimization. This can be achieved by
     * setting considerModelOrder.strategy to NODES_AND_EDGES.
     * @defaultValue 'false'
     */
    'elk.layered.crossingMinimization.forceNodeModelOrder'?: 'true' | 'false';
    /**
     * How likely it is to use cross-hierarchy (1) vs bottom-up (-1).
     * @defaultValue '0.1'
     */
    'elk.layered.crossingMinimization.hierarchicalSweepiness'?: `${number}`;
    /**
     * By default it is decided automatically if the greedy switch is activated or not. The decision is
     * based on whether the size of the input graph (without dummy nodes) is smaller than the value of
     * this option. A '0' enforces the activation.
     * @defaultValue '40'
     */
    'elk.layered.crossingMinimization.greedySwitch.activationThreshold'?: `${number}`;
    /**
     * Greedy Switch strategy for crossing minimization. The greedy switch heuristic is executed after
     * the regular crossing minimization as a post-processor. Note that if 'hierarchyHandling' is set
     * to 'INCLUDE_CHILDREN', the 'greedySwitchHierarchical.type' option must be used.
     * @defaultValue 'TWO_SIDED'
     */
    'elk.layered.crossingMinimization.greedySwitch.type'?: GreedySwitchType;
    /**
     * Activates the greedy switch heuristic in case hierarchical layout is used. The differences to
     * the non-hierarchical case (see 'greedySwitch.type') are: 1) greedy switch is inactive by
     * default, 3) only the option value set on the node at which hierarchical layout starts is
     * relevant, and 2) if it's activated by the user, it properly addresses hierarchy-crossing edges.
     * @defaultValue 'OFF'
     */
    'elk.layered.crossingMinimization.greedySwitchHierarchical.type'?: GreedySwitchType;
    /**
     * Preserves the order of nodes within a layer but still minimizes crossings between edges
     * connecting long edge dummies. Derives the desired order from positions specified by the
     * 'org.eclipse.elk.position' layout option. Requires a crossing minimization strategy that is able
     * to process 'in-layer' constraints.
     * @defaultValue 'false'
     */
    'elk.layered.crossingMinimization.semiInteractive'?: 'true' | 'false';
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
     * Strategy for node placement.
     * @defaultValue 'BRANDES_KOEPF'
     */
    'elk.layered.nodePlacement.strategy'?: NodePlacementStrategy;
    /**
     * Favor straight edges over a balanced node placement. The default behavior is determined
     * automatically based on the used 'edgeRouting'. For an orthogonal style it is set to true, for
     * all other styles to false.
     */
    'elk.layered.nodePlacement.favorStraightEdges'?: 'true' | 'false';
    /**
     * Specifies whether the Brandes Koepf node placer tries to increase the number of straight edges
     * at the expense of diagram size. There is a subtle difference to the 'favorStraightEdges' option,
     * which decides whether a balanced placement of the nodes is desired, or not. In bk terms this
     * means combining the four alignments into a single balanced one, or not. This option on the other
     * hand tries to straighten additional edges during the creation of each of the four alignments.
     * @defaultValue 'IMPROVE_STRAIGHTNESS'
     */
    'elk.layered.nodePlacement.bk.edgeStraightening'?: EdgeStraighteningStrategy;
    /**
     * Tells the BK node placer to use a certain alignment (out of its four) instead of the one
     * producing the smallest height, or the combination of all four.
     * @defaultValue 'NONE'
     */
    'elk.layered.nodePlacement.bk.fixedAlignment'?: FixedAlignment;
    /**
     * Dampens the movement of nodes to keep the diagram from getting too large.
     * @defaultValue '0.3'
     */
    'elk.layered.nodePlacement.linearSegments.deflectionDampening'?: `${number}`;
    /**
     * Aims at shorter and straighter edges. Two configurations are possible: (a) allow ports to move
     * freely on the side they are assigned to (the order is always defined beforehand), (b)
     * additionally allow to enlarge a node wherever it helps. If this option is not configured for a
     * node, the 'nodeFlexibility.default' value is used, which is specified for the node's parent.
     */
    'elk.layered.nodePlacement.networkSimplex.nodeFlexibility'?: NodeFlexibility;
    /**
     * Default value of the 'nodeFlexibility' option for the children of a hierarchical node.
     * @defaultValue 'NONE'
     */
    'elk.layered.nodePlacement.networkSimplex.nodeFlexibility.default'?: NodeFlexibility;
    /**
     * Run a second node placement algorithm after the initial network simplex with node flexibility.
     * In the second run, node flexibility is disabled and a different node placer can be used. The
     * node sizes determined by the node flexibility option are used as fixed node sizes in the second
     * run. If set to null (default) no second run is performed.
     * @defaultValue `null`
     */
    'elk.layered.nodePlacement.networkSimplex.nodeFlexibility.recomputeNodePlacement'?: NodePlacementStrategy;
    /**
     * Specifies the way control points are assembled for each individual edge. CONSERVATIVE ensures
     * that edges are properly routed around the nodes but feels rather orthogonal at times. SLOPPY
     * uses fewer control points to obtain curvier edge routes but may result in edges overlapping
     * nodes.
     * @defaultValue 'SLOPPY'
     */
    'elk.layered.edgeRouting.splines.mode'?: SplineRoutingMode;
    /**
     * Spacing factor for routing area between layers when using sloppy spline routing.
     * @defaultValue '0.2'
     */
    'elk.layered.edgeRouting.splines.sloppy.layerSpacingFactor'?: `${number}`;
    /**
     * Width of the strip to the left and to the right of each layer where the polyline edge router is
     * allowed to refrain from ensuring that edges are routed horizontally. This prevents awkward bend
     * points for nodes that extent almost to the edge of their layer.
     * @defaultValue '2.0'
     */
    'elk.layered.edgeRouting.polyline.slopedEdgeZoneWidth'?: `${number}`;
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
     * An optional base value for all other layout options of the 'spacing' group. It can be used to
     * conveniently alter the overall 'spaciousness' of the drawing. Whenever an explicit value is set
     * for the other layout options, this base value will have no effect. The base value is not
     * inherited, i.e. it must be set for each hierarchical node.
     */
    'elk.layered.spacing.baseValue'?: `${number}`;
    /**
     * The spacing to be preserved between nodes and edges that are routed next to the node's layer.
     * For the spacing between nodes and edges that cross the node's layer 'spacing.edgeNode' is used.
     * @defaultValue '10'
     */
    'elk.layered.spacing.edgeNodeBetweenLayers'?: `${number}`;
    /**
     * Spacing to be preserved between pairs of edges that are routed between the same pair of layers.
     * Note that 'spacing.edgeEdge' is used for the spacing between pairs of edges crossing the same
     * layer.
     * @defaultValue '10'
     */
    'elk.layered.spacing.edgeEdgeBetweenLayers'?: `${number}`;
    /**
     * The spacing to be preserved between any pair of nodes of two adjacent layers. Note that
     * 'spacing.nodeNode' is used for the spacing between nodes within the layer itself.
     * @defaultValue '20'
     */
    'elk.layered.spacing.nodeNodeBetweenLayers'?: `${number}`;
    /**
     * Defines how important it is to have a certain edge point into the direction of the overall
     * layout. This option is evaluated during the cycle breaking phase.
     * @defaultValue '0'
     */
    'elk.layered.priority.direction'?: `${number}`;
    /**
     * Defines how important it is to keep an edge as short as possible. This option is evaluated
     * during the layering phase.
     * @defaultValue '0'
     */
    'elk.layered.priority.shortness'?: `${number}`;
    /**
     * Defines how important it is to keep an edge straight, i.e. aligned with one of the two axes.
     * This option is evaluated during node placement.
     * @defaultValue '0'
     */
    'elk.layered.priority.straightness'?: `${number}`;
    /**
     * Specifies whether and how post-process compaction is applied.
     * @defaultValue 'NONE'
     */
    'elk.layered.compaction.postCompaction.strategy'?: GraphCompactionStrategy;
    /**
     * Specifies whether and how post-process compaction is applied.
     * @defaultValue 'SCANLINE'
     */
    'elk.layered.compaction.postCompaction.constraints'?: ConstraintCalculationStrategy;
    /**
     * Tries to further compact components (disconnected sub-graphs).
     * @defaultValue 'false'
     */
    'elk.layered.compaction.connectedComponents'?: 'true' | 'false';
    /**
     * Makes room around high degree nodes to place leafs and trees.
     * @defaultValue 'false'
     */
    'elk.layered.highDegreeNodes.treatment'?: 'true' | 'false';
    /**
     * Whether a node is considered to have a high degree.
     * @defaultValue '16'
     */
    'elk.layered.highDegreeNodes.threshold'?: `${number}`;
    /**
     * Maximum height of a subtree connected to a high degree node to be moved to separate layers.
     * @defaultValue '5'
     */
    'elk.layered.highDegreeNodes.treeHeight'?: `${number}`;
    /**
     * For certain graphs and certain prescribed drawing areas it may be desirable to split the laid
     * out graph into chunks that are placed side by side. The edges that connect different chunks are
     * 'wrapped' around from the end of one chunk to the start of the other chunk. The points between
     * the chunks are referred to as 'cuts'.
     * @defaultValue 'OFF'
     */
    'elk.layered.wrapping.strategy'?: WrappingStrategy;
    /**
     * To visually separate edges that are wrapped from regularly routed edges an additional spacing
     * value can be specified in form of this layout option. The spacing is added to the regular
     * edgeNode spacing.
     * @defaultValue '10'
     */
    'elk.layered.wrapping.additionalEdgeSpacing'?: `${number}`;
    /**
     * At times and for certain types of graphs the executed wrapping may produce results that are
     * consistently biased in the same fashion: either wrapping to often or to rarely. This factor can
     * be used to correct the bias. Internally, it is simply multiplied with the 'aspect ratio' layout
     * option.
     * @defaultValue '1.0'
     */
    'elk.layered.wrapping.correctionFactor'?: `${number}`;
    /**
     * The strategy by which the layer indexes are determined at which the layering crumbles into
     * chunks.
     * @defaultValue 'MSD'
     */
    'elk.layered.wrapping.cutting.strategy'?: CuttingStrategy;
    /**
     * Allows the user to specify her own cuts for a certain graph.
     */
    'elk.layered.wrapping.cutting.cuts'?: string;
    /**
     * The MSD cutting strategy starts with an initial guess on the number of chunks the graph should
     * be split into. The freedom specifies how much the strategy may deviate from this guess. E.g. if
     * an initial number of 3 is computed, a freedom of 1 allows 2, 3, and 4 cuts.
     * @defaultValue '1'
     */
    'elk.layered.wrapping.cutting.msd.freedom'?: `${number}`;
    /**
     * When wrapping graphs, one can specify indices that are not allowed as split points. The
     * validification strategy makes sure every computed split point is allowed.
     * @defaultValue 'GREEDY'
     */
    'elk.layered.wrapping.validify.strategy'?: ValidifyStrategy;
    /**
     */
    'elk.layered.wrapping.validify.forbiddenIndices'?: string;
    /**
     * For general graphs it is important that not too many edges wrap backwards. Thus a compromise
     * between evenly-distributed cuts and the total number of cut edges is sought.
     * @defaultValue 'true'
     */
    'elk.layered.wrapping.multiEdge.improveCuts'?: 'true' | 'false';
    /**
     * @defaultValue '2.0'
     */
    'elk.layered.wrapping.multiEdge.distancePenalty'?: `${number}`;
    /**
     * The initial wrapping is performed in a very simple way. As a consequence, edges that wrap from
     * one chunk to another may be unnecessarily long. Activating this option tries to shorten such
     * edges.
     * @defaultValue 'true'
     */
    'elk.layered.wrapping.multiEdge.improveWrappedEdges'?: 'true' | 'false';
    /**
     * The strategy to use for unzipping a layer into multiple sublayers while maintaining the existing
     * ordering of nodes and edges after crossing minimization. The default value is 'NONE'.
     * @defaultValue 'NONE'
     */
    'elk.layered.layerUnzipping.strategy'?: LayerUnzippingStrategy;
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
     * Method to decide on edge label sides.
     * @defaultValue 'SMART_DOWN'
     */
    'elk.layered.edgeLabels.sideSelection'?: EdgeLabelSideSelection;
    /**
     * Determines in which layer center labels of long edges should be placed.
     * @defaultValue 'MEDIAN_LAYER'
     */
    'elk.layered.edgeLabels.centerLabelPlacementStrategy'?: CenterEdgeLabelPlacementStrategy;
    /**
     * Preserves the order of nodes and edges in the model file if this does not lead to additional
     * edge crossings. Depending on the strategy this is not always possible since the node and edge
     * order might be conflicting.
     * @defaultValue 'NONE'
     */
    'elk.layered.considerModelOrder.strategy'?: OrderingStrategy;
    /**
     * If disabled the port order of output ports is derived from the edge order and input ports are
     * ordered by their incoming connections. If enabled all ports are ordered by the port model order.
     * @defaultValue 'false'
     */
    'elk.layered.considerModelOrder.portModelOrder'?: 'true' | 'false';
    /**
     * Set on a node to not set a model order for this node even though it is a real node.
     * @defaultValue 'false'
     */
    'elk.layered.considerModelOrder.noModelOrder'?: 'true' | 'false';
    /**
     * If set to NONE the usual ordering strategy (by cumulative node priority and size of nodes) is
     * used. INSIDE_PORT_SIDES orders the components with external ports only inside the groups with
     * the same port side. FORCE_MODEL_ORDER enforces the mode order on components. This option might
     * produce bad alignments and sub optimal drawings in terms of used area since the ordering should
     * be respected.
     * @defaultValue 'NONE'
     */
    'elk.layered.considerModelOrder.components'?: ComponentOrderingStrategy;
    /**
     * Indicates whether long edges are sorted under, over, or equal to nodes that have no connection
     * to a previous layer in a left-to-right or right-to-left layout. Under and over changes to right
     * and left in a vertical layout.
     * @defaultValue 'DUMMY_NODE_OVER'
     */
    'elk.layered.considerModelOrder.longEdgeStrategy'?: LongEdgeOrderingStrategy;
    /**
     * Indicates with what percentage (1 for 100%) violations of the node model order are weighted
     * against the crossings e.g. a value of 0.5 means two model order violations are as important as
     * on edge crossing. This allows some edge crossings in favor of preserving the model order. It is
     * advised to set this value to a very small positive value (e.g. 0.001) to have minimal crossing
     * and a optimal node order. Defaults to no influence (0).
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.crossingCounterNodeInfluence'?: `${number}`;
    /**
     * Indicates with what percentage (1 for 100%) violations of the port model order are weighted
     * against the crossings e.g. a value of 0.5 means two model order violations are as important as
     * on edge crossing. This allows some edge crossings in favor of preserving the model order. It is
     * advised to set this value to a very small positive value (e.g. 0.001) to have minimal crossing
     * and a optimal port order. Defaults to no influence (0).
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.crossingCounterPortInfluence'?: `${number}`;
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
    /**
     * Determines how to count ordering violations during cycle breaking. NONE: They do not count.
     * ENFORCED: A group with a higher model order is before a node with a smaller. MODEL_ORDER: The
     * model order counts instead of the model order group id ordering.
     * @defaultValue 'ONLY_WITHIN_GROUP'
     */
    'elk.layered.considerModelOrder.groupModelOrder.cbGroupOrderStrategy'?: GroupOrderStrategy;
    /**
     * The model order group id for which should be preferred as a source if possible.
     */
    'elk.layered.considerModelOrder.groupModelOrder.cbPreferredSourceId'?: `${number}`;
    /**
     * The model order group id for which should be preferred as a target if possible.
     */
    'elk.layered.considerModelOrder.groupModelOrder.cbPreferredTargetId'?: `${number}`;
    /**
     * Determines how to count ordering violations during crossing minimization. NONE: They do not
     * count. ENFORCED: A group with a lower id is before a group with a higher id. MODEL_ORDER: The
     * model order counts instead of the model order group id ordering.
     * @defaultValue 'ONLY_WITHIN_GROUP'
     */
    'elk.layered.considerModelOrder.groupModelOrder.cmGroupOrderStrategy'?: GroupOrderStrategy;
    /**
     * Holds all group ids which are enforcing their order during crossing minimization strategies.
     * E.g. if only groups 2 and -1 (default) enforce their ordering. Other groups e.g. the group of
     * timer nodes can be ordered arbitrarily if it helps and the mentioned groups may not change their
     * order.
     * @defaultValue `#[1, 2, 6, 7, 10, 11]`
     */
    'elk.layered.considerModelOrder.groupModelOrder.cmEnforcedGroupOrders'?: string;
    /**
     * Specifies how drawings of the same graph with different layout directions compare to each other:
     * either a natural reading direction is preserved or the drawings are rotated versions of each
     * other.
     * @defaultValue 'READING_DIRECTION'
     */
    'elk.layered.directionCongruency'?: DirectionCongruency;
    /**
     * Whether feedback edges should be highlighted by routing around the nodes.
     * @defaultValue 'false'
     */
    'elk.layered.feedbackEdges'?: 'true' | 'false';
    /**
     * Determines which point of a node is considered by interactive layout phases.
     * @defaultValue 'CENTER'
     */
    'elk.layered.interactiveReferencePoint'?: InteractiveReferencePoint;
    /**
     * Edges that have no ports are merged so they touch the connected nodes at the same points. When
     * this option is disabled, one port is created for each edge directly connected to a node. When it
     * is enabled, all such incoming edges share an input port, and all outgoing edges share an output
     * port.
     * @defaultValue 'false'
     */
    'elk.layered.mergeEdges'?: 'true' | 'false';
    /**
     * If hierarchical layout is active, hierarchy-crossing edges use as few hierarchical ports as
     * possible. They are broken by the algorithm, with hierarchical ports inserted as required.
     * Usually, one such port is created for each edge at each hierarchy crossing point. With this
     * option set to true, we try to create as few hierarchical ports as possible in the process. In
     * particular, all edges that form a hyperedge can share a port.
     * @defaultValue 'true'
     */
    'elk.layered.mergeHierarchyEdges'?: 'true' | 'false';
    /**
     * Specifies whether non-flow ports may switch sides if their node's port constraints are either
     * FIXED_SIDE or FIXED_ORDER. A non-flow port is a port on a side that is not part of the currently
     * configured layout flow. For instance, given a left-to-right layout direction, north and south
     * ports would be considered non-flow ports. Further note that the underlying criterium whether to
     * switch sides or not solely relies on the minimization of edge crossings. Hence, edge length and
     * other aesthetics criteria are not addressed.
     * @defaultValue 'false'
     */
    'elk.layered.allowNonFlowPortsToSwitchSides'?: 'true' | 'false';
    /**
     * Only relevant for nodes with FIXED_SIDE port constraints. Determines the way a node's ports are
     * distributed on the sides of a node if their order is not prescribed. The option is set on parent
     * nodes.
     * @defaultValue 'INPUT_ORDER'
     */
    'elk.layered.portSortingStrategy'?: PortSortingStrategy;
    /**
     * How much effort should be spent to produce a nice layout.
     * @defaultValue '7'
     */
    'elk.layered.thoroughness'?: `${number}`;
    /**
     * Adds bend points even if an edge does not change direction. If true, each long edge dummy will
     * contribute a bend point to its edges and hierarchy-crossing edges will always get a bend point
     * where they cross hierarchy boundaries. By default, bend points are only added where an edge
     * changes direction.
     * @defaultValue 'false'
     */
    'elk.layered.unnecessaryBendpoints'?: 'true' | 'false';
    /**
     * If enabled position id and layer id are generated, which are usually only used internally when
     * setting the interactiveLayout option. This option should be specified on the root node.
     * @defaultValue 'false'
     */
    'elk.layered.generatePositionAndLayerIds'?: 'true' | 'false';
}

// ELK enum-typed option values.
export type ElkAlgorithm = 'layered' | 'stress' | 'mrtree' | 'radial' | 'force' | 'disco' | 'box' | 'fixed' | 'random' | (string & {});
export type Alignment = 'AUTOMATIC' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'CENTER';
export type ContentAlignment = 'V_TOP' | 'V_CENTER' | 'V_BOTTOM' | 'H_LEFT' | 'H_CENTER' | 'H_RIGHT';
export type Direction = 'UNDEFINED' | 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';
export type EdgeRouting = 'UNDEFINED' | 'POLYLINE' | 'ORTHOGONAL' | 'SPLINES';
export type HierarchyHandling = 'INHERIT' | 'INCLUDE_CHILDREN' | 'SEPARATE_CHILDREN';
export type ShapeCoords = 'INHERIT' | 'PARENT' | 'ROOT';
export type EdgeCoords = 'INHERIT' | 'CONTAINER' | 'PARENT' | 'ROOT';
export type NodeLabelPlacement = 'H_LEFT' | 'H_CENTER' | 'H_RIGHT' | 'V_TOP' | 'V_CENTER' | 'V_BOTTOM' | 'INSIDE' | 'OUTSIDE' | 'H_PRIORITY';
export type PortAlignment = 'DISTRIBUTED' | 'JUSTIFIED' | 'BEGIN' | 'CENTER' | 'END';
export type PortConstraints = 'UNDEFINED' | 'FREE' | 'FIXED_SIDE' | 'FIXED_ORDER' | 'FIXED_RATIO' | 'FIXED_POS';
export type SizeConstraint = 'PORTS' | 'PORT_LABELS' | 'NODE_LABELS' | 'MINIMUM_SIZE';
export type SizeOptions = 'DEFAULT_MINIMUM_SIZE' | 'MINIMUM_SIZE_ACCOUNTS_FOR_PADDING' | 'COMPUTE_PADDING' | 'OUTSIDE_NODE_LABELS_OVERHANG' | 'PORTS_OVERHANG' | 'UNIFORM_PORT_SPACING' | 'SPACE_EFFICIENT_PORT_LABELS' | 'FORCE_TABULAR_NODE_LABELS' | 'ASYMMETRICAL';
export type EdgeLabelPlacement = 'CENTER' | 'HEAD' | 'TAIL';
export type PortSide = 'UNDEFINED' | 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';
export type PortLabelPlacement = 'OUTSIDE' | 'INSIDE' | 'NEXT_TO_PORT_IF_POSSIBLE' | 'ALWAYS_SAME_SIDE' | 'ALWAYS_OTHER_SAME_SIDE' | 'SPACE_EFFICIENT';
export type TopdownNodeTypes = 'PARALLEL_NODE' | 'HIERARCHICAL_NODE' | 'ROOT_NODE';
export type EdgeType = 'NONE' | 'DIRECTED' | 'UNDIRECTED' | 'ASSOCIATION' | 'GENERALIZATION' | 'DEPENDENCY';
export type CycleBreakingStrategy = 'GREEDY' | 'DEPTH_FIRST' | 'INTERACTIVE' | 'MODEL_ORDER' | 'GREEDY_MODEL_ORDER' | 'SCC_CONNECTIVITY' | 'SCC_NODE_TYPE' | 'DFS_NODE_ORDER' | 'BFS_NODE_ORDER';
export type LayeringStrategy = 'NETWORK_SIMPLEX' | 'LONGEST_PATH' | 'LONGEST_PATH_SOURCE' | 'COFFMAN_GRAHAM' | 'INTERACTIVE' | 'STRETCH_WIDTH' | 'MIN_WIDTH' | 'BF_MODEL_ORDER' | 'DF_MODEL_ORDER';
export type LayerConstraint = 'NONE' | 'FIRST' | 'FIRST_SEPARATE' | 'LAST' | 'LAST_SEPARATE';
export type NodePromotionStrategy = 'NONE' | 'NIKOLOV' | 'NIKOLOV_PIXEL' | 'NIKOLOV_IMPROVED' | 'NIKOLOV_IMPROVED_PIXEL' | 'DUMMYNODE_PERCENTAGE' | 'NODECOUNT_PERCENTAGE' | 'NO_BOUNDARY' | 'MODEL_ORDER_LEFT_TO_RIGHT' | 'MODEL_ORDER_RIGHT_TO_LEFT';
export type CrossingMinimizationStrategy = 'LAYER_SWEEP' | 'MEDIAN_LAYER_SWEEP' | 'INTERACTIVE' | 'NONE';
export type GreedySwitchType = 'ONE_SIDED' | 'TWO_SIDED' | 'OFF';
export type NodePlacementStrategy = 'SIMPLE' | 'INTERACTIVE' | 'LINEAR_SEGMENTS' | 'BRANDES_KOEPF' | 'NETWORK_SIMPLEX';
export type EdgeStraighteningStrategy = 'NONE' | 'IMPROVE_STRAIGHTNESS';
export type FixedAlignment = 'NONE' | 'LEFTUP' | 'RIGHTUP' | 'LEFTDOWN' | 'RIGHTDOWN' | 'BALANCED';
export type NodeFlexibility = 'NONE' | 'PORT_POSITION' | 'NODE_SIZE_WHERE_SPACE_PERMITS' | 'NODE_SIZE';
export type SplineRoutingMode = 'CONSERVATIVE' | 'CONSERVATIVE_SOFT' | 'SLOPPY';
export type SelfLoopDistributionStrategy = 'EQUALLY' | 'NORTH' | 'NORTH_SOUTH';
export type SelfLoopOrderingStrategy = 'STACKED' | 'REVERSE_STACKED' | 'SEQUENCED';
export type GraphCompactionStrategy = 'NONE' | 'LEFT' | 'RIGHT' | 'LEFT_RIGHT_CONSTRAINT_LOCKING' | 'LEFT_RIGHT_CONNECTION_LOCKING' | 'EDGE_LENGTH';
export type ConstraintCalculationStrategy = 'QUADRATIC' | 'SCANLINE';
export type WrappingStrategy = 'OFF' | 'SINGLE_EDGE' | 'MULTI_EDGE';
export type CuttingStrategy = 'ARD' | 'MSD' | 'MANUAL';
export type ValidifyStrategy = 'NO' | 'GREEDY' | 'LOOK_BACK';
export type LayerUnzippingStrategy = 'NONE' | 'ALTERNATING';
export type EdgeLabelSideSelection = 'ALWAYS_UP' | 'ALWAYS_DOWN' | 'DIRECTION_UP' | 'DIRECTION_DOWN' | 'SMART_UP' | 'SMART_DOWN';
export type CenterEdgeLabelPlacementStrategy = 'MEDIAN_LAYER' | 'TAIL_LAYER' | 'HEAD_LAYER' | 'SPACE_EFFICIENT_LAYER' | 'WIDEST_LAYER' | 'CENTER_LAYER';
export type OrderingStrategy = 'NONE' | 'NODES_AND_EDGES' | 'PREFER_EDGES' | 'PREFER_NODES';
export type ComponentOrderingStrategy = 'NONE' | 'INSIDE_PORT_SIDE_GROUPS' | 'GROUP_MODEL_ORDER' | 'MODEL_ORDER';
export type LongEdgeOrderingStrategy = 'DUMMY_NODE_OVER' | 'DUMMY_NODE_UNDER' | 'EQUAL';
export type GroupOrderStrategy = 'ONLY_WITHIN_GROUP' | 'MODEL_ORDER' | 'ENFORCED';
export type DirectionCongruency = 'READING_DIRECTION' | 'ROTATION';
export type InteractiveReferencePoint = 'CENTER' | 'TOP_LEFT';
export type PortSortingStrategy = 'INPUT_ORDER' | 'PORT_DEGREE';

// ELK graph element shapes, narrowing `layoutOptions` (and, on `ElkNode`, the element
// arrays it nests) from elkjs's own loosely-typed versions to the option types above.
export interface ElkLabel extends Omit<RawElkLabel, 'layoutOptions'> {
    layoutOptions?: LabelElkLayoutOptions;
}

export interface ElkPort extends Omit<RawElkPort, 'layoutOptions' | 'labels'> {
    layoutOptions?: PortElkLayoutOptions;
    labels?: ElkLabel[];
}

export interface ElkExtendedEdge extends Omit<RawElkExtendedEdge, 'layoutOptions' | 'labels'> {
    layoutOptions?: EdgeElkLayoutOptions;
    labels?: ElkLabel[];
}

export interface ElkNode extends Omit<RawElkNode, 'layoutOptions' | 'children' | 'ports' | 'edges' | 'labels'> {
    layoutOptions?: NodeElkLayoutOptions;
    children?: ElkNode[];
    ports?: ElkPort[];
    edges?: ElkExtendedEdge[];
    labels?: ElkLabel[];
}
