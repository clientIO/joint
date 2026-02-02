import { dia, shapes, util } from '@joint/core';
import './styles.css';

const BG_COLOR = '#f4f7f6';
const FG_COLOR = '#131e29';

const graph = new dia.Graph();
const paper = new dia.Paper({
    width: '100%',
    height: '100%',
    frozen: true,
    model: graph,
    interactive: false,
    background: { color: BG_COLOR },
    sorting: dia.Paper.sorting.NONE
});

document.getElementById('paper-container').appendChild(paper.el);

// The `stroke` of the marker is in JointJS inherited from the link by default.
const markers = [
    // Marker #1
    {
        markup: util.svg`
            <path d="M 0 0 L 12 -4 L 5 0 L 12 4 z"
                  fill="${FG_COLOR}"
                  stroke-width="2"
            />
        `
    },
    // Marker #2
    {
        markup: util.svg`
            <path d="M 0 0 L 12 -4 L 5 0 L 12 4 z"
                  fill="${FG_COLOR}"
                  stroke-width="2" stroke-linejoin="round"
            />
        `
    },
    // Marker #3
    {
        markup: util.svg`
            <path d="M 0 0 L 8 -4 L 8 4 z"
                  stroke-width="2"
                  fill="${FG_COLOR}"
            />
        `
    },
    // Marker #4
    {
        markup: util.svg`
            <path d="M -2 0 L 15 -4 V 4 z"
                  stroke-width="1"
                  fill="${FG_COLOR}"
             />
        `
    },
    // Marker #5
    {
        markup: util.svg`
            <path d="M 0 0 L 12 -4 L 5 0 L 12 4 z"
                  stroke-width="2" fill="${FG_COLOR}"
            />
        `
    },
    // Marker #6
    {
        markup: util.svg`
            <path d="M 10 3 L 0 0 L 10 -3"
                  fill="none" stroke-width="2"
            />
        `
    },
    // Marker #7
    {
        markup: util.svg`
            <path d="M 10 3 L 0 0 L 10 -3"
                  fill="none"
                  stroke-width="2"
                  stroke-linejoin="round" stroke-linecap="round"
            />
        `
    },
    // Marker #8
    {
        markup: util.svg`
            <path d="M 0 0 L 8 -4 L 8 4 z"
                  stroke-width="2" fill="${FG_COLOR}"
            />
        `
    },
    // Marker #9
    {
        markup: util.svg`
            <path d="M -3 0 L 10 -3 V 3 z"
                  stroke-width="2" fill="${FG_COLOR}"
            />
        `
    },
    // Marker #10
    {
        markup: util.svg`
            <path d="M 0 0 L 12 -4 C 8 0 8 0 12 4 z"
                  stroke-width="2" fill="${FG_COLOR}"
            />
        `
    },
    // Marker #11
    {
        markup: util.svg`
            <path d="M 0 0 L 15 -5 C 4 0 4 0 15 5 z"
                  stroke-width="2" fill="${BG_COLOR}"
            />
        `
    },
    // Marker #12
    {
        markup: util.svg`
            <path d="M 0 0 L 12 -5 C 10 0 10 0 12 5 z"
                  stroke-width="2" fill="${FG_COLOR}"
            />
        `
    },
    // Marker #13
    {
        markup: util.svg`
            <path d="M -5 -10 C 0 -5 0 5 -5 10 L 10 0 z"
                  stroke-width="0" fill="${FG_COLOR}"
             />
        `
    },
    // Marker #14
    {
        markup: util.svg`
            <path d="M 0 0 L 12 -8 C 8 0 8 0 12 8 z"
                  stroke-width="2" fill="${FG_COLOR}"
            />
        `
    },
    // Marker #15
    {
        markup: util.svg`
            <path d="M 0 0 L 10 4"
                  stroke-width="2" stroke-linecap="round"
            />
        `
    },
    // Marker #16
    {
        markup: util.svg`
            <path d="M 0 0 L 8 -5 V 0 z"
                  fill="${FG_COLOR}" stroke-width="2"
            />
        `
    },
    // Marker #17
    {
        markup: util.svg`
            <path d="M 0 0 L 8 -5 V 0 z"
                  fill="${FG_COLOR}"
                  stroke-width="2" stroke-linejoin="round"
            />
        `
    },
    // Marker #18
    {
        markup: util.svg`
            <path d="M 0 0 L 5 -5 L 10 0 L 5 5 z"
                  stroke-width="2" fill="${FG_COLOR}"
            />
        `
    },
    // Marker #19
    {
        markup: util.svg`
            <path d="M 0 0 L 5 -5 L 10 0 L 5 5 z"
                  fill="${FG_COLOR}"
                  stroke-width="2" stroke-linejoin="round"
            />
        `
    },
    // Marker #20
    {
        markup: util.svg`
            <path d="M 0 0 L 5 -5 L 10 0 L 5 5 z"
                  fill="${FG_COLOR}"
                  stroke-width="2" stroke-linejoin="bevel"
            />
        `
    },
    // Marker #21
    {
        markup: util.svg`
            <path d="M 0 0 L 6 -3 L 12 0 L 6 3 z"
                  stroke-width="2" fill="${FG_COLOR}"
            />
        `
    },
    // Marker #22
    {
        markup: util.svg`
            <path d="M 0 0 L 6 -3 L 12 0 L 6 3 z"
                  fill="${FG_COLOR}"
                  stroke-width="2" stroke-linejoin="round"
            />
        `
    },
    // Marker #23
    {
        markup: util.svg`
            <circle r="4" fill="${FG_COLOR}" stroke-width="2" />
        `
    },
    // Marker #24
    {
        markup: util.svg`
            <path d="M 0 -5 V 5" stroke-width="2" fill="${FG_COLOR}" />
        `
    },
    // Marker #25
    {
        markup: util.svg`
            <path d="M 5 -5 V 5" stroke-width="2" fill="none" />
        `
    },
    // Marker #26
    {
        markup: util.svg`
            <path d="M 5 -5 V 5 M 10 -5 V 5" stroke-width="2" fill="${FG_COLOR}" />
        `
    },
    // Marker #27
    {
        markup: util.svg`
            <path d="M 0 -4 L 10 0 M 0 4 L 10 0" stroke-width="2" />
        `
    },
    // Marker #28
    {
        markup: util.svg`
            <path d="M 0 -4 h 10 v 4 M 0 4 h 10 v -4"
                  stroke-width="2" fill="none"
            />
        `
    },
    // Marker #29
    {
        markup: util.svg`
            <path d="M 0 -4 h 10 v 4 M 0 4 h 10 v -4 M 10 0 0 0"
                  stroke-width="2" fill="none"
                  stroke-linecap="round" stroke-linejoin="round"
            />
        `
    },
    // Marker #30
    {
        markup: util.svg`
            <path d="M 5 -5 V 5" stroke-width="2" fill="none" />
            <circle cx="14" r="4" stroke-width="2" fill="${BG_COLOR}" />
        `
    },
    // Marker #31
    {
        markup: util.svg`
            <path d="M 0 -4 L 10 0 M 0 4 L 10 0 M 10 -5 V 5"
                  stroke-width="2"
            />
        `
    },
    // Marker #32
    {
        markup: util.svg`
            <path d="M 3 -5 L 12 5" stroke-width="2" />
        `
    },
    // Marker #33
    {
        markup: util.svg`
            <path d="M 3 -5 L 12 5 M 3 5 L 12 -5"
                  stroke-width="2"
            />
        `
    },
    // Marker #34
    {
        markup: util.svg`
            <path d="M 0 0 L 8 -5 V 0 z"
                  stroke-width="2" fill="${BG_COLOR}"
            />
        `
    },
    // Marker #35
    {
        markup: util.svg`
            <circle r="3"
                    fill="${BG_COLOR}"
                    stroke-width="2"
             />
        `
    },
    // Marker #36
    {
        markup: util.svg`
            <path d="M 0 0 L 5 -5 L 10 0 L 5 5 z"
                  stroke-width="2" fill="${BG_COLOR}"
            />
        `
    },
    // Marker #37
    {
        markup: util.svg`
            <path d="M 0 0 L 6 -3 L 12 0 L 6 3 z"
                  stroke-width="2" fill="${BG_COLOR}"
            />
        `
    },
    // Marker #38
    {
        markup: util.svg`
            <circle r="8" cx="4"
                    fill="${BG_COLOR}"
                    stroke-width="2"
            />
            <path d="M -4 0 H 12 M 4 -8 V 8"
                  fill="none"
                  stroke-width="2"
            />
        `
    },

    // Marker #39
    {
        markup: util.svg`
            <circle r="8" cx="-4"
                    fill="${BG_COLOR}"
                    stroke-width="2"
            />
        `
    },
    // Marker #40
    {
        markup: util.svg`
            <rect x="-5" y="-5" width="10" height="10"
                  fill="${BG_COLOR}"
                  stroke-width="2"
            />
        `
    },
    // Marker #41
    {
        markup: util.svg`
            <rect x="5" y="-5" width="10" height="10"
                  fill="none"
                  stroke-width="2"
            />
        `
    },

    // Marker #42
    {
        markup: util.svg`
            <path d="M -10 -10 C 3 -10 3 10 -10 10"
                  stroke-width="2" fill="none"
             />
        `
    },
    // Marker #43
    {
        markup: util.svg`
            <path d="M 0 -4 L 10 0 M 0 4 L 10 0 M 0 0 H 10"
                  stroke-width="2" fill="none"
            />
            <circle cx="14" r="3" fill="${BG_COLOR}"
                  stroke-width="2"
            />
        `
    },
    // Marker #44
    {
        markup: util.svg`
            <path d="M 10 0 L 0 0"
                  stroke="${BG_COLOR}" stroke-width="3"
            />
            <path d="M 0 0 L 8 -4 V 4 z"
                  stroke-width="2" fill="${BG_COLOR}"
            />
            <path d="M 10 0 L 18 -4 V 4 z"
                  stroke-width="2" fill="${BG_COLOR}"
            />
        `
    },
    // Marker #45
    {
        markup: util.svg`
            <polyline points="-2,0 8,-5 8,-2 17,-5 17,5 8,2 8,5 -2,0"
                  fill="${FG_COLOR}" stroke="none"
            />
        `
    },
    // Marker #46
    {
        markup: util.svg`
            <rect x="-25" width="50" height="25" rx="2" ry="2"
                transform="rotate(-90)"
                fill="${BG_COLOR}" stroke-width="2"
            />
            <image x="-25" width="50" height="25"
                transform="rotate(-90)"
                href="https://assets.codepen.io/7589991/jj-logo-black.svg"
            />
        `
    },
    // Marker #47
    {
        markup: util.svg`
            <rect x="-25" width="50" height="25" rx="2" ry="2"
                transform="rotate(-90)"
                fill="${BG_COLOR}" stroke="#0075f2" stroke-width="2"
            />
            <image x="-25" width="50" height="25"
                transform="rotate(-90)"
                href="https://assets.codepen.io/7589991/jj-logo-red.svg"
            />
        `
    },
    // Marker #48
    {
        markup: util.svg`
            <path d="M -4 0 H 12 M 4 -8 V 8"
                  stroke="#ed2637" stroke-width="2" fill="none"
            />
            <circle r="8" cx="4" fill="none"
                  stroke="#0075f2" stroke-width="2"
            />
        `
    },
    // Marker #49
    {
        markup: util.svg`
            <path d="M 0 -4 L 10 0 M 0 4 L 10 0 M 0 0 H 10"
                  stroke="#0075f2" stroke-width="2" fill="none"
            />
            <circle cx="14" r="3" fill="${BG_COLOR}"
                  stroke="#ed2637" stroke-width="2"
            />
        `
    },
    // Marker #50
    {
        markup: util.svg`
            <path d="M 10 0 L 0 0" stroke="${BG_COLOR}" stroke-width="3" />
            <path d="M -2 0 L 8 -6 V 6 z" stroke="none" fill="#ed2637" />
            <path d="M 8 0 L 18 -6 V 6 z" stroke="none" fill="#0075f2" />
        `
    }
];

const MARGIN = 30;
const LINKS_PER_LINE = 10;
const LINK_BBOX_WIDTH = 40;
const LINK_BBOX_HEIGHT = 100;

markers.forEach((marker, index) => {
    const row = Math.floor(index / LINKS_PER_LINE);
    const column = index % LINKS_PER_LINE;

    // source coordinates
    const sX = column * (MARGIN + LINK_BBOX_WIDTH);
    const sY = row * (MARGIN + LINK_BBOX_HEIGHT);
    const number = index + 1;
    const link = new shapes.standard.Link({
        source: {
            x: sX,
            y: sY
        },
        target: {
            x: sX + LINK_BBOX_WIDTH,
            y: sY + LINK_BBOX_HEIGHT
        },
        number,
        attrs: {
            root: {
                // Add tooltip with marker number to make it easier to find in the code
                title: `Marker #${number}`
            },
            line: {
                stroke: FG_COLOR,
                strokeWidth: 2,
                sourceMarker: marker,
                targetMarker: marker
            },
            wrapper: {
                strokeWidth: 15
            }
        }
    });
    link.addTo(graph);
});

// Add a hint to the graph to instruct the user to click on a link to zoom in

const hint = new shapes.standard.Rectangle({
    position: {
        x: -30,
        y: 0
    },
    size: {
        width: 630,
        height: 30
    },
    attrs: {
        root: {
            pointerEvents: 'none'
        },
        body: {
            fill: {
                type: 'pattern',
                markup: util.svg`
                    <text x="10" y="20"
                          fill="#ed2637"
                          font-size="12"
                          font-family="sans-serif"
                    >click on a link to zoom in</text>
                    <path d="M 155 5 v 20" stroke="#0075f2" stroke-width="2"/>
                `,
                attrs: {
                    width: 160,
                    height: 30
                }
            },
            stroke: '#0075f2',
            rx: 2,
            ry: 2
        }
    }
});

hint.rotate(90, true, hint.position());
hint.addTo(graph);

paper.unfreeze();

// Fit the graph into the viewport

const transformToFitContent = () =>
    paper.transformToFitContent({
        padding: 50,
        verticalAlign: 'middle',
        horizontalAlign: 'middle'
    });

window.addEventListener('resize', () => transformToFitContent());
transformToFitContent();

// Zooming

// Custom highlighter that shows a text next to the link
const TextHighlighter = dia.HighlighterView.extend({
    tagName: 'text',
    attributes: {
        fill: '#ed2637',
        'pointer-events': 'none',
        'text-anchor': 'middle',
        'font-size': 8,
        'font-family': 'sans-serif',
        opacity: 0
    },
    style: {
        transition: 'opacity 0.3s 0.6s ease'
    },
    highlight(linkView) {
        const { text = '', ratio = 0.5, dx = 0, dy = 0 } = this.options;
        const point = linkView.getPointAtRatio(ratio);
        this.vel.text(text || '', { textVerticalAnchor: 'middle' });
        this.vel.attr('transform', `translate(${point.x + dx} ${point.y + dy})`);
        // for the animation to work we need to set the opacity
        // in the next animatin frame
        util.nextFrame(() => this.vel.attr('opacity', 1));
    }
});

let currentLink = null;

paper.on({
    'link:pointerdown': (linkView, evt) => {
        const { model: link } = linkView;
        const bbox = link.getBBox();
        if (currentLink === link) {
            // Zoom into the link's single arrow
            bbox.x -= LINK_BBOX_WIDTH / 2;
            bbox.y -= 15;
            bbox.height = LINK_BBOX_HEIGHT / 2;
            paper.transformToFitContent({
                contentArea: bbox,
                horizontalAlign: 'middle',
                verticalAlign: 'middle'
            });
        } else {
            // Zoom into the link
            currentLink = link;
            bbox.inflate(20);
            paper.transformToFitContent({
                contentArea: bbox,
                horizontalAlign: 'middle',
                verticalAlign: 'middle'
            });
            TextHighlighter.removeAll(paper, 'number');
            TextHighlighter.add(linkView, 'root', 'number', {
                layer: dia.Paper.Layers.FRONT,
                text: `#${link.get('number')}`,
                ratio: 0,
                dx: -20,
                dy: -10
            });
        }
        paper.el.classList.add('marker-details');
    },
    'blank:pointerdown': (evt) => {
        // Zoom back to all the links
        currentLink = null;
        transformToFitContent();
        TextHighlighter.removeAll(paper, 'number');
        paper.el.classList.remove('marker-details');
    }
});

// Enable animations in Chrome
paper.layers.style.transition = 'transform 250ms';
