import type { dia, g } from '@joint/core';
import type { ToNativeElkOptions } from './toNativeElkOptions.mjs';
import type {
    Alignment,
    HierarchyHandling,
    PortAlignment,
    PortConstraints,
    LayerConstraint,
    NodeFlexibility,
    SelfLoopDistributionStrategy,
    SelfLoopOrderingStrategy,
    TopdownNodeTypes,
    NodeLabelPlacement,
    SizeConstraint,
    SizeOptions,
    PortLabelPlacement
} from './elkEnums.mjs';

/**
 * An ELK node's layout options in their JointJS spelling - `6`, `true`,
 * `{ left: 10, vertical: 40 }`, `{ x: 10, y: 20 }`, `['INSIDE', 'V_TOP']`.
 *
 * Every option is declared here; {@link NativeElkNodeLayoutOptions} is projected from it. Annotate
 * your own options with this type to be held to the JointJS spelling alone:
 *
 * ```ts
 * const options: StrictElkNodeLayoutOptions = { 'elk.padding': { top: 40 }};
 * ```
 */
export interface StrictElkNodeLayoutOptions {
    // Falls back to any ELK option beyond this package's Core/Layered coverage.
    // Wider than `string`, because TypeScript holds every declared property to the index
    // signature and the ones below are typed `number`, `boolean`, `dia.Sides`,
    // `g.PlainPoint` and arrays of enum values (the options ELK takes a set of values for).
    // (`dia.Sides` already covers `number`; both are spelled out to say which spellings
    // this type takes.)
    [key: string]: string | number | boolean | dia.Sides | g.PlainPoint | readonly string[] | undefined;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-alignment.html
     * @defaultValue 'AUTOMATIC'
     */
    'elk.alignment'?: Alignment;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-hierarchyHandling.html
     * @defaultValue 'INHERIT'
     */
    'elk.hierarchyHandling'?: HierarchyHandling;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-padding.html
     * @defaultValue `new ElkPadding(12)`
     */
    'elk.padding'?: dia.Sides;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-portPort.html
     * @defaultValue '10'
     */
    'elk.spacing.portPort'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-individual.html
     */
    'elk.spacing.individual'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-partitioning-partition.html
     */
    'elk.partitioning.partition'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeLabels-placement.html
     * @defaultValue [] - no placement: a label keeps the position it is given
     */
    'elk.nodeLabels.placement'?: readonly NodeLabelPlacement[];
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portAlignment-default.html
     * @defaultValue 'DISTRIBUTED'
     */
    'elk.portAlignment.default'?: PortAlignment;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portAlignment-north.html
     */
    'elk.portAlignment.north'?: PortAlignment;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portAlignment-south.html
     */
    'elk.portAlignment.south'?: PortAlignment;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portAlignment-west.html
     */
    'elk.portAlignment.west'?: PortAlignment;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portAlignment-east.html
     */
    'elk.portAlignment.east'?: PortAlignment;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portConstraints.html
     * @defaultValue 'UNDEFINED'
     */
    'elk.portConstraints'?: PortConstraints;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-position.html
     */
    'elk.position'?: g.PlainPoint;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-priority.html
     */
    'elk.priority'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeSize-constraints.html
     * @defaultValue []
     */
    'elk.nodeSize.constraints'?: readonly SizeConstraint[];
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeSize-options.html
     * @defaultValue ['DEFAULT_MINIMUM_SIZE']
     */
    'elk.nodeSize.options'?: readonly SizeOptions[];
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeSize-minimum.html
     * @defaultValue `new KVector(0, 0)`
     */
    'elk.nodeSize.minimum'?: g.PlainPoint;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-commentBox.html
     * @defaultValue 'false'
     */
    'elk.commentBox'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-hypernode.html
     * @defaultValue 'false'
     */
    'elk.hypernode'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-margins.html
     * @defaultValue `new ElkMargin()`
     */
    'elk.margins'?: dia.Sides;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-noLayout.html
     * @defaultValue 'false'
     */
    'elk.noLayout'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portLabels-placement.html
     * @defaultValue ['OUTSIDE']
     */
    'elk.portLabels.placement'?: readonly PortLabelPlacement[];
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portLabels-nextToPortIfPossible.html
     * @defaultValue 'false'
     */
    'elk.portLabels.nextToPortIfPossible'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portLabels-treatAsGroup.html
     * @defaultValue 'true'
     */
    'elk.portLabels.treatAsGroup'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-scaleFactor.html
     * @defaultValue '1'
     */
    'elk.scaleFactor'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-sizeApproximator.html
     * @defaultValue `null`
     */
    'elk.topdown.sizeApproximator'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-hierarchicalNodeWidth.html
     * @defaultValue '150'
     */
    'elk.topdown.hierarchicalNodeWidth'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-hierarchicalNodeAspectRatio.html
     * @defaultValue '1.414'
     */
    'elk.topdown.hierarchicalNodeAspectRatio'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-nodeType.html
     * @defaultValue `null`
     */
    'elk.topdown.nodeType'?: TopdownNodeTypes;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-insideSelfLoops-activate.html
     * @defaultValue 'false'
     */
    'elk.insideSelfLoops.activate'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-layerConstraint.html
     * @defaultValue 'NONE'
     */
    'elk.layered.layering.layerConstraint'?: LayerConstraint;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-layerChoiceConstraint.html
     * @defaultValue `null`
     */
    'elk.layered.layering.layerChoiceConstraint'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-layerId.html
     * @defaultValue '-1'
     */
    'elk.layered.layering.layerId'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-inLayerPredOf.html
     * @defaultValue `null`
     */
    'elk.layered.crossingMinimization.inLayerPredOf'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-inLayerSuccOf.html
     * @defaultValue `null`
     */
    'elk.layered.crossingMinimization.inLayerSuccOf'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-positionChoiceConstraint.html
     * @defaultValue `null`
     */
    'elk.layered.crossingMinimization.positionChoiceConstraint'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-positionId.html
     * @defaultValue '-1'
     */
    'elk.layered.crossingMinimization.positionId'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-nodePlacement-networkSimplex-nodeFlexibility.html
     */
    'elk.layered.nodePlacement.networkSimplex.nodeFlexibility'?: NodeFlexibility;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-edgeRouting-selfLoopDistribution.html
     * @defaultValue 'NORTH'
     */
    'elk.layered.edgeRouting.selfLoopDistribution'?: SelfLoopDistributionStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-edgeRouting-selfLoopOrdering.html
     * @defaultValue 'STACKED'
     */
    'elk.layered.edgeRouting.selfLoopOrdering'?: SelfLoopOrderingStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layerUnzipping-minimizeEdgeLength.html
     * @defaultValue 'false'
     */
    'elk.layered.layerUnzipping.minimizeEdgeLength'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layerUnzipping-layerSplit.html
     * @defaultValue '2'
     */
    'elk.layered.layerUnzipping.layerSplit'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layerUnzipping-resetOnLongEdges.html
     * @defaultValue 'true'
     */
    'elk.layered.layerUnzipping.resetOnLongEdges'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-noModelOrder.html
     * @defaultValue 'false'
     */
    'elk.layered.considerModelOrder.noModelOrder'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-groupModelOrder-cycleBreakingId.html
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.groupModelOrder.cycleBreakingId'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-groupModelOrder-crossingMinimizationId.html
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.groupModelOrder.crossingMinimizationId'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-groupModelOrder-componentGroupId.html
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.groupModelOrder.componentGroupId'?: number;
}

/**
 * An ELK node's layout options in ELK's own spelling - every value a string, the way the
 * reference page linked from each option expresses it, and the way options that arrive as
 * data (a saved diagram, a backend's config) are already shaped.
 *
 * Projected from {@link StrictElkNodeLayoutOptions}, so the two cannot drift.
 */
export type NativeElkNodeLayoutOptions = ToNativeElkOptions<StrictElkNodeLayoutOptions>;

/**
 * An ELK node's layout options. Each option takes either spelling, so one object can mix
 * them: `{ 'elk.spacing.nodeNode': 6, 'elk.padding': '[top=12,left=12]' }`.
 *
 * Per key rather than `StrictElkNodeLayoutOptions | NativeElkNodeLayoutOptions`: an object literal
 * mixing the two spellings matches neither arm of a union of the whole types.
 */
export type ElkNodeLayoutOptions = {
    [K in keyof StrictElkNodeLayoutOptions]?: StrictElkNodeLayoutOptions[K] | NativeElkNodeLayoutOptions[K];
};
