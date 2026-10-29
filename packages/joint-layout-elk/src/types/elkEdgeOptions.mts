import type { dia, g } from '@joint/core';
import type { ToNativeElkOptions } from './toNativeElkOptions.mjs';
import type { EdgeType } from './elkEnums.mjs';

/**
 * An ELK edge's layout options in their JointJS spelling - `6`, `true`.
 *
 * Every option is declared here; {@link NativeElkEdgeLayoutOptions} is projected from it. Annotate
 * your own options with this type to be held to the JointJS spelling alone:
 *
 * ```ts
 * const options: StrictElkEdgeLayoutOptions = { 'elk.priority': 3 };
 * ```
 */
export interface StrictElkEdgeLayoutOptions {
    // Falls back to any ELK option beyond this package's Core/Layered coverage.
    // Wider than `string`, because TypeScript holds every declared property to the index
    // signature and the ones below are typed `number`, `boolean`, `dia.Sides` and
    // `g.PlainPoint`. (`dia.Sides` already covers `number`; both are spelled out to say
    // which spellings this type takes.)
    [key: string]: string | number | boolean | dia.Sides | g.PlainPoint | undefined;
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
    'elk.priority'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-junctionPoints.html
     * @defaultValue `new KVectorChain()`
     */
    'elk.junctionPoints'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-noLayout.html
     * @defaultValue 'false'
     */
    'elk.noLayout'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-insideSelfLoops-yo.html
     * @defaultValue 'false'
     */
    'elk.insideSelfLoops.yo'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-edge-thickness.html
     * @defaultValue '1'
     */
    'elk.edge.thickness'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-edge-type.html
     * @defaultValue 'NONE'
     */
    'elk.edge.type'?: EdgeType;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-priority-direction.html
     * @defaultValue '0'
     */
    'elk.layered.priority.direction'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-priority-shortness.html
     * @defaultValue '0'
     */
    'elk.layered.priority.shortness'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-priority-straightness.html
     * @defaultValue '0'
     */
    'elk.layered.priority.straightness'?: number;
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
 * An ELK edge's layout options in ELK's own spelling - every value a string, the way the
 * reference page linked from each option expresses it, and the way options that arrive as
 * data (a saved diagram, a backend's config) are already shaped.
 *
 * Projected from {@link StrictElkEdgeLayoutOptions}, so the two cannot drift.
 */
export type NativeElkEdgeLayoutOptions = ToNativeElkOptions<StrictElkEdgeLayoutOptions>;

/**
 * An ELK edge's layout options. Each option takes either spelling, so one object can mix
 * them: `{ 'elk.spacing.nodeNode': 6, 'elk.padding': '[top=12,left=12]' }`.
 *
 * Per key rather than `StrictElkEdgeLayoutOptions | NativeElkEdgeLayoutOptions`: an object literal
 * mixing the two spellings matches neither arm of a union of the whole types.
 */
export type ElkEdgeLayoutOptions = {
    [K in keyof StrictElkEdgeLayoutOptions]?: StrictElkEdgeLayoutOptions[K] | NativeElkEdgeLayoutOptions[K];
};
