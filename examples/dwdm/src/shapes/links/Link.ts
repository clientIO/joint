import { dia } from '@joint/core';

export default abstract class Link extends dia.Link {

    abstract isBidirectional(): boolean;

    static isLink(cell: dia.Cell): cell is Link {
        return cell instanceof Link;
    }
}
