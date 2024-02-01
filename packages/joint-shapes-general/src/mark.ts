import { dia } from '@joint/core';

/**
 * This is a test
 *
 * ```typescript
 * const x = 5;
 * ```
 */
export class Mark extends dia.Element {

    static version = '3.5';

    defaults() {
        return {
            ...super.defaults,
            type: 'Mark',
            size: {
                width: 120,
                height: 50
            },
            attrs: {
                body: {
                    strokeWidth: 2,
                    stroke: '#333333',
                    fill: '#ffffff',
                    d: 'M 0 calc(0.5*h) calc(0.5*h) 0 H calc(w-calc(0.5 * h)) a 3 3 0 0 1 3 calc(h) H calc(0.5*h) z'
                },
                label: {
                    text: 'Mark',
                    textVerticalAnchor: 'top',
                    textAnchor: 'middle',
                    y: 'calc(h+10)',
                    x: 'calc(0.5*w)',
                    fontSize: 13,
                    fontFamily: 'sans-serif',
                    fill: '#333333'
                }
            }
        }
    }

    markup = [{
        tagName: 'path',
        selector: 'body'
    }, {
        tagName: 'text',
        selector: 'label'
    }];
}
