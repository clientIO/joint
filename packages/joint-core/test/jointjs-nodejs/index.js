'use strict';

require('should');
const { expect } = require('chai');

// Test against the latest JointJS build file.
var joint = require('../../build/joint');

describe('Sanity check', function() {

    describe('require', function() {

        it('should return an object', function() {
            joint.should.have.type('object');
            joint.should.not.be.empty;
        });

        it('should contain Graph constructor', function() {

            joint.should.have.property('dia');
            joint.dia.should.have.property('Graph');
            joint.dia.Graph.should.have.type('function');
        });
    });
});

describe('Graph', function() {

    describe('#addCell()', function() {

        it('should add a cell to the graph cells collection', function() {

            var g = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            var c = new joint.shapes.standard.Rectangle({ attrs: { label: { fill: 'yellow' }}});
            g.addCell(c);
            g.get('cells').length.should.be.exactly(1);
            g.get('cells').at(0).should.be.an.instanceOf(joint.shapes.standard.Rectangle);
        });
    });

    describe('events', function() {

        it('should trigger add event when new cell has been added', function() {

            var g = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            var c = new joint.shapes.standard.Rectangle({ attrs: { label: { fill: 'yellow' }}});
            var called = false;
            g.on('add', function() { called = true; });
            g.addCell(c);
            called.should.be.true;
        });
    });
});

describe('util.setByPath()', () => {
    it('should not replace the prototype with the last path segment', () => {
        const proto = { polluted: true };
        const obj = { a: {}};
        joint.util.setByPath(obj, 'a/__proto__', proto);
        joint.util.setByPath(obj, '__proto__', proto);
        joint.util.setByPath(obj, ['__proto__'], proto);
        expect(Object.getPrototypeOf(obj.a)).to.equal(Object.prototype);
        expect(Object.getPrototypeOf(obj)).to.equal(Object.prototype);
        expect({}.polluted).to.be.undefined;
    });

    it('should set `constructor` as the last path segment as an own property', () => {
        const obj = {};
        joint.util.setByPath(obj, 'data/constructor', 1);
        expect(obj).to.deep.equal({ data: { constructor: 1 }});
        // the two-step sequence
        joint.util.setByPath(obj, 'constructor', {});
        joint.util.setByPath(obj, 'constructor/prototype/polluted', true);
        expect({}.polluted).to.be.undefined;
        expect(Object.prototype.polluted).to.be.undefined;
    });
});

describe('util.unsetByPath()', () => {
    it('should ignore `__proto__` as the last path segment', () => {
        const obj = { a: 1 };
        joint.util.unsetByPath(obj, '__proto__');
        expect(Object.getPrototypeOf(obj)).to.equal(Object.prototype);
        expect(obj).to.deep.equal({ a: 1 });
    });
});

describe('Graph type resolution', () => {
    [
        'constructor', 'constructor.constructor', 'toString', '__proto__', 'hasOwnProperty',
        'standard.constructor', 'standard.Rectangle.define', 'standard.Rectangle.__super__.addPorts'
    ].forEach((type) => {
        it(`should not resolve cell type "${type}"`, () => {
            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            expect(() => graph.fromJSON({ cells: [{ id: 'a', type }] })).to.throw(/Could not find cell constructor/);
            // The graph remains usable
            graph.fromJSON({ cells: [{ id: 'b', type: 'standard.Rectangle' }] });
            expect(graph.getCells()).to.have.lengthOf(1);
        });
    });

    it('should resolve cell constructors', () => {
        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        graph.fromJSON({ cells: [{ id: 'a', type: 'standard.Rectangle' }] });
        expect(graph.getCell('a')).to.be.an.instanceof(joint.shapes.standard.Rectangle);
        const inheritingGraph = new joint.dia.Graph({}, { cellNamespace: Object.create(joint.shapes) });
        inheritingGraph.fromJSON({ cells: [{ id: 'a', type: 'standard.Rectangle' }] });
        expect(inheritingGraph.getCell('a')).to.be.an.instanceof(joint.shapes.standard.Rectangle);
    });
});
