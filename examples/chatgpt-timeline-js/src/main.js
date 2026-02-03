import { V, g, dia, shapes as defaultShapes, util, connectors } from '@joint/core';
import './styles.css';

const shapes = { ...defaultShapes };

// Paper

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    gridSize: 20,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    defaultConnector: { name: 'curve' },
    defaultConnectionPoint: {
        name: 'anchor'
    },
    background: {
        color: '#fff'
    }

});

paperContainer.appendChild(paper.el);

// Color palette
const colors = ['#557ac5', '#7593d0', '#d9e1f2', '#ecf0f9', '#b73e66', '#2CA58D', '#FEFEFE'];


// Underline hyperlinks on hover
paper.svg.appendChild(
    V.createSVGStyle(`
        .event-link:hover text {
            text-decoration: underline;
        }
    `)
);

const eventMarkup = util.svg`
    <rect @selector="dateBackground"/>
    <text @selector="date"/>
    <path @selector="body"/>
    <a class="event-link" @selector="link">
        <text @selector="label"/>
    </a>
`;

class Event extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: 'Event',
            z: 1,
            attrs: {
                root: {
                    magnetSelector: 'body',
                    cursor: 'move'
                },
                body: {
                    d: 'M 10 0 H calc(w-10) A 10 10 0 0 1 calc(w) 10 V calc(h-30) H 10 A 10 10 0 0 1 0 calc(h-40) V 10 A 10 10 0 0 1 10 0 Z',
                    strokeWidth: 2,
                    rx: 5,
                    ry: 5,
                    fill: colors[1],
                    stroke: colors[0],
                },
                label: {
                    fontFamily: 'sans-serif',
                    fontSize: 15,
                    x: 'calc(w/2)',
                    y: 'calc(h/2 - 15)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    lineHeight: 24,
                    textWrap: {
                        width: -10,
                        height: null
                    },
                    fill: colors[6],
                },
                date: {
                    fontFamily: 'sans-serif',
                    fontSize: 14,
                    x: 'calc(w - 30)',
                    y: 'calc(h - 15)',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fill: colors[5]
                },
                dateBackground: {
                    width: 60,
                    height: 40,
                    x: 'calc(w - 60)',
                    y: 'calc(h - 40)',
                    stroke: colors[2],
                    fill: colors[6],
                    strokeWidth: 1,
                    rx: 10,
                    ry: 10
                },
                link: {
                    xlinkShow: 'new',
                    cursor: 'pointer'
                }
            }
        };
    }

    preinitialize() {
        this.markup = eventMarkup;
    }
}

shapes.Event = Event;

function createEvent(text, date, url) {
    return new Event({
        size: { width: 150, height: 110 },
        year: date.getFullYear(),
        attrs: {
            label: {
                text,
            },
            date: {
                // Format date as "Jan 1"
                text: date.toLocaleString('default', { month: 'short', day: 'numeric' }),
            },
            link: {
                xlinkHref: url
            }
        }
    });
}

function createLink(source, target) {
    return new shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id },
        z: 2,
        attrs: {
            line: {
                stroke: colors[4],
                strokeWidth: 3,
            }
        }
    });
}

const events = [

    // 2015

    // Introducing OpenAI
    // December 11, 2015 — Announcements
    // https://openai.com/blog/introducing-openai/
    createEvent('Introducing OpenAI', new Date('12/11/2015'), 'https://openai.com/blog/introducing-openai/'),
    // 2016

    // OpenAI Gym Beta
    // April 27, 2016 — Research
    // https://openai.com/blog/openai-gym-beta/
    createEvent('OpenAI Gym Beta', new Date('04/27/2016'), 'https://openai.com/blog/openai-gym-beta/'),

    // Universe
    // December 5, 2016 — Research
    // https://openai.com/blog/universe/
    createEvent('Universe', new Date('12/05/2016'), 'https://openai.com/blog/universe/'),

    // 2017

    // Proximal Policy Optimization
    // July 20, 2017 — Research, Milestones
    // https://openai.com/blog/openai-baselines-ppo/
    createEvent('Proximal Policy Optimization', new Date('07/20/2017'), 'https://openai.com/blog/openai-baselines-ppo/'),
    // Dota 2
    // August 11, 2017 — Research, OpenAI Five
    // https://openai.com/blog/dota-2/
    createEvent('Dota 2', new Date('08/11/2017'), 'https://openai.com/blog/dota-2/'),

    // 2018

    // Preparing for Malicious Uses of AI
    // February 20, 2018 — Research
    // https://openai.com/blog/preparing-for-malicious-uses-of-ai/
    createEvent('Preparing for Malicious Uses of AI', new Date('02/20/2018'), 'https://openai.com/blog/preparing-for-malicious-uses-of-ai/'),
    // OpenAI Charter
    // April 9, 2018 — Announcements, Milestones
    // https://openai.com/blog/openai-charter/
    createEvent('OpenAI Charter', new Date('04/09/2018'), 'https://openai.com/blog/openai-charter/'),
    // Learning Dexterity
    // July 30, 2018 — Research, Milestones
    // https://openai.com/blog/learning-dexterity/
    createEvent('Learning Dexterity', new Date('07/30/2018'), 'https://openai.com/blog/learning-dexterity/'),

    // 2019

    // Better Language Models and Their Implications
    // February 14, 2019 — Research, Milestones, GPT-2
    // https://openai.com/blog/better-language-models/
    createEvent('Better Language Models and Their Implications', new Date('02/14/2019'), 'https://openai.com/blog/better-language-models/'),
    // OpenAI LP
    // March 11, 2019 — Announcements
    // https://openai.com/blog/openai-lp/
    createEvent('OpenAI LP', new Date('03/11/2019'), 'https://openai.com/blog/openai-lp/'),
    // OpenAI Five Defeats Dota 2 World Champions
    // April 15, 2019 — Research, OpenAI Five
    // https://openai.com/blog/openai-five-defeats-dota-2-world-champions/
    createEvent('OpenAI Five Defeats Dota 2 World Champions', new Date('04/15/2019'), 'https://openai.com/blog/openai-five-defeats-dota-2-world-champions/'),
    // MuseNet
    // April 25, 2019 — Research, Milestones
    // https://openai.com/blog/musenet/
    createEvent('MuseNet', new Date('04/25/2019'), 'https://openai.com/blog/musenet/'),
    // Microsoft Invests In and Partners with
    // OpenAI to Support Us Building Beneficial AGI
    // July 22, 2019 — Announcements
    // https://openai.com/blog/microsoft/
    createEvent('Microsoft Invests In and Partners with OpenAI to Support Us Building Beneficial AGI', new Date('07/22/2019'), 'https://openai.com/blog/microsoft/'),
    // GPT-2: 6-Month Follow-Up
    // August 20, 2019 — Research, GPT-2
    // https://openai.com/blog/gpt-2-6-month-follow-up/
    createEvent('GPT-2: 6-Month Follow-Up', new Date('08/20/2019'), 'https://openai.com/blog/gpt-2-6-month-follow-up/'),
    // Emergent Tool Use from Multi-Agent Interaction
    // September 17, 2019 — Research, Milestones
    // https://openai.com/blog/emergent-tool-use/
    createEvent('Emergent Tool Use from Multi-Agent Interaction', new Date('09/17/2019'), 'https://openai.com/blog/emergent-tool-use/'),
    // Solving Rubik’s Cube with a Robot Hand
    // October 15, 2019 — Research, Milestones
    // https://openai.com/blog/solving-rubiks-cube/
    createEvent('Solving Rubik’s Cube with a Robot Hand', new Date('10/15/2019'), 'https://openai.com/blog/solving-rubiks-cube/'),
    // GPT-2: 1.5B Release
    // November 5, 2019 — Research, GPT-2
    // https://openai.com/blog/gpt-2-1-5b-release/
    createEvent('GPT-2: 1.5B Release', new Date('11/05/2019'), 'https://openai.com/blog/gpt-2-1-5b-release/'),

    // 2020

    // Jukebox
    // April 30, 2020 — Research, Milestones
    // https://openai.com/blog/jukebox/
    createEvent('Jukebox', new Date('04/30/2020'), 'https://openai.com/blog/jukebox/'),
    // OpenAI API
    // June 11, 2020 — API, Announcements
    // https://openai.com/blog/openai-api/
    createEvent('OpenAI API', new Date('06/11/2020'), 'https://openai.com/blog/openai-api/'),

    // 2021


    // CLIP: Connecting Text and Images
    // January 5, 2021 — Research, Milestones, M
    // https://openai.com/blog/clip/
    createEvent('CLIP: Connecting Text and Images', new Date('01/05/2021'), 'https://openai.com/blog/clip/'),
    // DALL·E: Creating Images from Text
    // January 5, 2021 — Research, Milestones, Multimodal
    // https://openai.com/blog/dall-e/
    createEvent('DALL·E: Creating Images from Text', new Date('01/05/2021'), 'https://openai.com/blog/dall-e/'),
    // Multimodal Neurons in Artificial Neural Networks
    // March 4, 2021 — Research, Milestones, Multimodal
    // https://openai.com/blog/clip/
    createEvent('Multimodal Neurons in Artificial Neural Networks', new Date('03/04/2021'), 'https://openai.com/blog/clip/'),
    // OpenAI Codex
    // August 10, 2021 — API, Announcements
    // https://openai.com/blog/openai-codex/
    createEvent('OpenAI Codex', new Date('08/10/2021'), 'https://openai.com/blog/openai-codex/'),

    // 2022

    // DALL·E 2
    // April 6, 2022 — Research, Multimodal
    // https://openai.com/blog/dall-e-2/
    createEvent('DALL·E 2', new Date('04/06/2022'), 'https://openai.com/blog/dall-e-2/'),
    // ChatGPT: Optimizing Language Models for Dialogue
    // November 30, 2022 — Announcements, Research
    // https://openai.com/blog/chatgpt/
    createEvent('ChatGPT: Optimizing Language Models for Dialogue', new Date('11/30/2022'), 'https://openai.com/blog/chatgpt/'),
];


const eventLinks = Array.from({ length: events.length - 1 }).map((_, i) => createLink(events[i], events[i + 1]));

// Make some events bigger.
events[8].resize(150, 120);
events[12].resize(250, 120);
events[19].resize(200, 120);
events[24].resize(200, 120);

graph.addCells([...events, ...eventLinks]);

function serpentineLayout(graph, elements, options = {}) {
    const {
        gap = 20,
        width = 1000,
        rowHeight = 100,
        x = 0,
        y = 0,
        alignRowLastElement = false
    } = options;
    const linkProps = [];
    const elementProps = [];
    let currentX = x;
    let currentY = y + rowHeight / 2;
    let leftToRight = true;
    let index = 0;
    // Find the links that connect the elements in the order they are in the array.
    const links = [];
    elements.forEach((el, i) => {
        const nextEl = elements[i + 1];
        if (!nextEl) return;
        const link = graph.getConnectedLinks(el, { outbound: true }).find(l => l.target().id === nextEl.id);
        if (link) links.push(link);
    });
    // Calculate the positions of the elements and the links.
    while (index < elements.length) {
        const item = elements[index];
        const size = item.size();
        if (leftToRight) {
            if (currentX + size.width > x + width) {
                // Not enough space on the right. Move to the next row.
                // The current element will be processed in the next iteration.
                currentX = x + width;
                currentY += rowHeight;
                leftToRight = false;
                if (index > 0) {
                    linkProps[index - 1] = {
                        source: { anchor: { name: 'right' }},
                        target: { anchor: { name: 'right' }},
                    };
                    if (alignRowLastElement) {
                        // Adjust the position of the previous element to make sure
                        // it is aligned with the right edge of the result.
                        elementProps[elementProps.length - 1].position.x = Math.max(
                            x + width - elements[elementProps.length - 1].size().width,
                            x
                        );
                    }
                }
            }
        } else {
            if (currentX - size.width < x) {
                // Not enough space on the left. Move to the next row.
                // The current element will be processed in the next iteration.
                currentX = x;
                currentY += rowHeight;
                leftToRight = true;
                if (index > 0) {
                    linkProps[index - 1] = {
                        source: { anchor: { name: 'left' }},
                        target: { anchor: { name: 'left' }},
                    };
                    if (alignRowLastElement) {
                        // Adjust the position of the previous element to make sure
                        // it is aligned with the left side of the result.
                        elementProps[elementProps.length - 1].position.x = x;
                    }
                }
            }
        }
        elementProps[index] = {
            position: { y: currentY - size.height / 2 },
            leftToRight
        };
        if (leftToRight) {
            elementProps[index].position.x = currentX;
            currentX += size.width + gap;
        } else {
            elementProps[index].position.x = Math.max(currentX - size.width, x);
            currentX -= size.width + gap;
        }
        // Adjust the link between the current element and the next one.
        if (index < links.length) {
            if (leftToRight) {
                linkProps[index] = {
                    source: { anchor: { name: 'right' }},
                    target: { anchor: { name: 'left' }},
                };
            } else {
                linkProps[index] = {
                    source: { anchor: { name: 'left' }},
                    target: { anchor: { name: 'right' }},
                };
            }
        }
        index++;
    }
    // Set the positions of the elements and the links.
    elementProps.forEach((props, i) => {
        elements[i].prop(props);
    });
    linkProps.forEach((props, i) => {
        if (links[i]) {
            links[i].prop(props);
        }
    });
    return currentY;
}

function createBoundaries(elements) {

    const boundaries = [];
    let eventsInYear = [];
    let currentYear = null;
    // Create boundaries for each year.
    elements.forEach(el => {
        const year = el.get('year');
        if (year !== currentYear) {
            currentYear = year;
            if (eventsInYear.length > 0) {
                boundaries.push(...createBoundary(eventsInYear));
                eventsInYear = [];
            }
        }
        eventsInYear.push(el);
    });
    boundaries.push(...createBoundary(eventsInYear));
    paper.getLayerNode(dia.Paper.Layers.BACK).replaceChildren(...boundaries);

    function getElementCornerPoints(element, padding = 0) {
        const bbox = element.getBBox().inflate(padding);
        return [
            bbox.topLeft(),
            bbox.topRight(),
            bbox.bottomLeft(),
            bbox.corner(),
        ];
    }

    function createBoundaryPathData(points, radius = 0) {
        // The first and the last point are the same.
        // Make sure the origin is not at the corner of the boundary
        // because the rounded connector will not look good.
        const origin = new g.Line(points[0], points[points.length - 1]).midpoint();
        return connectors.rounded(origin, origin, points, { radius });
    }

    function createBoundary(elements, padding = 20) {
        // Find the corner points of all elements.
        const points = [];
        elements.forEach(el => {
            points.push(...getElementCornerPoints(el, padding));
        });
        // Add the points of the tab.
        let labelPosition;
        const [firstElement] = elements;
        const [el0topLeft, el0topRight] = points;
        const tabHeight = 30;
        const tabWidth = 120;
        if (firstElement.get('leftToRight')) {
            points.push(
                el0topLeft.clone().offset(0, -tabHeight),
                el0topLeft.clone().offset(tabWidth, -tabHeight)
            );
            labelPosition = el0topLeft.clone().offset(tabWidth / 2, (padding - tabHeight) / 2);
        } else {
            points.push(
                el0topRight.clone().offset(0, -tabHeight),
                el0topRight.clone().offset(-tabWidth, -tabHeight)
            );
            labelPosition = el0topRight.clone().offset(-tabWidth / 2, (padding - tabHeight) / 2);
        }
        // Find the convex hull of the points.
        const convexHullPolyline = new g.Polyline(points).convexHull();
        const convexHullPoints = convexHullPolyline.points;
        // Make sure the first and the last point are the same.
        convexHullPoints.push(convexHullPoints[0]);
        // Find the boundary points that are does not contain diagonal segments.
        const boundaryPoints = [];
        convexHullPoints.forEach((p, i) => {
            if (i === 0) {
                boundaryPoints.push(p);
            } else {
                const prev = boundaryPoints[boundaryPoints.length - 1];
                if (prev.x !== p.x && prev.y !== p.y) {
                    // Make sure that there are no diagonal lines in the boundary.
                    if (prev.x < p.x && prev.y < p.y || prev.x > p.x && prev.y > p.y) {
                        boundaryPoints.push({ x: prev.x, y: p.y });
                    } else {
                        boundaryPoints.push({ x: p.x, y: prev.y });
                    }
                }
                if (i !== convexHullPoints.length - 1) {
                    boundaryPoints.push(p);
                }
            }
        });
        // Create and return SVG boundary elements.
        const vBoundary = V('path').attr({
            'fill': colors[3],
            'stroke': colors[2],
            'stroke-width': 2,
            'd': createBoundaryPathData(boundaryPoints, padding)
        });
        const vLabel = V('text').attr({
            'font-family': 'sans-serif',
            'font-size': 20,
            'font-weight': 'bold',
            'fill': colors[5],
            'text-anchor': 'middle',
            'x': labelPosition.x,
            'y': labelPosition.y,
        });
        vLabel.text(`${firstElement.get('year')}`);
        return [vBoundary.node, vLabel.node];
    }
}

function layout() {
    const x0 = 150;
    const y0 = 20;
    const yMax = serpentineLayout(graph, events, {
        gap: 60,
        rowHeight: 200,
        x: x0,
        y: y0,
        width: window.innerWidth - 2 * x0,
        alignRowLastElement: true
    });
    // render the boundaries under the elements
    createBoundaries(events);
    // resize the paper to fit the content
    // enable the horizontal scrollbar if the content is wider than the paper
    // Add 130 to make space for JointJS log
    paper.setDimensions('100%', yMax + 2 * y0 + 130);
}

// layout the graph initially and on window resize
layout();
window.addEventListener('resize', util.debounce(layout, 100));

