joint.shapes.org = {};

joint.shapes.org.Member = joint.dia.Element.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect class="shadow"/><rect class="card"/><image/><text class="rank"/><text class="name"/></g></g>',

    defaults: joint.util.deepSupplement({

        type: 'org.Member',
        size: { width: 180, height: 70 },
        attrs: {

            '.': { 'pointer-events': 'none' },

            rect: { width: 170, height: 60, rx: 10, ry: 10 },

            '.card': {
                fill: 'white', stroke: 'black', 'stroke-width': 2,
                'pointer-events': 'visiblePainted',
                magnet: true
            },

            '.shadow': {
                opacity: 0.2,
                ref: '.card', 'ref-x': 7, 'ref-y': 7
            },

            image: {
		width: 48, height: 48,
                ref: '.card', 'ref-x': 10, 'ref-y': 5
            },

            text: {
                'font-family': 'Courier New', 'font-size': '.8em'
            },

            '.rank': {
                'text-decoration': 'underline',
                ref: '.card', 'ref-x': 0.38, 'ref-y': 0.2
            },

            '.name': {
                'font-weight': 'bold',
                ref: '.card', 'ref-x': 0.38, 'ref-y': 0.6
            }
        }
    }, joint.dia.Element.prototype.defaults)
});

joint.shapes.org.Arrow = joint.dia.Link.extend({

    defaults: {
        type: 'org.Arrow',
        source: { selector: '.card' }, target: { selector: '.card' },
        attrs: { '.connection': { stroke: '#585858', 'stroke-width': 3 }},
        z: -1
    }
});
