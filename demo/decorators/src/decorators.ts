import { dia, util } from 'jointjs';

type CellDecorator = {
    attributes: dia.Cell.Attributes;
    presentation: string;
    namespace: any;
}

export function cell(value: CellDecorator) {
    const { attributes, presentation, namespace } = value;
    return function Entity<Ctor extends { new(...args: any[]): dia.Cell }>(target: Ctor): Ctor {
        const { markup, attrs, bindings } = fromSVG(presentation);
        // console.log(markup, attrs);
        // Object.defineProperty(target.prototype, 'markup', {
        //     value: markup,
        //     enumerable: true
        // });
        // Object.defineProperty(target.prototype, 'defaults', {
        //     value: function () {
        //         return {
        //             // can't use super here
        //             ...value.attributes,
        //             attrs,
        //         }
        //     }
        // });
        // return target;
        const type = target.name;
        const extendedTarget = class extends target {

            markup = markup;

            defaults() {
                return {
                    ...super.defaults,
                    ...attributes,
                    type,
                    attrs
                }
            }

            initialize(...args) {
                super.initialize(...args);
                this.on('change', this.__onChange);
                this.__updateBindings(this.attributes);
            }

            __updateBindings(changed: any, opt?: dia.Cell.Options) {
                const attrs = {};
                for (let attribute in changed) {
                    if (attribute in bindings) {
                        util.setByPath(attrs, bindings[attribute], changed[attribute]);
                    }
                }
                this.attr(attrs, opt);
            }

            __onChange(cell: dia.Cell, opt: dia.Cell.Options) {
                this.__updateBindings(this.changed, opt);
            }
        }
        namespace[type] = extendedTarget;
        return extendedTarget;
    }
}


function fromSVG(str: string) {

    const parser = new DOMParser();
    const type = 'text/html';
    const document = parser.parseFromString(`<svg>${str.trim()}</svg>`, type);
    const g =  document.documentElement.lastChild.firstChild.firstChild as Element;

    const markup = [];
    const attrs = {};
    const bindings = {};

    function build(node: Element, markup: Partial<dia.MarkupNodeJSON>, attrs: dia.Cell.Attributes) {

        const { tagName, attributes } = node;

        let selector = markup.selector;
        if (!selector) {
            const selectorAttribute = attributes.getNamedItem('@selector');
            selector = (selectorAttribute ? selectorAttribute.value : util.uuid());
        }

        markup.selector = selector;
        markup.tagName = tagName;

        const nodeAttrs = {};
        let hasNodeAttrs = false;
        Array.from(attributes).forEach(attribute => {
            const { name, value } = attribute;
            if (name.startsWith('@')) {
                // noop
            } else if (name.startsWith('[')) {
                bindings[value] = [`${selector}`, name.slice(1, -1)];
            } else {
                nodeAttrs[util.camelCase(name)] = value;
                hasNodeAttrs = true;
            }
        });
        if (hasNodeAttrs) {
            attrs[selector] = nodeAttrs;
        }

        Array.from(node.children).forEach(childNode => {
            const json: Partial<dia.MarkupNodeJSON> = { children: [] };
            build(childNode, json, attrs);
            markup.children.push(json as dia.MarkupNodeJSON);
        });
    }

    build(g, { selector: 'root', children: markup }, attrs);

    return {
        markup,
        attrs,
        bindings
    };
}
