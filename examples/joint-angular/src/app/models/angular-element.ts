import { dia } from '@joint/core';
import { NodeData } from '../components/node.component';

/**
 * Custom JointJS Element shape for Angular-rendered nodes.
 *
 * This element uses a foreignObject as its root (via AngularElementView)
 * and renders an Angular component inside it.
 */
export class AngularElement extends dia.Element {
    override defaults() {
        return {
            ...super.defaults,
            type: 'AngularElement',
            size: { width: 200, height: 120 },
            markup: [{
                tagName: 'div',
                selector: 'container',
                namespaceURI: 'http://www.w3.org/1999/xhtml',
                style: {
                    width: '100%',
                    height: '100%',
                }
            }],
            data: {
                id: '',
                label: 'Node',
                description: '',
                type: 'default',
                isSelected: false,
            } as NodeData,
            attrs: {
                root: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                }
            }
        };
    }
}
