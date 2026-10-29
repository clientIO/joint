// Public API barrel: the `layout()` entry point, its export/import callback types, and
// the ELK-facing graph/option types.
//
// Listed one by one rather than re-exported wholesale, so that what is public is a
// decision rather than a side effect of where something happens to be declared.
// `exportGraphLayout()` and `importGraphLayout()` are the two halves `layout()` is made
// of, and are deliberately not here: to run ELK somewhere of your own - a Web Worker, a
// server, a cache - pass an `elk` of your own to `layout()`, which keeps both halves
// (and what the ids in between stand for) its own business. See `createWorkerElk()`.
export * from './layout.mjs';
export { toNativeElkNode } from './elkOptions.mjs';
export { createWorkerElk } from './workerElk.mjs';
export type { WorkerElk } from './workerElk.mjs';

// The drafts the export callbacks are handed, and the callbacks themselves.
export type {
    ElkNodeDraft,
    ElkPortDraft,
    ElkEdgeDraft,
    ElkLabelDraft,
    ExportElementCallback,
    ExportElementCallbackParams,
    ExportPortCallback,
    ExportPortCallbackParams,
    ExportPortLabelCallback,
    ExportPortLabelCallbackParams,
    ExportLinkCallback,
    ExportLinkCallbackParams,
    ExportLinkLabelCallback,
    ExportLinkLabelCallbackParams,
    ExportGraphLayoutOptions
} from './export.mjs';

// The callbacks that apply a layout back onto the cells.
export type {
    SetElementAttributesCallback,
    SetElementAttributesCallbackParams,
    SetPortAttributesCallback,
    SetPortAttributesCallbackParams,
    SetLinkAttributesCallback,
    SetLinkAttributesCallbackParams,
    ImportGraphLayoutOptions
} from './import.mjs';

export type * from './types/index.mjs';
