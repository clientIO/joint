import { dia, util } from '@joint/core';

const ElementMarkup = util.svg/* xml */`
    <rect @selector="body"/>
    <foreignObject @selector="fo">
        <div @selector="portal"></div>
    </foreignObject>
`;

export class ElementModel extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: 'ElementModel',
            size: { width: 100, height: 80 },
            data: {},
            attrs: {
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    fill: 'transparent',
                    stroke: 'none',
                },
                fo: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                },
                portal: {
                    style: {
                        height: '100%',
                        width: '100%',
                        position: 'fixed'
                    }
                },
            },
        };
    }

    preinitialize() {
        this.markup = ElementMarkup;
    }

    getData(propertyName) {
        if (propertyName === undefined) {
            return this.get('data');
        }
        return this.prop(['data', propertyName]);
    }

    setData(propertyName, propertyValue) {
        this.prop(['data', propertyName], propertyValue);
    }
}
