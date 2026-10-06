// Not part of the public API (not re-exported from `index.mts`).

// The id of the ELK label for a link's label - it carries the label's index in the link's
// `labels` array, so the result can be applied back to that label even when some of the
// link's labels were left out of the ELK graph (see `ExportLinkLabelCallback`).
export function getLinkLabelId(elkEdgeId: string, labelIndex: number): string {
    return `${elkEdgeId}:labels:${labelIndex}`;
}

// The index in the link's `labels` array of the label an ELK label was made for, or
// `undefined` for an ELK label `getLinkLabelId` didn't make (e.g. one added in `exportLink`).
export function getLinkLabelIndex(elkEdgeId: string, elkLabelId: string | undefined): number | undefined {
    const prefix = `${elkEdgeId}:labels:`;
    if (!elkLabelId || !elkLabelId.startsWith(prefix)) return undefined;
    const index = elkLabelId.slice(prefix.length);
    return /^\d+$/.test(index) ? Number(index) : undefined;
}
