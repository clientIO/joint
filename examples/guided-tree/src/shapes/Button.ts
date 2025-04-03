import { shapes, util } from '@joint/core';

export class Button extends shapes.standard.Circle {
    defaults(): Partial<shapes.standard.CircleAttributes> {
        return util.defaultsDeep({
            type: 'app.Button',
            size: { width: 20, height: 20 },
            attrs: {
                root: {
                    style: { cursor: 'pointer' }
                },
                body: {
                    magnet: true,
                    stroke: 'gray',
                    strokeWidth: 1,
                    cursor: 'crosshair'
                },
                label: {
                    pointerEvents: 'none',
                    fontWeight: 'bold',
                    text: '+'
                }
            }
        }, super.defaults);
    }
}
