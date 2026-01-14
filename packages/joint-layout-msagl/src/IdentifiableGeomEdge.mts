import type { dia } from '@joint/core';
import type { Edge } from '@msagl/core';
import { GeomEdge } from '@msagl/core';

/**
 * Extends the MSAGL GeomEdge class to add an ID property, which is used to identify the edge in the layout.
 */
export class IdentifiableGeomEdge extends GeomEdge {

    private _id: dia.Cell.ID;

    constructor(edge: Edge, id: dia.Cell.ID) {
        super(edge);
        this._id = id;
    }

    get id() {
        return this._id;
    }

    set id(id: dia.Cell.ID) {
        this._id = id;
    }
}
