import { dia } from '@joint/core';
import { ElementData } from '../components/element.component';

export interface AngularElementAttributes extends dia.Element.Attributes {
    data: ElementData;
}

/**
 * Custom JointJS Element shape for Angular-rendered nodes.
 *
 * This element uses a foreignObject in its markup to render
 * an Angular component inside the standard SVG group root.
 */
export class AngularElement extends dia.Element<AngularElementAttributes> {
    override defaults(): AngularElementAttributes {
        return {
            ...super.defaults,
            type: 'AngularElement',
            size: { width: 200, height: 120 },
            markup: [{
                tagName: 'foreignObject',
                selector: 'foreignObject',
                attributes: {
                    overflow: 'visible',
                },
                children: [{
                    tagName: 'div',
                    selector: 'container',
                    namespaceURI: 'http://www.w3.org/1999/xhtml',
                    style: {
                        width: '100%',
                        height: '100%',
                    }
                }]
            }],
            data: {
                id: '',
                label: 'Node',
                description: '',
                type: 'default',
            },
            attrs: {
                foreignObject: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                }
            }
        };
    }
}
