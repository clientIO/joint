import type { PortSide } from './elkEnums.mjs';

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
