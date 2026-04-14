import type * as util from './namespaces/util';

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

export * as shapes from './namespaces/shapes';
export * as attributes from './namespaces/attributes';
export * as dia from './namespaces/dia';
export * as elementTools from './namespaces/elementTools';
export * as linkTools from './namespaces/linkTools';
export * as anchors from './namespaces/anchors';
export * as linkAnchors from './namespaces/linkAnchors';
export * as highlighters from './namespaces/highlighters';
export * as layout from './namespaces/layout';
export * as connectionPoints from './namespaces/connectionPoints';
export * as connectionStrategies from './namespaces/connectionStrategies';
export * as connectors from './namespaces/connectors';
export * as routers from './namespaces/routers';
export * as mvc from './namespaces/mvc';
export * as util from './namespaces/util';
