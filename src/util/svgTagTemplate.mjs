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

function build(root) {
    const markup = [];

    Array.from(root.children).forEach(node => {
        const markupNode = {};
        const { tagName, attributes, textContent, namespaceURI, style } = node;

        markupNode.tagName = tagName;
        markupNode.namespaceURI = namespaceURI;

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

        if (textContent) {
            markupNode.textContent = textContent;
        }

        const nodeAttrs = {};

        Array.from(attributes).forEach(nodeAttribute => {
            const { name, value } = nodeAttribute;
            nodeAttrs[name] = value;
        });

        if (Object.keys(nodeAttrs).length > 0) {
            markupNode.attributes = nodeAttrs;
        }

        if (node.childElementCount > 0) {
            markupNode.children = build(node);
        }

        markup.push(markupNode);
    });

    return markup;
}
