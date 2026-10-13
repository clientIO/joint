import type {
    ElkAlgorithm,
    Alignment,
    Direction,
    EdgeRouting,
    HierarchyHandling,
    ShapeCoords,
    EdgeCoords,
    PortAlignment,
    PortConstraints,
    EdgeLabelPlacement,
    TopdownNodeTypes,
    CycleBreakingStrategy,
    LayeringStrategy,
    LayerConstraint,
    NodePromotionStrategy,
    CrossingMinimizationStrategy,
    GreedySwitchType,
    NodePlacementStrategy,
    EdgeStraighteningStrategy,
    FixedAlignment,
    NodeFlexibility,
    SplineRoutingMode,
    SelfLoopDistributionStrategy,
    SelfLoopOrderingStrategy,
    GraphCompactionStrategy,
    ConstraintCalculationStrategy,
    WrappingStrategy,
    CuttingStrategy,
    ValidifyStrategy,
    LayerUnzippingStrategy,
    EdgeLabelSideSelection,
    CenterEdgeLabelPlacementStrategy,
    OrderingStrategy,
    ComponentOrderingStrategy,
    LongEdgeOrderingStrategy,
    GroupOrderStrategy,
    DirectionCongruency,
    InteractiveReferencePoint,
    PortSortingStrategy,
    EdgeType,
    PortSide
} from './elkEnums.mjs';

export interface ElkLayoutOptions {
    // Falls back to a plain string for any ELK option beyond this package's Core/Layered coverage.
    [key: string]: string | undefined;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-box-packingMode.html
     * @defaultValue `BoxLayoutProvider.PackingMode.SIMPLE`
     */
    'elk.box.packingMode'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-algorithm.html
     */
    'elk.algorithm'?: ElkAlgorithm;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-alignment.html
     * @defaultValue 'AUTOMATIC'
     */
    'elk.alignment'?: Alignment;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-aspectRatio.html
     */
    'elk.aspectRatio'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-bendPoints.html
     */
    'elk.bendPoints'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-contentAlignment.html
     * @defaultValue `ContentAlignment.topLeft()`
     */
    'elk.contentAlignment'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-debugMode.html
     * @defaultValue 'false'
     */
    'elk.debugMode'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-direction.html
     * @defaultValue 'UNDEFINED'
     */
    'elk.direction'?: Direction;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-edgeRouting.html
     * @defaultValue 'UNDEFINED'
     */
    'elk.edgeRouting'?: EdgeRouting;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-expandNodes.html
     * @defaultValue 'false'
     */
    'elk.expandNodes'?: 'true' | 'false';
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-interactive.html
     * @defaultValue 'false'
     */
    'elk.interactive'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-interactiveLayout.html
     * @defaultValue 'false'
     */
    'elk.interactiveLayout'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-omitNodeMicroLayout.html
     * @defaultValue 'false'
     */
    'elk.omitNodeMicroLayout'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-json-shapeCoords.html
     * @defaultValue 'INHERIT'
     */
    'elk.json.shapeCoords'?: ShapeCoords;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-json-edgeCoords.html
     * @defaultValue 'INHERIT'
     */
    'elk.json.edgeCoords'?: EdgeCoords;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-commentComment.html
     * @defaultValue '10'
     */
    'elk.spacing.commentComment'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-commentNode.html
     * @defaultValue '10'
     */
    'elk.spacing.commentNode'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-componentComponent.html
     * @defaultValue '20'
     */
    'elk.spacing.componentComponent'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-edgeEdge.html
     * @defaultValue '10'
     */
    'elk.spacing.edgeEdge'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-edgeLabel.html
     * @defaultValue '2'
     */
    'elk.spacing.edgeLabel'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-edgeNode.html
     * @defaultValue '10'
     */
    'elk.spacing.edgeNode'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-labelLabel.html
     * @defaultValue '0'
     */
    'elk.spacing.labelLabel'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-labelNode.html
     * @defaultValue '5'
     */
    'elk.spacing.labelNode'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-labelPortHorizontal.html
     * @defaultValue '1'
     */
    'elk.spacing.labelPortHorizontal'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-labelPortVertical.html
     * @defaultValue '1'
     */
    'elk.spacing.labelPortVertical'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-nodeNode.html
     * @defaultValue '20'
     */
    'elk.spacing.nodeNode'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-nodeSelfLoop.html
     * @defaultValue '10'
     */
    'elk.spacing.nodeSelfLoop'?: `${number}`;
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-portsSurrounding.html
     * @defaultValue `new ElkMargin(0)`
     */
    'elk.spacing.portsSurrounding'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-partitioning-partition.html
     */
    'elk.partitioning.partition'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-partitioning-activate.html
     * @defaultValue 'false'
     */
    'elk.partitioning.activate'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeLabels-padding.html
     * @defaultValue `new ElkPadding(5)`
     */
    'elk.nodeLabels.padding'?: string;
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-randomSeed.html
     */
    'elk.randomSeed'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-separateConnectedComponents.html
     */
    'elk.separateConnectedComponents'?: 'true' | 'false';
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeSize-fixedGraphSize.html
     * @defaultValue 'false'
     */
    'elk.nodeSize.fixedGraphSize'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-junctionPoints.html
     * @defaultValue `new KVectorChain()`
     */
    'elk.junctionPoints'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-commentBox.html
     * @defaultValue 'false'
     */
    'elk.commentBox'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-edgeLabels-placement.html
     * @defaultValue 'CENTER'
     */
    'elk.edgeLabels.placement'?: EdgeLabelPlacement;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-edgeLabels-inline.html
     * @defaultValue 'false'
     */
    'elk.edgeLabels.inline'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-font-name.html
     */
    'elk.font.name'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-font-size.html
     */
    'elk.font.size'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-hypernode.html
     * @defaultValue 'false'
     */
    'elk.hypernode'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-softwrappingFuzziness.html
     * @defaultValue '0.0'
     */
    'elk.softwrappingFuzziness'?: `${number}`;
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-port-anchor.html
     */
    'elk.port.anchor'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-port-index.html
     */
    'elk.port.index'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-port-side.html
     * @defaultValue 'UNDEFINED'
     */
    'elk.port.side'?: PortSide;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-port-borderOffset.html
     */
    'elk.port.borderOffset'?: `${number}`;
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-childAreaWidth.html
     */
    'elk.childAreaWidth'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-childAreaHeight.html
     */
    'elk.childAreaHeight'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdownLayout.html
     * @defaultValue 'false'
     */
    'elk.topdownLayout'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-sizeCategories.html
     * @defaultValue '3'
     */
    'elk.topdown.sizeCategories'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-sizeCategoriesHierarchicalNodeWeight.html
     * @defaultValue '4'
     */
    'elk.topdown.sizeCategoriesHierarchicalNodeWeight'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-scaleFactor.html
     * @defaultValue '1'
     */
    'elk.topdown.scaleFactor'?: `${number}`;
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-topdown-scaleCap.html
     * @defaultValue '1'
     */
    'elk.topdown.scaleCap'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-insideSelfLoops-activate.html
     * @defaultValue 'false'
     */
    'elk.insideSelfLoops.activate'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-insideSelfLoops-yo.html
     * @defaultValue 'false'
     */
    'elk.insideSelfLoops.yo'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-edge-thickness.html
     * @defaultValue '1'
     */
    'elk.edge.thickness'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-edge-type.html
     * @defaultValue 'NONE'
     */
    'elk.edge.type'?: EdgeType;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-animate.html
     * @defaultValue 'true'
     */
    'elk.animate'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-animTimeFactor.html
     * @defaultValue '100'
     */
    'elk.animTimeFactor'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layoutAncestors.html
     * @defaultValue 'false'
     */
    'elk.layoutAncestors'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-maxAnimTime.html
     * @defaultValue '4000'
     */
    'elk.maxAnimTime'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-minAnimTime.html
     * @defaultValue '400'
     */
    'elk.minAnimTime'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-progressBar.html
     * @defaultValue 'false'
     */
    'elk.progressBar'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-validateGraph.html
     * @defaultValue 'false'
     */
    'elk.validateGraph'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-validateOptions.html
     * @defaultValue 'true'
     */
    'elk.validateOptions'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-zoomToFit.html
     * @defaultValue 'false'
     */
    'elk.zoomToFit'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-cycleBreaking-strategy.html
     * @defaultValue 'GREEDY'
     */
    'elk.layered.cycleBreaking.strategy'?: CycleBreakingStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-strategy.html
     * @defaultValue 'NETWORK_SIMPLEX'
     */
    'elk.layered.layering.strategy'?: LayeringStrategy;
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-minWidth-upperBoundOnWidth.html
     * @defaultValue '4'
     */
    'elk.layered.layering.minWidth.upperBoundOnWidth'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-minWidth-upperLayerEstimationScalingFactor.html
     * @defaultValue '2'
     */
    'elk.layered.layering.minWidth.upperLayerEstimationScalingFactor'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-nodePromotion-strategy.html
     * @defaultValue 'NONE'
     */
    'elk.layered.layering.nodePromotion.strategy'?: NodePromotionStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-nodePromotion-maxIterations.html
     * @defaultValue '0'
     */
    'elk.layered.layering.nodePromotion.maxIterations'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layering-coffmanGraham-layerBound.html
     * @defaultValue 'MAX_VALUE'
     */
    'elk.layered.layering.coffmanGraham.layerBound'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-strategy.html
     * @defaultValue 'LAYER_SWEEP'
     */
    'elk.layered.crossingMinimization.strategy'?: CrossingMinimizationStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-forceNodeModelOrder.html
     * @defaultValue 'false'
     */
    'elk.layered.crossingMinimization.forceNodeModelOrder'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-hierarchicalSweepiness.html
     * @defaultValue '0.1'
     */
    'elk.layered.crossingMinimization.hierarchicalSweepiness'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-greedySwitch-activationThreshold.html
     * @defaultValue '40'
     */
    'elk.layered.crossingMinimization.greedySwitch.activationThreshold'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-greedySwitch-type.html
     * @defaultValue 'TWO_SIDED'
     */
    'elk.layered.crossingMinimization.greedySwitch.type'?: GreedySwitchType;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-greedySwitchHierarchical-type.html
     * @defaultValue 'OFF'
     */
    'elk.layered.crossingMinimization.greedySwitchHierarchical.type'?: GreedySwitchType;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-crossingMinimization-semiInteractive.html
     * @defaultValue 'false'
     */
    'elk.layered.crossingMinimization.semiInteractive'?: 'true' | 'false';
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-nodePlacement-strategy.html
     * @defaultValue 'BRANDES_KOEPF'
     */
    'elk.layered.nodePlacement.strategy'?: NodePlacementStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-nodePlacement-favorStraightEdges.html
     */
    'elk.layered.nodePlacement.favorStraightEdges'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-nodePlacement-bk-edgeStraightening.html
     * @defaultValue 'IMPROVE_STRAIGHTNESS'
     */
    'elk.layered.nodePlacement.bk.edgeStraightening'?: EdgeStraighteningStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-nodePlacement-bk-fixedAlignment.html
     * @defaultValue 'NONE'
     */
    'elk.layered.nodePlacement.bk.fixedAlignment'?: FixedAlignment;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-nodePlacement-linearSegments-deflectionDampening.html
     * @defaultValue '0.3'
     */
    'elk.layered.nodePlacement.linearSegments.deflectionDampening'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-nodePlacement-networkSimplex-nodeFlexibility.html
     */
    'elk.layered.nodePlacement.networkSimplex.nodeFlexibility'?: NodeFlexibility;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-nodePlacement-networkSimplex-nodeFlexibility-default.html
     * @defaultValue 'NONE'
     */
    'elk.layered.nodePlacement.networkSimplex.nodeFlexibility.default'?: NodeFlexibility;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-nodePlacement-networkSimplex-nodeFlexibility-recomputeNodePlacement.html
     * @defaultValue `null`
     */
    'elk.layered.nodePlacement.networkSimplex.nodeFlexibility.recomputeNodePlacement'?: NodePlacementStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-edgeRouting-splines-mode.html
     * @defaultValue 'SLOPPY'
     */
    'elk.layered.edgeRouting.splines.mode'?: SplineRoutingMode;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-edgeRouting-splines-sloppy-layerSpacingFactor.html
     * @defaultValue '0.2'
     */
    'elk.layered.edgeRouting.splines.sloppy.layerSpacingFactor'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-edgeRouting-polyline-slopedEdgeZoneWidth.html
     * @defaultValue '2.0'
     */
    'elk.layered.edgeRouting.polyline.slopedEdgeZoneWidth'?: `${number}`;
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-spacing-baseValue.html
     */
    'elk.layered.spacing.baseValue'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-spacing-edgeNodeBetweenLayers.html
     * @defaultValue '10'
     */
    'elk.layered.spacing.edgeNodeBetweenLayers'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-spacing-edgeEdgeBetweenLayers.html
     * @defaultValue '10'
     */
    'elk.layered.spacing.edgeEdgeBetweenLayers'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-spacing-nodeNodeBetweenLayers.html
     * @defaultValue '20'
     */
    'elk.layered.spacing.nodeNodeBetweenLayers'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-priority-direction.html
     * @defaultValue '0'
     */
    'elk.layered.priority.direction'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-priority-shortness.html
     * @defaultValue '0'
     */
    'elk.layered.priority.shortness'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-priority-straightness.html
     * @defaultValue '0'
     */
    'elk.layered.priority.straightness'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-compaction-postCompaction-strategy.html
     * @defaultValue 'NONE'
     */
    'elk.layered.compaction.postCompaction.strategy'?: GraphCompactionStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-compaction-postCompaction-constraints.html
     * @defaultValue 'SCANLINE'
     */
    'elk.layered.compaction.postCompaction.constraints'?: ConstraintCalculationStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-compaction-connectedComponents.html
     * @defaultValue 'false'
     */
    'elk.layered.compaction.connectedComponents'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-highDegreeNodes-treatment.html
     * @defaultValue 'false'
     */
    'elk.layered.highDegreeNodes.treatment'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-highDegreeNodes-threshold.html
     * @defaultValue '16'
     */
    'elk.layered.highDegreeNodes.threshold'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-highDegreeNodes-treeHeight.html
     * @defaultValue '5'
     */
    'elk.layered.highDegreeNodes.treeHeight'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-wrapping-strategy.html
     * @defaultValue 'OFF'
     */
    'elk.layered.wrapping.strategy'?: WrappingStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-wrapping-additionalEdgeSpacing.html
     * @defaultValue '10'
     */
    'elk.layered.wrapping.additionalEdgeSpacing'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-wrapping-correctionFactor.html
     * @defaultValue '1.0'
     */
    'elk.layered.wrapping.correctionFactor'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-wrapping-cutting-strategy.html
     * @defaultValue 'MSD'
     */
    'elk.layered.wrapping.cutting.strategy'?: CuttingStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-wrapping-cutting-cuts.html
     */
    'elk.layered.wrapping.cutting.cuts'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-wrapping-cutting-msd-freedom.html
     * @defaultValue '1'
     */
    'elk.layered.wrapping.cutting.msd.freedom'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-wrapping-validify-strategy.html
     * @defaultValue 'GREEDY'
     */
    'elk.layered.wrapping.validify.strategy'?: ValidifyStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-wrapping-validify-forbiddenIndices.html
     */
    'elk.layered.wrapping.validify.forbiddenIndices'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-wrapping-multiEdge-improveCuts.html
     * @defaultValue 'true'
     */
    'elk.layered.wrapping.multiEdge.improveCuts'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-wrapping-multiEdge-distancePenalty.html
     * @defaultValue '2.0'
     */
    'elk.layered.wrapping.multiEdge.distancePenalty'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-wrapping-multiEdge-improveWrappedEdges.html
     * @defaultValue 'true'
     */
    'elk.layered.wrapping.multiEdge.improveWrappedEdges'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-layerUnzipping-strategy.html
     * @defaultValue 'NONE'
     */
    'elk.layered.layerUnzipping.strategy'?: LayerUnzippingStrategy;
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-edgeLabels-sideSelection.html
     * @defaultValue 'SMART_DOWN'
     */
    'elk.layered.edgeLabels.sideSelection'?: EdgeLabelSideSelection;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-edgeLabels-centerLabelPlacementStrategy.html
     * @defaultValue 'MEDIAN_LAYER'
     */
    'elk.layered.edgeLabels.centerLabelPlacementStrategy'?: CenterEdgeLabelPlacementStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-strategy.html
     * @defaultValue 'NONE'
     */
    'elk.layered.considerModelOrder.strategy'?: OrderingStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-portModelOrder.html
     * @defaultValue 'false'
     */
    'elk.layered.considerModelOrder.portModelOrder'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-noModelOrder.html
     * @defaultValue 'false'
     */
    'elk.layered.considerModelOrder.noModelOrder'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-components.html
     * @defaultValue 'NONE'
     */
    'elk.layered.considerModelOrder.components'?: ComponentOrderingStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-longEdgeStrategy.html
     * @defaultValue 'DUMMY_NODE_OVER'
     */
    'elk.layered.considerModelOrder.longEdgeStrategy'?: LongEdgeOrderingStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-crossingCounterNodeInfluence.html
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.crossingCounterNodeInfluence'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-crossingCounterPortInfluence.html
     * @defaultValue '0'
     */
    'elk.layered.considerModelOrder.crossingCounterPortInfluence'?: `${number}`;
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
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-groupModelOrder-cbGroupOrderStrategy.html
     * @defaultValue 'ONLY_WITHIN_GROUP'
     */
    'elk.layered.considerModelOrder.groupModelOrder.cbGroupOrderStrategy'?: GroupOrderStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-groupModelOrder-cbPreferredSourceId.html
     */
    'elk.layered.considerModelOrder.groupModelOrder.cbPreferredSourceId'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-groupModelOrder-cbPreferredTargetId.html
     */
    'elk.layered.considerModelOrder.groupModelOrder.cbPreferredTargetId'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-groupModelOrder-cmGroupOrderStrategy.html
     * @defaultValue 'ONLY_WITHIN_GROUP'
     */
    'elk.layered.considerModelOrder.groupModelOrder.cmGroupOrderStrategy'?: GroupOrderStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-considerModelOrder-groupModelOrder-cmEnforcedGroupOrders.html
     * @defaultValue `#[1, 2, 6, 7, 10, 11]`
     */
    'elk.layered.considerModelOrder.groupModelOrder.cmEnforcedGroupOrders'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-directionCongruency.html
     * @defaultValue 'READING_DIRECTION'
     */
    'elk.layered.directionCongruency'?: DirectionCongruency;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-feedbackEdges.html
     * @defaultValue 'false'
     */
    'elk.layered.feedbackEdges'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-interactiveReferencePoint.html
     * @defaultValue 'CENTER'
     */
    'elk.layered.interactiveReferencePoint'?: InteractiveReferencePoint;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-mergeEdges.html
     * @defaultValue 'false'
     */
    'elk.layered.mergeEdges'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-mergeHierarchyEdges.html
     * @defaultValue 'true'
     */
    'elk.layered.mergeHierarchyEdges'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-allowNonFlowPortsToSwitchSides.html
     * @defaultValue 'false'
     */
    'elk.layered.allowNonFlowPortsToSwitchSides'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-portSortingStrategy.html
     * @defaultValue 'INPUT_ORDER'
     */
    'elk.layered.portSortingStrategy'?: PortSortingStrategy;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-thoroughness.html
     * @defaultValue '7'
     */
    'elk.layered.thoroughness'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-unnecessaryBendpoints.html
     * @defaultValue 'false'
     */
    'elk.layered.unnecessaryBendpoints'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-generatePositionAndLayerIds.html
     * @defaultValue 'false'
     */
    'elk.layered.generatePositionAndLayerIds'?: 'true' | 'false';
}
