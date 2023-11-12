import { shapes, util } from 'jointjs';

export class LinkModel extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep({
            type: 'LinkModel',
            attrs: {
                line: {
                    stroke: 'white',
                },
            },
        }, super.defaults);
    }
}
