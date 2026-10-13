import type { dia } from '@joint/core';

// Not part of the public API (not re-exported from `index.mts`) - `ExportedCellIndex` is, and
// is opaque, so none of the shapes below are promised to anyone.

/** An element's port, as it was exported - its `x`/`y` are what ELK was given. */
export interface ExportedPort {
    element: dia.Element;
    portId: dia.Cell.ID;
    /** The port's top-left as it was sent to ELK - what came back is `ElkPort`'s own. */
    x: number;
    y: number;
}

/**
 * What the ELK graph's ids stand for, so a layout result can be applied back.
 *
 * ELK ids are built from cell ids (see `elkIds.mts`), and a port's also carries where it
 * was when it was exported - which the result alone cannot say.
 */
export interface ExportedCellIndexData {
    elementsById: Map<string, dia.Element>;
    linksById: Map<string, dia.Link>;
    portsById: Map<string, ExportedPort>;
}

// The elements and the links to lay out, in the order they were given, and the graphs the
// layout's batch runs on. A batch groups only the changes emitted by its own graph's cells,
// so it has to run on every graph the cells come from - in practice one. A cell that is in
// no graph (e.g. a container added only to shape the layout) emits nothing and brings none.
export function splitCells(graphOrCells: dia.Graph | dia.Cell[]): {
    elements: dia.Element[],
    links: dia.Link[],
    graphs: dia.Graph[]
} {
    if (!Array.isArray(graphOrCells)) {
        return {
            elements: graphOrCells.getElements(),
            links: graphOrCells.getLinks(),
            graphs: [graphOrCells]
        };
    }
    const elements: dia.Element[] = [];
    const links: dia.Link[] = [];
    const graphs = new Set<dia.Graph>();
    // A cell listed twice would be laid out twice - two ELK nodes sharing an id, so ELK
    // reserves room for both and the import applies whichever came last.
    new Set(graphOrCells).forEach((cell) => {
        if (cell.isElement()) {
            elements.push(cell as dia.Element);
        } else {
            links.push(cell as dia.Link);
        }
        if (cell.graph) graphs.add(cell.graph);
    });
    return { elements, links, graphs: Array.from(graphs) };
}
