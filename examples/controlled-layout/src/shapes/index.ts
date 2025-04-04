import { dia } from "@joint/core";

export * from './Button';
export * from './Step';
export * from './End';
export * from './Decision';

export function isButton(el: dia.Cell) {
    return el.get('type') === 'app.Button';
}

export interface IElement extends dia.Element {
    getMaxNumberOfChildren(): number;
}
