/*
 * e2e test for UNIFIED MODELING LANGUAGE demo: http://jointjs.com/demos/umlcd
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('Unified Modeling Language - The Class Diagram', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/umlcd/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#paper .joint-type-uml.joint-type-uml-interface')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    describe('Element', function() {

        it('should be movable', function(done) {

            client.url(url)
                .moveElement('#paper .joint-type-uml.joint-type-uml-class')
                .then(function(transform) {
                    expect(transform[0]).to.equal('translate(20,10)');
                    done();
                });

        });

    });

    describe('Link', function() {

        it('should be visible', function(done) {

            client.url(url)
                .waitForExist('#paper .joint-type-uml.joint-type-uml-implementation.joint-link path.connection')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

        it('should be removable', function(done) {

            client.url(url)
                .click('#paper .joint-type-uml.joint-type-uml-implementation.joint-link .tool-remove')
                .waitForNotExist('#paper .joint-type-uml.joint-type-uml-implementation.joint-link')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

    });

});
