import { dia } from 'jointjs';

export default class Mark extends dia.Element {

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
                    d: 'M 0 calc(h / 2) calc(h / 2) 0 H calc(w-calc(h / 2)) a 3 3 0 0 1 3 calc(h) H calc(h / 2) z'
                },
                label: {
                    text: 'Mark',
                    textVerticalAnchor: 'middle',
                    textAnchor: 'middle',
                    y: 'calc(h / 2)',
                    x: 'calc(w / 2)',
                    fontSize: 13,
                    fontFamily: 'sans-serif',
                    fill: '#333333'
                }
            }
        };
    }

    markup = [{
        tagName: 'path',
        selector: 'body'
    }, {
        tagName: 'text',
        selector: 'label'
    }];
}
