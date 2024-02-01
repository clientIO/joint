import { util, dia, attributes } from '@joint/core';

// type SVGParserBindings = Record<string, Array<SVGParserBinding>>;

interface SVGParserBinding {
    name: string
    id: string
    path: string[],
    expression: string,
    triggers: string[],
    isFunction: boolean,
    args: any[]
}
interface SVGParserResult {
    markup: dia.MarkupJSON;
    attrs: dia.Cell.Selectors;
    bindings: SVGParserBinding[]
}

export function parseFromSVGString(str: string): SVGParserResult {

    const parser = new DOMParser();
    const type = 'text/html';
    const document = parser.parseFromString(`<svg>${str.trim()}</svg>`, type);
    const svg = document.querySelector('svg');
    let root: Element;
    if (svg.childElementCount === 1 && svg.firstElementChild.tagName === 'g') {
        root = svg.firstElementChild;
    } else {
        root = svg;
    }

    const markup: dia.MarkupJSON = [];
    const attrs = {};
    const bindings: SVGParserBinding[] = [];

    build(root, { selector: 'root', children: markup }, attrs, bindings);

    return {
        markup,
        attrs,
        bindings
    };
}

// regex to identify whitespace:
const spaceRegex = /[^\S\r\n]+/g;

// regex to identify binding expressions:
// ReDoS mitigation: Avoid overlapping backtracking (x2)
const cbRegex = /{{(?:[\w|\(\),:\s]+|(\w+)\(\[([-\w. ]+(?:,[-\w. ]+)*)]\s*(?:,\s*([^,\s\n\r][^,\n\r]*))*\))}}/g;

// regex to identify binding expression functions:
// ReDoS mitigation: Avoid overlapping backtracking
const fnRegex = /^(\w+)\((\[[\w\s,]+]|\w+)\s*(?:,\s*([^,\s\n\r][^,\n\r]*))*\)$/;

let idCounter = 0;

function build(node: Element, markup: Partial<dia.MarkupNodeJSON>, attrs: dia.Cell.Attributes, bindings: SVGParserBinding[]) {

    const { tagName, attributes } = node;

    let selector = markup.selector;
    if (!selector) {
        const selectorAttribute = attributes.getNamedItem('@selector');
        selector = (selectorAttribute ? selectorAttribute.value : util.guid({}));
    }

    let groupSelector = markup.groupSelector;
    if (!groupSelector) {
        const groupSelectorAttribute = attributes.getNamedItem('@group-selector');
        if (groupSelectorAttribute) {
            groupSelector = groupSelectorAttribute.value.split(',').map(s => s.trim());
        }
    }

    markup.selector = selector;
    markup.groupSelector = groupSelector;
    markup.tagName = tagName;

    if (node.childElementCount === 0) {
        const { textContent } = node;
        if (cbRegex.test(textContent.replace(spaceRegex, ''))) {
            if (tagName === 'text') {
                node.setAttribute(':text', textContent);
            } else {
                throw new Error(`Text Interpolation within <${tagName}> is not supported yet.`);
            }
        } else if (textContent) {
            if (tagName === 'text') {
                node.setAttribute('text', textContent);
            } else {
                markup.textContent = textContent;
            }
        }
    }
    const nodeAttrs: attributes.SVGAttributes = {};

    Array.from(attributes).forEach(nodeAttribute => {
        const { name, value } = nodeAttribute;
        if (name.startsWith('@')) {
            // noop
        } else if (name.startsWith(':')) {
            const parseExpression = (id: string, attribute: string, context: string) => {
                let path = attribute;


                const [triggers, pathToBinding] = parsePathToBinding(path);

                const binding: SVGParserBinding = {
                    ...pathToBinding,
                    id,
                    path: [`${selector}`, name.slice(1)],
                    expression: context,
                    triggers
                }

                bindings.push(binding);
            }

            if (cbRegex.test(value)) {
                const matches: any[] = [];
                const substitutedExpression = value.replace(cbRegex, match => {
                    const id = `$${idCounter++}`;
                    const expression = match.slice(2, -2).replace(spaceRegex, '');
                    matches.push({ id, expression });
                    return id;
                });
                matches.forEach(({ id, expression }) => parseExpression(id, expression, substitutedExpression));
            } else {
                const id = `$${idCounter++}`;
                parseExpression(id, value, id);
            }

        } else {
            nodeAttrs[util.camelCase(name)] = value;
        }
    });
    if (Object.keys(nodeAttrs).length > 0) {
        attrs[selector] = nodeAttrs;
    }

    Array.from(node.children).forEach(childNode => {
        const json: Partial<dia.MarkupNodeJSON> = { children: [] };
        build(childNode, json, attrs, bindings);
        markup.children.push(json as dia.MarkupNodeJSON);
    });
}

interface PathToBinding {
    name: string,
    isFunction: boolean,
    args: any[]
}

function parsePathToBinding(path: string): [string[], PathToBinding] {
    if (fnRegex.test(path)) {
        const [, name, triggersMatch, ...rawArgs] = path.match(fnRegex);

        let triggersString = (triggersMatch.startsWith('['))
            ? triggersMatch.substring(1, triggersMatch.length - 1)
            : triggersMatch;

        const triggers = triggersString.split(',').map(trigger => trigger.trim());
        const args: any[] = [];

        if (rawArgs[0] !== undefined) {
            rawArgs.forEach(arg => {
                try {
                    args.push(JSON.parse(arg));
                } catch (e) {
                    throw new Error(`Invalid argument ${arg} in function call.`)
                }
            });
        }

        return [triggers, { name, isFunction: true, args }];
    }

    return [[path], { name: path, isFunction: false, args: [] }]
}
