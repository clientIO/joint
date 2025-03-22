import { dia } from "@joint/core";

export * from './Button';
export * from './Rectangle';
export * from './Ellipse';
export * from './Triangle';

export function isButton(el: dia.Cell) {
    return el.get('type') === 'app.Button';
}
