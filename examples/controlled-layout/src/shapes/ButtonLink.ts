import { dia, shapes, util } from '@joint/core';

export class ButtonLink extends shapes.standard.Link {
    defaults(): Partial<dia.Link.Attributes> {
        return util.defaultsDeep({
            type: 'app.ButtonLink',
            z: -1,
            attrs: {
                line: {
                    stroke: '#999',
                    strokeWidth: 2,
                    strokeDasharray: '5, 5',
                    targetMarker: null
                }
            }
        }, super.defaults)
    }
}

Object.assign(shapes, {
    app: {
        ButtonLink
    }
});
