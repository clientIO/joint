import { dia } from 'jointjs';

export default class LinkedProcess extends dia.Element {

    static version = '3.4';

    defaults() {
        return {
            ...super.defaults,
            type: 'LinkedProcess',
            size: {
                width: 120,
                height: 50
            },
            attrs: {
                body: {
                    strokeWidth: 2,
                    stroke: '#333333',
                    fill: '#ffffff',
                    x: 0,
                    y: 0,
                    width: 'calc(w)',
                    height: 'calc(h)'
                },
                label: {
                    text: 'Linked Process',
                    textVerticalAnchor: 'middle',
                    textAnchor: 'middle',
                    textWrap: {
                        width: -20
                    },
                    transform: 'translate(calc(w / 2),calc(h / 2))',
                    fontSize: 13,
                    fontFamily: 'sans-serif',
                    fill: '#333333'
                },
                lines: {
                    stroke: '#333333',
                    strokeWidth: 2,
                    targetMarker: {
                        'type': 'path',
                        'd': 'M 6 -3 0 0 6 3 z'
                    }
                },
                line1: {
                    d: 'M 10 0 v calc(h)',
                },
                line2: {
                    d: 'M calc(w-10) 0 v calc(h)',
                }
            }
        };
    }

    markup = [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'path',
        selector: 'line1',
        groupSelector: 'lines'
    }, {
        tagName: 'path',
        selector: 'line2',
        groupSelector: 'lines'
    }, {
        tagName: 'text',
        selector: 'label'
    }];
}
