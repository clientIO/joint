const SIDES = {
    top: 'NORTH',
    right: 'EAST',
    bottom: 'SOUTH',
    left: 'WEST'
};

// TODO custom label position
const appendElementLabel = (element, label) => {
    const { width, height } = getLabelDimensions(label);

    console.log(label);

    element.labels = [
        {
            text: label.text,
            width,
            height,
            layoutOptions: {
                'nodeLabels.placement': '[H_LEFT, V_TOP, OUTSIDE]',
                'font.size': label.fontSize,
            },
        }
    ];
};

const getLinkLabels = (labels) => {
    return labels.map(labelRaw => {
        const { attrs: { text }} = labelRaw;
        const { width, height, fontSize } = getLabelDimensions(text);

        return {
            text: text.text,
            width,
            height,
            layoutOptions: {
                'elk.font.size': fontSize
            }
        };
    });
};

// TODO get port size
const appendPorts = (element, child, idSplitChar) => {
    const bBox = child.getBBox();
    const groups = child.prop('ports/groups');
    if (!groups) return;
    const groupNames = Object.keys(groups);
    const mappedPorts = groupNames.reduce((acc, groupName) => ({ ...acc, ...child.getPortsPositions(groupName) }), {});

    Object.keys(mappedPorts).forEach((portId) => {
        mappedPorts[portId].x += bBox.x;
        mappedPorts[portId].y += bBox.y;
    });

    element.ports = child.getPorts().map((port) => {
        const { x, y } = mappedPorts[port.id] ?? {};

        return {
            id: `${child.id}${idSplitChar}${port.id}`,
            width: 10,
            height: 10,
            layoutOptions: {
                'port.side': SIDES[bBox.sideNearestToPoint({ x, y })],
                'port.index': child.getPortIndex(port.id),
                'port.borderOffset': -5,
            }
        };
    });
};

const getLabelDimensions = (label) => {
    const { text, fontSize = 12, fontFamily = 'sans-serif', fontWeight = 'Normal' } = label;

    const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const canvas = getLabelDimensions.canvas || (getLabelDimensions.canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    context.font = font;
    const metrics = context.measureText(text);

    return { 
        width: Math.round(metrics.width), 
        height: Math.round(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent),
        fontSize
    };
};

export { appendElementLabel, getLinkLabels, appendPorts };