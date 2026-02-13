import { dia, shapes, V, linkTools } from '@joint/core';
import './styles.css';

const Place = dia.Element.define('pn.Place', {
    size: { width: 50, height: 50 },
    attrs: {
        root: {
            cursor: 'move',
        },
        '.root': {
            r: 25,
            fill: '#ffffff',
            stroke: '#000000',
            transform: 'translate(25, 25)'
        },
        '.label': {
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-y': -20,
            ref: '.root',
            fill: '#000000',
            'font-size': 12
        },
        '.tokens > circle': {
            fill: '#000000',
            r: 5
        },
        '.tokens.one > circle': { transform: 'translate(25, 25)' },

        '.tokens.two > circle:nth-child(1)': { transform: 'translate(19, 25)' },
        '.tokens.two > circle:nth-child(2)': { transform: 'translate(31, 25)' },

        '.tokens.three > circle:nth-child(1)': { transform: 'translate(18, 29)' },
        '.tokens.three > circle:nth-child(2)': { transform: 'translate(25, 19)' },
        '.tokens.three > circle:nth-child(3)': { transform: 'translate(32, 29)' },

        '.tokens.alot > text': {
            transform: 'translate(25, 18)',
            'text-anchor': 'middle',
            fill: '#000000'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><circle class="root"/><g class="tokens" /></g><text class="label"/></g>',
    useCSSSelectors: true,
});

const PlaceView = dia.ElementView.extend({

    presentationAttributes: dia.ElementView.addPresentationAttributes({
        tokens: ['TOKENS']
    }),

    initFlag: dia.ElementView.prototype.initFlag.concat(['TOKENS']),

    confirmUpdate: function(...args) {
        let flags = dia.ElementView.prototype.confirmUpdate.call(this, ...args);
        if (this.hasFlag(flags, 'TOKENS')) {
            this.renderTokens();
            this.update();
            flags = this.removeFlag(flags, 'TOKENS');
        }
        return flags;
    },

    renderTokens: function() {

        const vTokens = this.vel.findOne('.tokens').empty();
        ['one', 'two', 'three', 'alot'].forEach(function(className) {
            vTokens.removeClass(className);
        });

        const tokens = this.model.get('tokens');
        if (!tokens) return;

        switch (tokens) {

            case 1:
                vTokens.addClass('one');
                vTokens.append(V('circle'));
                break;

            case 2:
                vTokens.addClass('two');
                vTokens.append([V('circle'), V('circle')]);
                break;

            case 3:
                vTokens.addClass('three');
                vTokens.append([V('circle'), V('circle'), V('circle')]);
                break;

            default:
                vTokens.addClass('alot');
                vTokens.append(V('text').text(tokens + ''));
                break;
        }
    }
});

const Transition = dia.Element.define('pn.Transition', {
    size: { width: 12, height: 50 },
    attrs: {
        root: {
            cursor: 'move',
        },
        'rect': {
            width: 12,
            height: 50,
            fill: '#000000',
            stroke: '#000000'
        },
        '.label': {
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-y': -20,
            ref: 'rect',
            fill: '#000000',
            'font-size': 12
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><rect class="root"/></g></g><text class="label"/>',
    useCSSSelectors: true,
});

const PnLink = shapes.standard.Link.define('pn.Link', {
    attrs: {
        line: {
            stroke: '#4b4a67',
            strokeWidth: 2,
            strokeLinejoin: 'round'
        }
    }
});

const cellNamespace = { ...shapes, pn: { Place, PlaceView, Transition, Link: PnLink }};

const graph = new dia.Graph({}, { cellNamespace: cellNamespace });
const paper = new dia.Paper({
    el: document.getElementById('paper-container'),
    width: 800,
    height: 350,
    gridSize: 10,
    cellViewNamespace: cellNamespace,
    defaultAnchor: {
        name: 'center',
        args: {
            useModelGeometry: true
        }
    },
    model: graph
});

paper.on({
    'link:mouseenter': function(linkView) {
        const linkToolsView = new dia.ToolsView({
            tools: [
                new linkTools.Vertices(),
                new linkTools.Remove({ distance: -40 }),
                new linkTools.SourceArrowhead(),
                new linkTools.TargetArrowhead(),
            ]
        });
        linkView.addTools(linkToolsView);
    },
    'link:mouseleave': function(linkView) {
        linkView.removeTools();
    },
    'link:connect': function(linkView) {
        linkView.removeTools();
    }
});

const pReady = new Place({
    position: { x: 140, y: 50 },
    attrs: {
        '.label': {
            'text': 'ready',
            'fill': '#7c68fc' },
        '.root': {
            'stroke': '#9586fd',
            'stroke-width': 3
        },
        '.tokens > circle': {
            'fill': '#7a7e9b'
        }
    },
    tokens: 1
});

const pIdle = pReady.clone()
    .attr('.label/text', 'idle')
    .position(140, 260)
    .set('tokens', 2);

const buffer = pReady.clone()
    .position(350, 160)
    .set('tokens', 12)
    .attr({
        '.label': {
            'text': 'buffer'
        },
        '.alot > text': {
            'fill': '#fe854c',
            'font-family': 'Courier New',
            'font-size': 20,
            'font-weight': 'bold',
            'ref-x': 0.5,
            'ref-y': 0.5,
            'y-alignment': -0.5,
            'transform': null
        }
    });

const cAccepted = pReady.clone()
    .attr('.label/text', 'accepted')
    .position(550, 50)
    .set('tokens', 1);

const cReady = pReady.clone()
    .attr('.label/text', 'accepted')
    .position(560, 260)
    .set('ready', 3);

const pProduce = new Transition({
    position: { x: 50, y: 160 },
    attrs: {
        '.label': {
            'text': 'produce',
            'fill': '#fe854f'
        },
        '.root': {
            'fill': '#9586fd',
            'stroke': '#9586fd'
        }
    }
});

const pSend = pProduce.clone()
    .attr('.label/text', 'send')
    .position(270, 160);

const cAccept = pProduce.clone()
    .attr('.label/text', 'accept')
    .position(470, 160);

const cConsume = pProduce.clone()
    .attr('.label/text', 'consume')
    .position(680, 160);


function link(a, b) {

    return new PnLink({
        source: { id: a.id },
        target: { id: b.id }
    });
}

graph.addCell([pReady, pIdle, buffer, cAccepted, cReady, pProduce, pSend, cAccept, cConsume]);

graph.addCell([
    link(pProduce, pReady),
    link(pReady, pSend),
    link(pSend, pIdle),
    link(pIdle, pProduce),
    link(pSend, buffer),
    link(buffer, cAccept),
    link(cAccept, cAccepted),
    link(cAccepted, cConsume),
    link(cConsume, cReady),
    link(cReady, cAccept)
]);


function fireTransition(t, sec) {

    const inbound = graph.getConnectedLinks(t, { inbound: true });
    const outbound = graph.getConnectedLinks(t, { outbound: true });

    const placesBefore = inbound.map(function(link) {
        return link.getSourceElement();
    });
    const placesAfter = outbound.map(function(link) {
        return link.getTargetElement();
    });

    let isFirable = true;
    placesBefore.forEach(function(p) {
        if (p.get('tokens') === 0) {
            isFirable = false;
        }
    });

    if (isFirable) {

        placesBefore.forEach(function(p) {
            // Let the execution finish before adjusting the value of tokens. So that we can loop over all transitions
            // and call fireTransition() on the original number of tokens.
            setTimeout(function() {
                p.set('tokens', p.get('tokens') - 1);
            }, 0);

            const links = inbound.filter(function(l) {
                return l.getSourceElement() === p;
            });

            links.forEach(function(l) {
                const token = V('circle', { r: 5, fill: '#feb662' });
                l.findView(paper).sendToken(token, sec * 1000);
            });
        });

        placesAfter.forEach(function(p) {

            const links = outbound.filter(function(l) {
                return l.getTargetElement() === p;
            });

            links.forEach(function(l) {
                const token = V('circle', { r: 5, fill: '#feb662' });
                l.findView(paper).sendToken(token, sec * 1000, function() {
                    p.set('tokens', p.get('tokens') + 1);
                });
            });
        });
    }
}

function simulate() {

    const transitions = [pProduce, pSend, cAccept, cConsume];
    transitions.forEach(function(t) {
        if (Math.random() < 0.7) {
            fireTransition(t, 1);
        }
    });

    return setInterval(function() {
        transitions.forEach(function(t) {
            if (Math.random() < 0.7) {
                fireTransition(t, 1);
            }
        });
    }, 2000);
}

// eslint-disable-next-line no-unused-vars
const simulationId = simulate();

// eslint-disable-next-line no-unused-vars
function stopSimulation(id) {
    clearInterval(id);
}
