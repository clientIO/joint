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
    'elk.padding'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-portPort.html
     * @defaultValue '10'
     */
    'elk.spacing.portPort'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-individual.html
     */
    'elk.spacing.individual'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-partitioning-partition.html
     */
    'elk.partitioning.partition'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeLabels-placement.html
     * @defaultValue `NodeLabelPlacement.fixed`
     */
    'elk.nodeLabels.placement'?: string;
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
    'elk.position'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-priority.html
     */
    'elk.priority'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeSize-constraints.html
     * @defaultValue `EnumSet.noneOf(SizeConstraint)`
     */
    'elk.nodeSize.constraints'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeSize-options.html
     * @defaultValue `EnumSet.of(SizeOptions.DEFAULT_MINIMUM_SIZE)`
     */
    'elk.nodeSize.options'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeSize-minimum.html
     * @defaultValue `new KVector(0, 0)`
     */
    'elk.nodeSize.minimum'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-commentBox.html
     * @defaultValue 'false'
     */
    'elk.commentBox'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-hypernode.html
     * @defaultValue 'false'
     */
    'elk.hypernode'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-margins.html
     * @defaultValue `new ElkMargin()`
     */
    'elk.margins'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-noLayout.html
     * @defaultValue 'false'
     */
    'elk.noLayout'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portLabels-placement.html
     * @defaultValue `PortLabelPlacement.outside`
     */
    'elk.portLabels.placement'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portLabels-nextToPortIfPossible.html
     * @defaultValue 'false'
     */
    'elk.portLabels.nextToPortIfPossible'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portLabels-treatAsGroup.html
     * @defaultValue 'true'
     */
    'elk.portLabels.treatAsGroup'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-scaleFactor.html
     * @defaultValue '1'
     */
    'elk.scaleFactor'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-sizeApproximator.html
     * @defaultValue `null`
     */
    'elk.topdown.sizeApproximator'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-hierarchicalNodeWidth.html
     * @defaultValue '150'
     */
    'elk.topdown.hierarchicalNodeWidth'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-hierarchicalNodeAspectRatio.html
     * @defaultValue '1.414'
     */
    'elk.topdown.hierarchicalNodeAspectRatio'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-nodeType.html
     * @defaultValue `null`
     */
    'elk.topdown.nodeType'?: TopdownNodeTypes;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-insideSelfLoops-activate.html
     * @defaultValue 'false'
     */
    'elk.insideSelfLoops.activate'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-layerConstraint.html
     * @defaultValue 'NONE'
     */
    'elk.layered.layering.layerConstraint'?: LayerConstraint;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-layerChoiceConstraint.html
     * @defaultValue `null`
     */
    'elk.layered.layering.layerChoiceConstraint'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-layerId.html
     * @defaultValue '-1'
     */
    'elk.layered.layering.layerId'?: `${number}`;
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
    'elk.layered.crossingMinimization.positionChoiceConstraint'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-positionId.html
     * @defaultValue '-1'
     */
    'elk.layered.crossingMinimization.positionId'?: `${number}`;
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
    'elk.layered.layerUnzipping.minimizeEdgeLength'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layerUnzipping-layerSplit.html
     * @defaultValue '2'
     */
    'elk.layered.layerUnzipping.layerSplit'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layerUnzipping-resetOnLongEdges.html
     * @defaultValue 'true'
     */
    'elk.layered.layerUnzipping.resetOnLongEdges'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-noModelOrder.html
     * @defaultValue 'false'
     */
    'elk.layered.considerModelOrder.noModelOrder'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-groupModelOrder-cycleBreakingId.html
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.groupModelOrder.cycleBreakingId'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-groupModelOrder-crossingMinimizationId.html
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.groupModelOrder.crossingMinimizationId'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-groupModelOrder-componentGroupId.html
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.groupModelOrder.componentGroupId'?: `${number}`;
}
