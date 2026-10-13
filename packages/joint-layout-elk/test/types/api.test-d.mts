import type { dia } from '@joint/core';
import type { ElkNode as ElkJsNode } from 'elkjs';
import BundledElk from 'elkjs/lib/elk.bundled.js';
import { layout, exportGraphLayout, toNativeElkNode, importGraphLayout } from '../../src/index.mjs';

import type { Expect, Equals } from './assert.mjs';
import type {
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

// The composition the README documents.
export const exported = toNativeElkNode(
    exportGraphLayout([], { elkLayoutOptions: { 'elk.padding': { top: 40 }}}).elkGraph
);

// A whole graph, as `layout()` takes it.
export const exportedGraph = toNativeElkNode(exportGraphLayout(graph).elkGraph);

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

// The round trip the README documents: one `exportGraphLayout()` gives both the graph and the
// `cells` its ids stand for, and `importGraphLayout()` takes them back.
export async function roundTrip(): Promise<void> {
    const exported = exportGraphLayout(graph, { elkLayoutOptions: { 'elk.padding': { top: 40 }}});
    const elkResult = await new BundledElk().layout(toNativeElkNode(exported.elkGraph));
    importGraphLayout(elkResult, exported.index);
}
