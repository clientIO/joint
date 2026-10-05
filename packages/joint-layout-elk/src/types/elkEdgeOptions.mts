import type { EdgeType } from './elkEnums.mjs';

export interface EdgeElkLayoutOptions {
    // Falls back to a plain string for any ELK option beyond this package's Core/Layered coverage.
    [key: string]: string | undefined;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-bendPoints.html
     */
    'elk.bendPoints'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-individual.html
     */
    'elk.spacing.individual'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-priority.html
     */
    'elk.priority'?: `${number}`;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-junctionPoints.html
     * @defaultValue `new KVectorChain()`
     */
    'elk.junctionPoints'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-noLayout.html
     * @defaultValue 'false'
     */
    'elk.noLayout'?: 'true' | 'false';
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
