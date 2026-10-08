import type { dia } from '@joint/core';

// Not part of the public API (not re-exported from `index.mts`).

// The ids of everything in the ELK graph, unique across the whole graph - ELK resolves an
// edge's `sources`/`targets` against nodes and ports alike, and the import looks every node,
// port, edge and label up by its id. A cell's own id goes in with `\` and `:` escaped, so:
// - a node's or an edge's id has no unescaped `:` (JointJS cell ids are unique across
//   elements and links already),
// - a port's has exactly one - between its element's id and its own,
// - a link label's has two - `<edge id>:labels:<index>`,
// - the root's starts with two - which none of the above does, whatever the cell ids.

/** The id of the ELK graph's root node. */
export const ELK_ROOT_ID = '::root';

function escapeId(id: string | number): string {
    return `${id}`.replace(/[\\:]/g, (char) => `\\${char}`);
}

/** The id of an element's ELK node - the element's id, unless it has a `\` or `:` in it. */
export function getElkNodeId(element: dia.Element): string {
    return escapeId(element.id);
}

/** The id of an element port's ELK port - `<element id>:<port id>`. */
export function getElkPortId(element: dia.Element, portId: string): string {
    return `${getElkNodeId(element)}:${escapeId(portId)}`;
}

/** The id of a link's ELK edge - the link's id, unless it has a `\` or `:` in it. */
export function getElkEdgeId(link: dia.Link): string {
    return escapeId(link.id);
}

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
