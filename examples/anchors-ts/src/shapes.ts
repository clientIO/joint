import { dia, util } from '@joint/core';

export class Shape1 extends dia.Element {
    markup: string | dia.MarkupJSON = util.svg`
        <rect @selector="body"></rect>
        <rect @selector="extra"></rect>
    `;

    defaults() {
        return util.defaultsDeep({
            type: 'custom.Shape1',
            size: {
                width: 100,
                height: 40
            },
            attrs: {
                body: {
                    strokeWidth: 2,
                    stroke: 'black',
                    fill: 'white',
                    width: 'calc(w)',
                    height: 'calc(h)'
                },
                extra: {
                    x: 'calc(w/2)',
                    y: -30,
                    width: 40,
                    height: 40,
                    strokeWidth: 2,
                    stroke: 'black',
                    fill: 'white'
                }
            }
        }, super.defaults);
    }
}
