import { dia, elementTools } from '@joint/core';
import { Table } from "@joint/shapes-general";

export interface TableDividerToolOptions extends elementTools.Control.Options {

    defaultDividerX?: number;

    defaultDividerY?: number;

}

/**
 * @category Shape-Specific
 */
export class TableDividerTool extends elementTools.Control<TableDividerToolOptions> {

    /** @ignore */
    preinitialize() {
        this.options.selector = 'body';
    }

    get element(): Table {
        return this.relatedView.model as Table;
    }

    protected getPosition(_view: dia.ElementView) {
        const { dividerX, dividerY } = this.element;
        return { x: dividerX, y: dividerY };
    }

    protected setPosition(_view: dia.ElementView, coordinates: dia.Point) {
        const { width, height } = this.element.size();

        this.element.dividerX = Math.max(0, Math.min(coordinates.x, width));
        this.element.dividerY = Math.max(0, Math.min(coordinates.y, height));
    }

    protected resetPosition(): void {
        const { width, height } = this.element.size();

        const {
            defaultDividerX = width / 4,
            defaultDividerY = height / 4,
        } = this.options;

        this.element.dividerX = defaultDividerX;
        this.element.dividerY = defaultDividerY;
    }

}
