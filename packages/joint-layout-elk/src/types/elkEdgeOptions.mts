import type { EdgeType } from './elkEnums.mjs';

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
