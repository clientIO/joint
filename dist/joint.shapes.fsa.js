/*! JointJS v3.3.1 (2021-02-06) - JavaScript diagramming library


This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
this.joint = this.joint || {};
this.joint.shapes = this.joint.shapes || {};
(function (exports, basic_mjs, Element_mjs, Link_mjs) {
    'use strict';

    var State = basic_mjs.Circle.define('fsa.State', {
        attrs: {
            circle: { 'stroke-width': 3 },
            text: { 'font-weight': '800' }
        }
    });

    var StartState = Element_mjs.Element.define('fsa.StartState', {
        size: { width: 20, height: 20 },
        attrs: {
            circle: {
                transform: 'translate(10, 10)',
                r: 10,
                fill: '#000000'
            }
        }
    }, {
        markup: '<g class="rotatable"><g class="scalable"><circle/></g></g>',
    });

    var EndState = Element_mjs.Element.define('fsa.EndState', {
        size: { width: 20, height: 20 },
        attrs: {
            '.outer': {
                transform: 'translate(10, 10)',
                r: 10,
                fill: '#ffffff',
                stroke: '#000000'
            },

            '.inner': {
                transform: 'translate(10, 10)',
                r: 6,
                fill: '#000000'
            }
        }
    }, {
        markup: '<g class="rotatable"><g class="scalable"><circle class="outer"/><circle class="inner"/></g></g>',
    });

    var Arrow = Link_mjs.Link.define('fsa.Arrow', {
        attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }},
        smooth: true
    });

    exports.Arrow = Arrow;
    exports.EndState = EndState;
    exports.StartState = StartState;
    exports.State = State;

}(this.joint.shapes.fsa = this.joint.shapes.fsa || {}, joint.shapes.basic, joint.dia, joint.dia));
