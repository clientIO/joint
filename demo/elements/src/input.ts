import { dia } from 'jointjs';

export default class Input extends dia.Element {

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
                    fill: '#FFF',
                    d: 'M 0 0 h calc(w) v calc(h-10) C calc(0.6*w) calc(h-10) calc(0.3*w) calc(h+5) 0 calc(h-5) z'
                },
                label: {
                    text: 'Input',
                    textVerticalAnchor: 'middle',
                    textAnchor: 'middle',
                    y: 'calc(0.5*h - 5)',
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
