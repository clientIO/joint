import type { PortSide } from './elkEnums.mjs';

export interface PortElkLayoutOptions {
    // Falls back to a plain string for any ELK option beyond this package's Core/Layered coverage.
    [key: string]: string | undefined;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-individual.html
     */
    'elk.spacing.individual'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-position.html
     */
    'elk.position'?: string;
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
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-allowNonFlowPortsToSwitchSides.html
     * @defaultValue 'false'
     */
    'elk.layered.allowNonFlowPortsToSwitchSides'?: 'true' | 'false';
}
