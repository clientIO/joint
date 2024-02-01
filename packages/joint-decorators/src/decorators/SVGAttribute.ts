import { util } from '@joint/core';

export enum SVGAttributeTypes {
    SET = 'set',
    OFFSET = 'offset',
    POSITION = 'position',
    QUALIFY = 'qualify'
}

export function SVGAttribute(attributeName: string, type: SVGAttributeTypes = SVGAttributeTypes.SET) {
    return function(target: any, name: string, descriptor: PropertyDescriptor) {
        if (!attributeName) {
            throw new Error('The SVGAttribute decorator requires an attributeName argument');
        }
        const { constructor: ctor } = target;
        if (!ctor.attributes) {
            ctor.attributes = {};
        }
        const csAttributeName = util.camelCase(attributeName);
        let attribute = ctor.attributes[csAttributeName];
        if (!attribute) {
            attribute = ctor.attributes[csAttributeName] = {};
        }
        attribute[type] = (...args: any[]) => {
            return target[name](...args);
        }
        return descriptor;
    }
}
