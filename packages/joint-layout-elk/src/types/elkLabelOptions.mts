import type { EdgeLabelPlacement, CenterEdgeLabelPlacementStrategy } from './elkEnums.mjs';

export interface LabelElkLayoutOptions {
    // Falls back to a plain string for any ELK option beyond this package's Core/Layered coverage.
    [key: string]: string | undefined;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-individual.html
     */
    'elk.spacing.individual'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeLabels-placement.html
     * @defaultValue `NodeLabelPlacement.fixed`
     */
    'elk.nodeLabels.placement'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-position.html
     */
    'elk.position'?: string;
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-softwrappingFuzziness.html
     * @defaultValue '0.0'
     */
    'elk.softwrappingFuzziness'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-noLayout.html
     * @defaultValue 'false'
     */
    'elk.noLayout'?: 'true' | 'false';
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-edgeLabels-centerLabelPlacementStrategy.html
     * @defaultValue 'MEDIAN_LAYER'
     */
    'elk.layered.edgeLabels.centerLabelPlacementStrategy'?: CenterEdgeLabelPlacementStrategy;
}
