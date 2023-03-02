import { dia } from '@joint/core';

/**
 * This is an input element.
 * *
 * @category myshape
 *
 */
export class Input extends dia.Element {

    static version = '3.4';

    defaults() {
        return {
            ...super.defaults,
            type: 'Input',
            size: {
                width: 100,
                height: 50
            },
            attrs: {
                body: {
                    strokeWidth: 2,
                    stroke: '#333333',
                    fill: '#ffffff',
                    d: 'M 0 0 h calc(w) v calc(h-10) C calc(0.6*w) calc(h-10) calc(0.3*w) calc(h+5) 0 calc(h-5) z'
                },
                label: {
                    text: 'Input',
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

    /**
     * ```html
     * <g>
     *   <path @ref="body"/>
     *   <text @ref="label" />
     * </g>
     * ```
     */
    markup = [{
        tagName: 'path',
        selector: 'body'
    }, {
        tagName: 'text',
        selector: 'label'
    }];
}
