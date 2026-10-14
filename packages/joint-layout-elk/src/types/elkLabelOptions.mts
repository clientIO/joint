import type { dia, g } from '@joint/core';
import type { ToNativeElkOptions } from './toNativeElkOptions.mjs';
import type { EdgeLabelPlacement, CenterEdgeLabelPlacementStrategy, NodeLabelPlacement } from './elkEnums.mjs';

/**
 * An ELK label's layout options in their JointJS spelling - `6`, `true`, `{ x: 10, y: 20 }`,
 * `['INSIDE', 'V_TOP']`.
 *
 * Every option is declared here; {@link NativeElkLabelLayoutOptions} is projected from it. Annotate
 * your own options with this type to be held to the JointJS spelling alone:
 *
 * ```ts
 * const options: StrictElkLabelLayoutOptions = { 'elk.edgeLabels.inline': true };
 * ```
 */
export interface StrictElkLabelLayoutOptions {
    // Falls back to any ELK option beyond this package's Core/Layered coverage.
    // Wider than `string`, because TypeScript holds every declared property to the index
    // signature and the ones below are typed `number`, `boolean`, `dia.Sides`,
    // `g.PlainPoint` and arrays of enum values (the options ELK takes a set of values for).
    // (`dia.Sides` already covers `number`; both are spelled out to say which spellings
    // this type takes.)
    [key: string]: string | number | boolean | dia.Sides | g.PlainPoint | readonly string[] | undefined;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-individual.html
     */
    'elk.spacing.individual'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-nodeLabels-placement.html
     * @defaultValue [] - no placement: a label keeps the position it is given
     */
    'elk.nodeLabels.placement'?: readonly NodeLabelPlacement[];
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-position.html
     */
    'elk.position'?: g.PlainPoint;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-edgeLabels-placement.html
     * @defaultValue 'CENTER'
     */
    'elk.edgeLabels.placement'?: EdgeLabelPlacement;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-edgeLabels-inline.html
     * @defaultValue 'false'
     */
    'elk.edgeLabels.inline'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-font-name.html
     */
    'elk.font.name'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-font-size.html
     */
    'elk.font.size'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-softwrappingFuzziness.html
     * @defaultValue '0.0'
     */
    'elk.softwrappingFuzziness'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-noLayout.html
     * @defaultValue 'false'
     */
    'elk.noLayout'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-edgeLabels-centerLabelPlacementStrategy.html
     * @defaultValue 'MEDIAN_LAYER'
     */
    'elk.layered.edgeLabels.centerLabelPlacementStrategy'?: CenterEdgeLabelPlacementStrategy;
}

/**
 * An ELK label's layout options in ELK's own spelling - every value a string, the way the
 * reference page linked from each option expresses it, and the way options that arrive as
 * data (a saved diagram, a backend's config) are already shaped.
 *
 * Projected from {@link StrictElkLabelLayoutOptions}, so the two cannot drift.
 */
export type NativeElkLabelLayoutOptions = ToNativeElkOptions<StrictElkLabelLayoutOptions>;

/**
 * An ELK label's layout options. Each option takes either spelling, so one object can mix
 * them: `{ 'elk.spacing.nodeNode': 6, 'elk.padding': '[top=12,left=12]' }`.
 *
 * Per key rather than `StrictElkLabelLayoutOptions | NativeElkLabelLayoutOptions`: an object literal
 * mixing the two spellings matches neither arm of a union of the whole types.
 */
export type ElkLabelLayoutOptions = {
    [K in keyof StrictElkLabelLayoutOptions]?: StrictElkLabelLayoutOptions[K] | NativeElkLabelLayoutOptions[K];
};
