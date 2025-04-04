import { shapes, util } from '@joint/core';

export class Button extends shapes.standard.Circle {
    defaults(): Partial<shapes.standard.CircleAttributes> {
        return util.defaultsDeep({
            type: 'app.Button',
            size: { width: 20, height: 30 },
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
                    fill: 'gray',
                    fontWeight: 'bold',
                    text: '+',
                    y: 10
                }
            }
        }, super.defaults);
    }
}
