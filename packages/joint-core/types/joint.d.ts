import type * as util from './util';

export namespace config {
    var useCSSSelectors: boolean;
    var classNamePrefix: string;
    var defaultTheme: string;
    var doubleTapInterval: number;
    var cellMergeStrategy: util.MergeCustomizer | null;
    var cellDefaultsMergeStrategy: util.MergeCustomizer | null;
    var layerAttribute: string;
}

export namespace env {
    export function addTest(name: string, fn: () => boolean): void;
    export function test(name: string): boolean;
}

export function setTheme(theme: string): void;

export const version: string;

export * as shapes from './shapes';
export * as attributes from './attributes';
export * as dia from './dia';
export * as elementTools from './elementTools';
export * as linkTools from './linkTools';
export * as anchors from './anchors';
export * as linkAnchors from './linkAnchors';
export * as highlighters from './highlighters';
export * as layout from './layout';
export * as connectionPoints from './connectionPoints';
export * as connectionStrategies from './connectionStrategies';
export * as connectors from './connectors';
export * as routers from './routers';
export * as mvc from './mvc';
export * as util from './util';
