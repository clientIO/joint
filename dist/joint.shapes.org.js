/*! JointJS v2.0.0 (2017-10-23) - JavaScript diagramming library


This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
joint.dia.Element.define('org.Member', {
    size: { width: 180, height: 70 },
    attrs: {
        rect: { width: 170, height: 60 },

        '.card': {
            fill: '#FFFFFF', stroke: '#000000', 'stroke-width': 2,
            'pointer-events': 'visiblePainted', rx: 10, ry: 10
        },

        image: {
            width: 48, height: 48,
            ref: '.card', 'ref-x': 10, 'ref-y': 5
        },

        '.rank': {
            'text-decoration': 'underline',
            ref: '.card', 'ref-x': 0.9, 'ref-y': 0.2,
            'font-family': 'Courier New', 'font-size': 14,
            'text-anchor': 'end'
        },

        '.name': {
            'font-weight': '800',
            ref: '.card', 'ref-x': 0.9, 'ref-y': 0.6,
            'font-family': 'Courier New', 'font-size': 14,
            'text-anchor': 'end'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><rect class="card"/><image/></g><text class="rank"/><text class="name"/></g>',
});

joint.dia.Link.define('org.Arrow', {
    source: { selector: '.card' }, target: { selector: '.card' },
    attrs: { '.connection': { stroke: '#585858', 'stroke-width': 3 } },
    z: -1
});
