'use strict';

require('should');

// Test against the latest JointJS build file.
var joint = require('../../build/joint');

describe('Sanity check', function() {

    describe('require', function() {

        it('should return an object', function() {
            (typeof joint).should.equal('object');
            Object.keys(joint).length.should.be.greaterThan(0);
        });

        it('should contain Graph constructor', function() {
            should.exist(joint);
            should.exist(joint.dia, 'joint.dia is undefined');
            should.exist(joint.dia.Graph, 'joint.dia.Graph is undefined');
            (typeof joint.dia.Graph).should.equal('function');
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
