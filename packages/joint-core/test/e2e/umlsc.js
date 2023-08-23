/*
 * e2e test for UNIFIED MODELING LANGUAGE demo: http://jointjs.com/demos/umlsc
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('Unified Modeling Language - The Statechart Diagram', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/umlsc/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#paper .joint-type-uml.joint-type-uml-endstate')
            .then(function(exists) {
                expect(exists).to.equal(true);
            })
            .waitForExist('#paper .joint-type-uml.joint-type-uml-startstate')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    describe('State', function() {

        it('should be movable', function(done) {

            client.url(url)
                .moveElement('#paper .joint-type-uml.joint-type-uml-state')
                .then(function(transform) {
                    expect(transform[0]).to.equal('translate(20,10)');
                    done();
                });

        });

    });

    describe('Link', function() {

        it('should be visible', function(done) {

            client.url(url)
                .waitForExist('#paper .joint-type-uml.joint-type-uml-transition.joint-link path.connection')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

        it('should be removable', function(done) {

            client.url(url)
                .click('#j_9 .tool-remove')
                .waitForNotExist('#j_9')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

    });

});
