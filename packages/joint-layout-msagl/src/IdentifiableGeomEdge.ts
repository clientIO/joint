import type { dia } from '@joint/core';
import { Edge, GeomEdge } from '@msagl/core';

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
