const { dia, shapes: defaultShapes, highlighters } = joint;

class Rectangle extends dia.Element {

    preinitialize() {
        this.markup = [{
            tagName: 'rect',
            selector: 'body',
        }, {
            tagName: 'text',
            selector: 'label'
        }];
    }

    defaults() {
        return {
            ...super.defaults,
            type: 'Rectangle',
            attrs: {
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    strokeWidth: 2,
                    stroke: '#000000',
                    fill: '#FFFFFF'
                },
                label: {
                    textVerticalAnchor: 'middle',
                    textAnchor: 'middle',
                    x: 'calc(w/2)',
                    y: 'calc(h/2)',
                    fontSize: 14,
                    fill: '#333333',
                    fontFamily: 'sans-serif'
                }
            }
        };
    }
}

const shapes = { ...defaultShapes, Rectangle };

// Paper

const paperContainer = document.getElementById('paper');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: 800,
    height: '100%',
    gridSize: 20,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
});

paper.el.style.border = '1px solid lightgray';
paperContainer.style.height = '1000px';

paperContainer.appendChild(paper.el);

class IconsEffect extends highlighters.list {

    createListItem(imageSrc, { width, height }, currentItemNode) {
        const { preserveAspectRatio = 'xMidYMid' } = this.options;
        let itemNode = currentItemNode;
        if (!itemNode) {
            // The item node has not been created yet
            itemNode = V('image', {
                event: 'element:icon:pointerdown',
                cursor: 'pointer',
                preserveAspectRatio,
                width,
                height,
            }).node;
        }
        // Update the item node
        itemNode.setAttribute('href', imageSrc);
        return itemNode;
    }
}

class StatusEffect extends highlighters.list {

    createListItem({ color }, { width, height }) {
        const { node } = V('ellipse', {
            'event': 'element:status:pointerdown',
            'cursor': 'default',
            'rx': width / 2,
            'ry': height / 2,
            'cx': width / 2,
            'cy': height / 2,
            'fill': color,
            'stroke': '#333',
            'stroke-width': 2,
        });
        return node;
    }
}

// Random Icons

let counter = 0;

paper.on('element:icon:pointerdown', (elementView, evt) => {
    const { index = 0, attribute } = evt.target.dataset;
    setRandomIcon(elementView.model, index, attribute);
});

paper.on('element:status:pointerdown', (elementView) => {
    const element = elementView.model;
    const status = element.get('status');
    element.set('status', [...status, status[0]].slice(-3));
});

function setRandomIcon(element, index, attribute = 'icons', width = 30, height = width) {
    element.prop(
        [attribute, Number(index)],
        `https://picsum.photos/id/${counter++}/${width}/${height}`
    );
}

function setRandomIcons(element, attribute, count = 3, width, height) {
    Array.from({ length: count }).forEach((_, i) => setRandomIcon(element, i, attribute, width, height));
}

// Examples

const iconSize = 30;
const iconMargin = 10;
const iconGap = 5;
const iconSpace = iconSize + 2 * iconMargin;
const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis sollicitudin maximus mi ut ornare.';
const textMargin = 5;

//---- top-left ----
const rectangle1 = new Rectangle({
    size: { width: 180, height: 100 },
    position: { x: 20, y: 20 },
    attrs: {
        label: {
            text,
            y: `calc(h/2 + ${iconSpace / 2})`,
            textWrap: {
                width: `calc(w - ${2 * textMargin})`,
                height: `calc(h - ${iconSpace})`,
                ellipsis: true
            }
        }
    }
});
setRandomIcons(rectangle1);
rectangle1.addTo(graph);

IconsEffect.add(rectangle1.findView(paper), 'root', 'icons', {
    attribute: 'icons',
    position: 'top-left',
    margin: iconMargin,
    size: iconSize,
    gap: iconGap,
});
//---- bottom-right ----
const rectangle2 = new Rectangle({
    size: { width: 180, height: 100 },
    position: { x: 20, y: 220 },
    attrs: {
        label: {
            text,
            y: `calc(h/2 - ${iconSpace / 2})`,
            textWrap: {
                width: `calc(w - ${2 * textMargin})`,
                height: `calc(h - ${iconSpace})`,
                ellipsis: true
            }
        }
    }
});
setRandomIcons(rectangle2);
rectangle2.addTo(graph);

IconsEffect.add(rectangle2.findView(paper), 'root', 'icons', {
    attribute: 'icons',
    position: 'bottom-right',
    margin: iconMargin,
    size: iconSize,
    gap: iconGap,
});
//---- bottom ----
const rectangle3 = new Rectangle({
    size: { width: 180, height: 100 },
    position: { x: 20, y: 420 },
    attrs: {
        label: {
            text,
            y: `calc(h/2 - ${iconSpace / 2})`,
            textWrap: {
                width: `calc(w - ${2 * textMargin})`,
                height: `calc(h - ${iconSpace})`,
                ellipsis: true
            }
        }
    }
});
setRandomIcons(rectangle3, 'icons', 2, 50, iconSize);
rectangle3.addTo(graph);

IconsEffect.add(rectangle3.findView(paper), 'root', 'icons', {
    attribute: 'icons',
    position: 'bottom',
    margin: iconMargin,
    size: { width: 50, height: iconSize },
    gap: iconGap,
    preserveAspectRatio: 'none'
});
//---- center + row ----
const rectangle4 = new Rectangle({
    size: { width: 120, height: 60 },
    position: { x: 20, y: 620 },
    attrs: {
        label: {
            y: 'calc(h + 20)',
            text: 'Center Row'
        }
    }
});
setRandomIcons(rectangle4);
rectangle4.addTo(graph);

IconsEffect.add(rectangle4.findView(paper), 'root', 'icons', {
    attribute: 'icons',
    position: 'center',
    margin: iconMargin,
    size: iconSize,
    gap: iconGap,
});
//---- top-left + column direction ----
const rectangle5 = new Rectangle({
    size: { width: 140, height: 120 },
    position: { x: 320, y: 20 },
    attrs: {
        label: {
            text,
            x: `calc(w/2 + ${iconSpace / 2})`,
            textWrap: {
                width: `calc(w - ${iconSpace + 2 * textMargin})`,
                height: `calc(h - ${2 * textMargin})`,
                ellipsis: true
            }
        }
    }
});
setRandomIcons(rectangle5);
rectangle5.addTo(graph);

IconsEffect.add(rectangle5.findView(paper), 'root', 'icons', {
    attribute: 'icons',
    position: 'top-left',
    margin: iconMargin,
    size: iconSize,
    gap: iconGap,
    direction: 'column'
});
//---- bottom-right + column direction ----
const rectangle6 = new Rectangle({
    size: { width: 140, height: 120 },
    position: { x: 320, y: 220 },
    attrs: {
        label: {
            text,
            x: `calc(w/2 - ${iconSpace / 2})`,
            textWrap: {
                width: `calc(w - ${iconSpace + 2 * textMargin})`,
                height: `calc(h - ${2 * textMargin})`,
                ellipsis: true
            }
        }
    }
});
setRandomIcons(rectangle6);
rectangle6.addTo(graph);

IconsEffect.add(rectangle6.findView(paper), 'root', 'icons', {
    attribute: 'icons',
    position: 'bottom-right',
    margin: iconMargin,
    size: iconSize,
    gap: iconGap,
    direction: 'column'
});
//---- center + row ----
const rectangle7 = new Rectangle({
    size: { width: 60, height: 120 },
    position: { x: 220, y: 600 },
    attrs: {
        label: {
            y: 'calc(h + 20)',
            text: 'Center Column'
        }
    }
});
setRandomIcons(rectangle7);
rectangle7.addTo(graph);

IconsEffect.add(rectangle7.findView(paper), 'root', 'icons', {
    attribute: 'icons',
    position: 'center',
    margin: iconMargin,
    size: iconSize,
    gap: iconGap,
    direction: 'column'
});
//---- 2 x bottom-top + column direction ----
const rectangle8 = new Rectangle({
    size: { width: 140, height: 120 },
    position: { x: 320, y: 420 },
    attrs: {
        label: {
            text,
            x: `calc(w/2 - ${iconSize + iconMargin + iconGap / 2})`,
            textWrap: {
                width: `calc(w - ${2 * iconSize + 2 * iconMargin + iconGap + 2 * textMargin})`,
                height: `calc(h - ${2 * textMargin})`,
                ellipsis: true
            }
        }
    }
});
setRandomIcons(rectangle8, 'icons1');
setRandomIcons(rectangle8, 'icons2');
rectangle8.addTo(graph);

IconsEffect.add(rectangle8.findView(paper), 'root', 'icons1', {
    attribute: 'icons1',
    position: 'bottom-right',
    margin: iconMargin,
    size: iconSize,
    gap: iconGap,
    direction: 'column'
});
IconsEffect.add(rectangle8.findView(paper), 'root', 'icons2', {
    attribute: 'icons2',
    position: 'bottom-right',
    margin: { vertical: iconMargin, horizontal: iconGap + iconSize + iconMargin },
    size: iconSize,
    gap: iconGap,
    direction: 'column'
});
//---- bottom-right + column direction ----
const rectangle9 = new shapes.standard.HeaderedRectangle({
    size: { width: 160, height: 140 },
    position: { x: 520, y: 20 },
    attrs: {
        headerText: {
            refX: null, // reset default
            textAnchor: 'start',
            text: 'Header Lorem Ipsum',
            x: textMargin,
            textWrap: {
                width: `calc(w - ${2 * textMargin + 40 /* status width */ })`,
                maxLineCount: 1,
                ellipsis: true
            },
            fontFamily: 'sans-serif',
        },
        bodyText: {
            refX: null, // reset default
            text,
            x: `calc(w/2 + ${iconSpace / 2})`,
            textWrap: {
                width: `calc(w - ${iconSpace + 2 * textMargin})`,
                height: `calc(h - ${2 * textMargin})`,
                ellipsis: true
            },
            fontFamily: 'sans-serif',
        }
    }
});
setRandomIcons(rectangle9, 'icons', 2);
rectangle9.addTo(graph);

IconsEffect.add(rectangle9.findView(paper), 'root', 'icons', {
    attribute: 'icons',
    position: 'top-left',
    margin: { left: iconMargin, top: iconMargin + 30 /* header height */ },
    size: iconSize,
    gap: iconGap,
    direction: 'column'
});

rectangle9.set('status', [{ color: 'red' }, { color: 'yellow' }, { color: 'blue' }]);
StatusEffect.add(rectangle9.findView(paper), 'root', 'status', {
    attribute: 'status',
    position: 'top-right',
    margin: { right: 5, top: 10 },
    size: 10,
    gap: 3,
    direction: 'row'
});
