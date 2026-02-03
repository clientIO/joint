import { dia, util, shapes as defaultShapes } from '@joint/core';
import './styles.css';

const chevronCount = 40;
const chevronHeight = 8;
const chevronWidth = 3;
const timelineColor = '#fff';
const backgroundColor = '#444';
const padding = 10;
const gap = 70;
const timelineY = 300;
const timelineXMin = 140;
const timelineXMax = 1100;

const timelineEventJSONMarkup = util.svg`
    <ellipse @selector="body"/>
    <text @selector="title"/>
    <text @selector="subtitle"/>
    <text @selector="description"/>
`;

class TimelineEvent extends dia.Element {

    defaults() {
        return {
            ...super.defaults,
            type: 'TimelineEvent',
            attrs: {
                root: {
                    magnetSelector: 'body',
                    cursor: 'move'
                },
                body: {
                    stroke: 'none',
                    cx: 'calc(w/2)',
                    cy: 'calc(h/2)',
                    rx: 'calc(w/2)',
                    ry: 'calc(h/2)',
                },
                title: {
                    text: 'Label Inside',
                    fontSize: 18,
                    fontFamily: 'sans-serif',
                    fill: timelineColor,
                    textVerticalAnchor: 'top',
                    textAnchor: 'end',
                    x: 'calc(w)',
                    y: 'calc(h + 10)'
                },
                subtitle: {
                    text: 'Subtitle',
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    fill: timelineColor,
                    textVerticalAnchor: 'top',
                    textAnchor: 'end',
                    x: 'calc(w)',
                    y: 'calc(h + 40)'
                },
                description: {
                    text: 'Description',
                    fontSize: 11,
                    fontFamily: 'sans-serif',
                    fill: timelineColor,
                    textVerticalAnchor: 'top',
                    textAnchor: 'end',
                    x: 'calc(w)',
                    y: 'calc(h + 60)'
                },

            }
        };
    }

    preinitialize() {
        this.markup = timelineEventJSONMarkup;
    }

    positionLabels() {
        if (this.position().y > timelineY) {
            if (this.attr('title/y') === 'calc(h + 10)') return;
            this.attr({
                title: {
                    y: 'calc(h + 10)',
                    textVerticalAnchor: 'top'
                },
                subtitle: {
                    y: 'calc(h + 40)',
                    textVerticalAnchor: 'top'
                },
                description: {
                    y: 'calc(h + 60)',
                    textVerticalAnchor: 'top'
                }
            });
        } else {
            if (this.attr('title/y') === -10) return;
            this.attr({
                title: {
                    y: -10,
                    textVerticalAnchor: 'bottom'
                },
                subtitle: {
                    y: -40,
                    textVerticalAnchor: 'bottom'
                },
                description: {
                    y: -60,
                    textVerticalAnchor: 'bottom'
                }
            });
        }
    }
}

const shapes = { ...defaultShapes, TimelineEvent };

const graph = new dia.Graph({}, {
    cellNamespace: shapes
});

const paper = new dia.Paper({
    width: '100%',
    height: '100%',
    model: graph,
    defaultConnectionPoint: {
        name: 'boundary'
    },
    background: {
        color: backgroundColor
    },
    cellViewNamespace: shapes,
    interactive: (cellView) => {
        return (cellView.model instanceof TimelineEvent);
    },
    restrictTranslate(elementView) {
        const timelineMargin = 20;
        const bbox = elementView.model.getBBox();
        const xMin = timelineXMin;
        const xMax = timelineXMax - bbox.width;
        const yMin = timelineY - bbox.height - timelineMargin;
        const yMax = timelineY + timelineMargin;
        return function(x, y) {
            return {
                x: Math.max(xMin, Math.min(xMax, x)),
                y: (y > timelineY) ? Math.max(yMax, y) : Math.min(yMin, y)
            };
        };
    },
    gridSize: 10,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    defaultLink: () => new shapes.standard.DoubleLink(),
    defaultLinkAnchor: { name: 'connectionPerpendicular' }
});

document.getElementById('paper-container').appendChild(paper.el);
// Timeline

const start = new shapes.standard.Ellipse({
    position: {
        x: timelineXMin - 120,
        y: timelineY - 60
    },
    size: {
        width: 120,
        height: 120
    },
    attrs: {
        root: {
            pointerEvents: 'none'
        },
        body: {
            stroke: timelineColor,
            fill: backgroundColor,
            strokeWidth: 3
        },
        label: {
            fill: timelineColor,
            fontFamily: 'sans-serif',
            fontSize: 18
        }
    }
});
const end = new shapes.standard.Ellipse({
    position: {
        x: timelineXMax,
        y: timelineY - 30
    },
    size: {
        width: 60,
        height: 60
    },
    attrs: {
        root: {
            pointerEvents: 'none'
        },
        body: {
            stroke: timelineColor,
            fill: backgroundColor,
            strokeWidth: 3
        },
        label: {
            fontSize: 13,
            fill: timelineColor,
            fontFamily: 'sans-serif',
            text: 'present'
        }
    }
});

const timeline = new shapes.standard.Link({
    source: {
        id: start.id
    },
    target: {
        id: end.id
    },
    z: -2,
    attrs: {
        root: {
            pointerEvents: 'none'
        },
        line: {
            strokeWidth: chevronHeight,
            stroke: timelineColor,
            targetMarker: null,
            vertexMarker: {
                d: `M -${2 * chevronWidth} -${chevronHeight / 2} h ${chevronWidth} L 0 0 -${chevronWidth} ${chevronHeight / 2} h -${chevronWidth} L -${chevronWidth} 0 z`,
                fill: backgroundColor,
                stroke: 'none'
            }
        }
    },
    vertices: Array.from({ length: chevronCount }).map((_, i) => {
        return {
            x: timelineXMin + padding + i * (timelineXMax - timelineXMin - padding) / chevronCount,
            y: timelineY
        };
    })
});

graph.addCells([start, end, timeline]);

graph.on('change:position', function(cell) {
    if (cell instanceof TimelineEvent) {
        cell.positionLabels();
    }
});

// Node.JS Milestones example

const colors = ['#F4F269', '#E7ED6A', '#DBE76A', '#CEE26B', '#C1DD6B', '#B5D76C', '#A8D26D', '#9BCD6D', '#8FC76E', '#82C26E', '#75BD6F', '#69B76F', '#5CB270', '#4DA562'];

start.attr({
    label: {
        fill: shadeHexColor(colors[0], 0.5),
        text: 'Node.js\nMilestones'
    }
});

addEvent(gap * 0, 50, {
    color: colors[0],
    title: '2009',
    subtitle: 'Node.js is born',
    description: '● The first form of npm is created'
});

addEvent(gap * 1, -100, {
    color: colors[1],
    title: '2010',
    subtitle: '',
    description: '● Express is born\n● Socket.io is born'
});

addEvent(gap * 2, 100, {
    color: colors[2],
    title: '2011',
    subtitle: 'Version 1.0',
    description: '● Larger companies start adopting Node.js: LinkedIn, Uber, etc.\n● Hapi is born'
});

addEvent(gap * 3, -50, {
    color: colors[3],
    title: '2012',
    subtitle: '',
    description: '● Adoption continues very rapidly'
});

addEvent(gap * 4, 50, {
    color: colors[4],
    title: '2013',
    subtitle: '',
    description: '● First blogging platform using Node.js: Ghost\n● Koa is born'
});

addEvent(gap * 5, -100, {
    color: colors[5],
    title: '2014',
    subtitle: 'The Big Fork',
    description: '● IO.js is a major fork of Node.js, with the goal of introducing ES6 support and moving faster'
});

addEvent(gap * 6, 100, {
    color: colors[6],
    title: '2015',
    subtitle: 'Version 4.0',
    description: '● The Node.js foundation is born\n● IO.js is merged back into Node.js\n● NPM introduces private modules'
});

addEvent(gap * 7, -50, {
    color: colors[7],
    title: '2016',
    subtitle: 'Version 6.0',
    description: '● The leftpad incident\n● NPM introduces package-lock.json\n● Yarn is born.'
});

addEvent(gap * 8, 50, {
    color: colors[8],
    title: '2017',
    subtitle: 'Version 8.0',
    description: '● NPM focuses more on security\n● HTTP/2\n● V8 introduces Node.js in its testing suite, officially making Node.js a target for the JS engine, in addition to Chrome\n● 3 billion NPM downloads every week'
});

addEvent(gap * 9, -100, {
    color: colors[9],
    title: '2018',
    subtitle: 'v10.0 and v11.0',
    description: '● ES modules .mjs experimental support.'
});

addEvent(gap * 10, 100, {
    color: colors[10],
    title: '2019',
    subtitle: 'v12.0 and v13.0',
});

addEvent(gap * 11, -50, {
    color: colors[11],
    title: '2020',
    subtitle: 'v14.0 and v15.0',
});

addEvent(gap * 12, 50, {
    color: colors[12],
    title: '2021',
    subtitle: 'Version 16.0',
});

addEvent(gap * 13, -100, {
    color: colors[13],
    title: '2022',
    subtitle: 'Version 18.0',
    description: '● Active LTS'
});

// Functions

function shadeHexColor(color, percent) {
    const f = parseInt(color.slice(1), 16);
    const t = percent < 0 ? 0 : 255;
    const p = percent < 0 ? percent * -1 : percent;
    const R = f >> 16;
    const G = f >> 8 & 0x00FF;
    const B = f & 0x0000FF;
    return '#' + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

function addEvent(x, y, options = {}) {
    const { color = '#000', title = '', subtitle = '', description = '' } = options;
    const event = new TimelineEvent({
        position: {
            x: timelineXMin + padding + x,
            y: y > 0 ? timelineY + y : timelineY + y - 30
        },
        size: {
            width: 30,
            height: 30
        },
        attrs: {
            body: {
                fill: color,
            },
            title: {
                fill: color,
                text: title
            },
            subtitle: {
                text: subtitle,
                fill: shadeHexColor(color, 0.5)
            },
            description: {
                text: description,
                textWrap: { width: 120, height: null }
            }
        }
    });
    const eventLine = new shapes.standard.Link({
        source: { id: event.id },
        target: { id: timeline.id },
        z: -1,
        attrs: {
            root: {
                pointerEvents: 'none'
            },
            line: {
                strokeWidth: 1,
                stroke: timelineColor,
                strokeDasharray: '2,2',
                targetMarker: {
                    markup: util.svg`
                        <circle r="14" stroke="${timelineColor}" stroke-width="1" fill="${backgroundColor}" />
                        <circle r="8" fill="${color}" stroke="none" />
                    `
                }
            }
        }
    });
    event.positionLabels();
    graph.addCells([event, eventLine]);
}

function scaleToFit() {
    paper.scaleContentToFit({
        useModelGeometry: true,
        padding: { horizontal: 20, vertical: 40 }
    });
    const sy = paper.scale().sy;
    paper.translate(0, (paper.getArea().height / 2 - timelineY) * sy);
};

window.addEventListener('resize', () => scaleToFit());
scaleToFit();
