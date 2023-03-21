import V from '../V/index.mjs';

export function svg(strings, ...expressions) {
    const svgParts = [];
    strings.forEach((part, index) => {
        svgParts.push(part);
        if (index in expressions) {
            svgParts.push(expressions[index]);
        }
    });
    const markup = parseFromSVGString(svgParts.join(''));
    return markup;
}

function parseFromSVGString(str) {
    const parser = new DOMParser();
    const markupString = `<svg>${str.trim()}</svg>`;
    const xmldocument = parser.parseFromString(markupString.replace(/@/g, ''), 'application/xml');
    if (xmldocument.getElementsByTagName('parsererror')[0]) {
        throw new Error('Invalid SVG markup');
    }
    const document = parser.parseFromString(markupString, 'text/html');
    const svg = document.querySelector('svg');
    return build(svg);
}

function buildNode(node) {
    const markupNode = {};
    const { tagName, attributes, namespaceURI, style, childNodes } = node;

    markupNode.namespaceURI = namespaceURI;
    markupNode.tagName = (namespaceURI === V.namespace.xhtml)
        // XHTML documents must use lower case for all HTML element and attribute names.
        // The tagName property returns upper case value for HTML elements.
        // e.g. <DIV> vs.<div/>
        ? tagName.toLowerCase()
        : tagName;

    const stylesObject = {};
    for (var i = style.length; i--;) {
        var nameString = style[i];
        stylesObject[nameString] = style.getPropertyValue(nameString);
    }
    markupNode.style = stylesObject;

    // selector fallbacks to tagName
    const selectorAttribute = attributes.getNamedItem('@selector');
    if (selectorAttribute) {
        markupNode.selector = selectorAttribute.value;
        attributes.removeNamedItem('@selector');
    }

    const groupSelectorAttribute = attributes.getNamedItem('@group-selector');
    if (groupSelectorAttribute) {
        const groupSelectors = groupSelectorAttribute.value.split(',');
        markupNode.groupSelector = groupSelectors.map(s => s.trim());

        attributes.removeNamedItem('@group-selector');
    }

    const className = attributes.getNamedItem('class');
    if (className) {
        markupNode.className = className.value;
    }

    const children = [];
    childNodes.forEach(node => {
        switch (node.nodeType) {
            case Node.TEXT_NODE: {
                const trimmedText = node.data.replace(/\s\s+/g, ' ');
                if (trimmedText.trim()) {
                    children.push(trimmedText);
                }
                break;
            }
            case Node.ELEMENT_NODE: {
                children.push(buildNode(node));
                break;
            }
            default:
                break;
        }
    });
    if (children.length) {
        markupNode.children = children;
    }

    const nodeAttrs = {};

    Array.from(attributes).forEach(nodeAttribute => {
        const { name, value } = nodeAttribute;
        nodeAttrs[name] = value;
    });

    if (Object.keys(nodeAttrs).length > 0) {
        markupNode.attributes = nodeAttrs;
    }

    return markupNode;
}

function build(root) {
    const markup = [];

    Array.from(root.children).forEach(node => {
        markup.push(buildNode(node));
    });

    return markup;
}
