import type { dia, g } from '@joint/core';
import type { ToNativeElkOptions } from './toNativeElkOptions.mjs';
import type { PortSide } from './elkEnums.mjs';

/**
 * An ELK port's layout options in their JointJS spelling - `6`, `true`, `{ x: 10, y: 20 }`.
 *
 * Every option is declared here; {@link NativeElkPortLayoutOptions} is projected from it. Annotate
 * your own options with this type to be held to the JointJS spelling alone:
 *
 * ```ts
 * const options: StrictElkPortLayoutOptions = { 'elk.port.anchor': { x: 1, y: 2 }};
 * ```
 */
export interface StrictElkPortLayoutOptions {
    // Falls back to any ELK option beyond this package's Core/Layered coverage.
    // Wider than `string`, because TypeScript holds every declared property to the index
    // signature and the ones below are typed `number`, `boolean`, `dia.Sides` and
    // `g.PlainPoint`. (`dia.Sides` already covers `number`; both are spelled out to say
    // which spellings this type takes.)
    [key: string]: string | number | boolean | dia.Sides | g.PlainPoint | undefined;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-spacing-individual.html
     */
    'elk.spacing.individual'?: string;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-position.html
     */
    'elk.position'?: g.PlainPoint;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-noLayout.html
     * @defaultValue 'false'
     */
    'elk.noLayout'?: boolean;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-port-anchor.html
     */
    'elk.port.anchor'?: g.PlainPoint;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-port-index.html
     */
    'elk.port.index'?: number;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-port-side.html
     * @defaultValue 'UNDEFINED'
     */
    'elk.port.side'?: PortSide;
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-port-borderOffset.html
     */
    'elk.port.borderOffset'?: number;
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
    /**
     * @see https://eclipse.dev/elk/reference/options/org-eclipse-elk-layered-allowNonFlowPortsToSwitchSides.html
     * @defaultValue 'false'
     */
    'elk.layered.allowNonFlowPortsToSwitchSides'?: boolean;
}

/**
 * An ELK port's layout options in ELK's own spelling - every value a string, the way the
 * reference page linked from each option expresses it, and the way options that arrive as
 * data (a saved diagram, a backend's config) are already shaped.
 *
 * Projected from {@link StrictElkPortLayoutOptions}, so the two cannot drift.
 */
export type NativeElkPortLayoutOptions = ToNativeElkOptions<StrictElkPortLayoutOptions>;

/**
 * An ELK port's layout options. Each option takes either spelling, so one object can mix
 * them: `{ 'elk.spacing.nodeNode': 6, 'elk.padding': '[top=12,left=12]' }`.
 *
 * Per key rather than `StrictElkPortLayoutOptions | NativeElkPortLayoutOptions`: an object literal
 * mixing the two spellings matches neither arm of a union of the whole types.
 */
export type ElkPortLayoutOptions = {
    [K in keyof StrictElkPortLayoutOptions]?: StrictElkPortLayoutOptions[K] | NativeElkPortLayoutOptions[K];
};
