const Place = joint.dia.Element.define('pn.Place', {
    size: { width: 50, height: 50 },
    attrs: {
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

const PlaceView = joint.dia.ElementView.extend({

    presentationAttributes: joint.dia.ElementView.addPresentationAttributes({
        tokens: ['TOKENS']
    }),

    initFlag: joint.dia.ElementView.prototype.initFlag.concat(['TOKENS']),

    confirmUpdate: function(...args) {
        let flags = joint.dia.ElementView.prototype.confirmUpdate.call(this, ...args);
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

        var tokens = this.model.get('tokens');
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

const Transition = joint.dia.Element.define('pn.Transition', {
    size: { width: 12, height: 50 },
    attrs: {
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

const Link = joint.dia.Link.define('pn.Link', {
    attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }}
}, {
    useCSSSelectors: true
});

const shapes = { ...joint.shapes, pn: { Place, PlaceView, Transition, Link }};

var graph = new joint.dia.Graph({}, { cellNamespace: shapes });
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 800,
    height: 350,
    gridSize: 10,
    cellViewNamespace: shapes,
    linkView: joint.dia.LegacyLinkView,
    defaultAnchor: { name: 'perpendicular' },
    model: graph
});

var pn = joint.shapes.pn;

var pReady = new pn.Place({
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

var pIdle = pReady.clone()
    .attr('.label/text', 'idle')
    .position(140, 260)
    .set('tokens', 2);

var buffer = pReady.clone()
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

var cAccepted = pReady.clone()
    .attr('.label/text', 'accepted')
    .position(550, 50)
    .set('tokens', 1);

var cReady = pReady.clone()
    .attr('.label/text', 'accepted')
    .position(560, 260)
    .set('ready', 3);

var pProduce = new pn.Transition({
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

var pSend = pProduce.clone()
    .attr('.label/text', 'send')
    .position(270, 160);

var cAccept = pProduce.clone()
    .attr('.label/text', 'accept')
    .position(470, 160);

var cConsume = pProduce.clone()
    .attr('.label/text', 'consume')
    .position(680, 160);


function link(a, b) {

    return new pn.Link({
        source: { id: a.id, selector: '.root' },
        target: { id: b.id, selector: '.root' },
        attrs: {
            '.connection': {
                'fill': 'none',
                'stroke-linejoin': 'round',
                'stroke-width': '2',
                'stroke': '#4b4a67'
            }
        }
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

    var inbound = graph.getConnectedLinks(t, { inbound: true });
    var outbound = graph.getConnectedLinks(t, { outbound: true });

    var placesBefore = inbound.map(function(link) {
        return link.getSourceElement();
    });
    var placesAfter = outbound.map(function(link) {
        return link.getTargetElement();
    });

    var isFirable = true;
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

            var links = inbound.filter(function(l) {
                return l.getSourceElement() === p;
            });

            links.forEach(function(l) {
                var token = V('circle', { r: 5, fill: '#feb662' });
                l.findView(paper).sendToken(token, sec * 1000);
            });
        });

        placesAfter.forEach(function(p) {

            var links = outbound.filter(function(l) {
                return l.getTargetElement() === p;
            });

            links.forEach(function(l) {
                var token = V('circle', { r: 5, fill: '#feb662' });
                l.findView(paper).sendToken(token, sec * 1000, function() {
                    p.set('tokens', p.get('tokens') + 1);
                });
            });
        });
    }
}

function simulate() {

    var transitions = [pProduce, pSend, cAccept, cConsume];
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

var simulationId = simulate();

function stopSimulation(simulationId) {
    clearInterval(simulationId);
}
