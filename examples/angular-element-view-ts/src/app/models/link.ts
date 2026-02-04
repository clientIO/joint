import { type dia, shapes, util } from '@joint/core';

/**
 * Custom link model with default styling for the Angular example.
 */
export class Link extends shapes.standard.Link {
    override defaults(): dia.Link.Attributes {
        const attributes: dia.Link.Attributes = {
            type: 'Link',
            attrs: {
                line: {
                    stroke: '#64748b',
                    strokeWidth: 2,
                    targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 z' },
                },
            },
        };

        return util.defaultsDeep(attributes, super.defaults);
    }
}
