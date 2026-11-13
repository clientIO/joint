import type { dia } from '@joint/core';
import type { ElkNode as ElkJsNode } from 'elkjs';
import BundledElk from 'elkjs/lib/elk.bundled.js';
import { layout, loadElk, toNativeElkNode } from '../../src/index.mjs';
import * as api from '../../src/index.mjs';

import type { Expect, Equals } from './assert.mjs';
import type {
    LayoutResult,
    LayoutSyncOptions,
    LoadedElk,
    NativeElkNode,
    StrictElkLayoutOptions,
    NativeElkLayoutOptions,
    ExportElementCallback,
    ExportPortCallback,
    ExportLinkCallback,
    ExportLinkLabelCallback
} from '../../src/index.mjs';

declare const graph: dia.Graph;

// `NativeElkNode` is elkjs's own node type under this package's name, which is what lets
// the result go straight to `elk.layout()` with no assertion at the call site.
export type _nativeNode = Expect<Equals<NativeElkNode, ElkJsNode>>;

// Either spelling goes in...
export const fromStrict: NativeElkNode = toNativeElkNode({
    id: 'root',
    layoutOptions: { 'elk.padding': { top: 40 }, 'elk.spacing.nodeNode': 6 }
});
export const fromNative: NativeElkNode = toNativeElkNode({
    id: 'root',
    layoutOptions: { 'elk.padding': '[top=40]', 'elk.spacing.nodeNode': '6' }
});

// ...and what comes out is what elkjs takes.
export const forElk: ElkJsNode = toNativeElkNode({ id: 'root' });


// A bag in either spelling reaches `layout()`.
declare const strictBag: StrictElkLayoutOptions;
declare const nativeBag: NativeElkLayoutOptions;
export const strictLayout = layout(graph, { elkLayoutOptions: strictBag });
export const nativeLayout = layout(graph, { elkLayoutOptions: nativeBag });

// The drafts handed to the export callbacks take both spellings, assigned either way.
export const exportElement: ExportElementCallback = ({ elkNode }) => {
    elkNode.layoutOptions['elk.portConstraints'] = 'FIXED_SIDE';
    elkNode.layoutOptions['elk.priority'] = 3;
    elkNode.layoutOptions['elk.noLayout'] = 'false';
    Object.assign(elkNode.layoutOptions, { 'elk.padding': { left: 10, vertical: 40 }});
};
export const exportPort: ExportPortCallback = ({ elkPort }) => {
    elkPort.layoutOptions['elk.port.anchor'] = { x: 1, y: 2 };
};
export const exportLink: ExportLinkCallback = ({ elkEdge }) => {
    elkEdge.layoutOptions['elk.priority'] = 3;
};
export const exportLinkLabel: ExportLinkLabelCallback = ({ elkEdgeLabel }) => {
    elkEdgeLabel.layoutOptions['elk.edgeLabels.inline'] = false;
};

// The import form the README's `toNativeElkNode()` example uses: the bundled build, which
// carries ELK itself, rather than `elkjs`'s worker-dependent entry point.
export const bundledElkTakesIt: Promise<ElkJsNode> =
    new BundledElk().layout(toNativeElkNode({ id: 'root', layoutOptions: { 'elk.padding': { top: 40 }}}));

// `loadElk()` resolves to what lays out synchronously - `layoutSync()` isn't exported, so it
// can't run before ELK has loaded.
export const loaded: Promise<LoadedElk> = loadElk();
// @ts-expect-error - only handed out by `loadElk()`.
export const notExported = api.layoutSync;

// `layoutSync()` returns the result itself, and takes the options of `layout()` - but not
// `elk` or `signal`, which it has no use for.
declare const loadedElk: LoadedElk;
const { layoutSync } = loadedElk;
export const syncResult: LayoutResult = layoutSync(graph, { elkLayoutOptions: strictBag, exportElement });
export const syncCells: LayoutResult = layoutSync(graph.getCells());
// @ts-expect-error - `layoutSync()` always lays out with the default ELK instance.
export const syncElk: LayoutSyncOptions = { elk: new BundledElk() };
// @ts-expect-error - nothing to abort.
export const syncSignal: LayoutSyncOptions = { signal: new AbortController().signal };
