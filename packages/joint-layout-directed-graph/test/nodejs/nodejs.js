'use strict';

require('should');
const joint = require('@joint/core');
const m = require('../../dist/DirectedGraph');

describe('require jointjs', function() {

    it('should return an object', function() {

        joint.should.have.type('object');
        joint.should.not.be.empty;
    });

    it('should contain Graph constructor', function() {

        joint.should.have.property('dia');
        joint.dia.should.have.property('Graph');
        joint.dia.Graph.should.have.type('function');
    });

    it('should not contain layout.DirectedGraph object', function() {

        joint.should.have.property('layout');
        joint.layout.should.not.have.property('DirectedGraph');
    });
});

describe('require dist/DirectedGraph.js', function() {

    it('should return an object', function() {

        m.should.have.type('object');
        m.should.not.be.empty;
    });

    it('should contain DirectedGraph', function() {

        m.should.have.property('DirectedGraph');
        m.DirectedGraph.should.have.type('object');
        m.DirectedGraph.should.not.be.empty;
    });

    it('should contain layout() function', function() {

        m.DirectedGraph.should.have.property('layout');
        m.DirectedGraph.layout.should.have.type('function');
    });

    it('should contain toGraphLib() function', function() {

        m.DirectedGraph.should.have.property('toGraphLib');
        m.DirectedGraph.toGraphLib.should.have.type('function');
    });

    it('should contain fromGraphLib() function', function() {

        m.DirectedGraph.should.have.property('fromGraphLib');
        m.DirectedGraph.fromGraphLib.should.have.type('function');
    });
});
