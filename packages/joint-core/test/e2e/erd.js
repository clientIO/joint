/*
 * e2e test for ER DIAGRAMS demo: http://jointjs.com/demos/erd
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('ER Diagrams', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/erd/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#paper .joint-type-erd.joint-type-erd-identifyingrelationship')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    describe('Entity', function() {

        it('should be movable', function(done) {

            client.url(url)
                .moveElement('#paper .joint-type-erd.joint-type-erd-entity')
                .then(function(transform) {
                    expect(transform[0]).to.equal('translate(20,10)');
                    done();
                });

        });

    });

    describe('Link', function() {

        it('should be visible', function(done) {

            client.url(url)
                .waitForExist('#paper .joint-link path.connection')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

        it('should be removable', function(done) {

            client.url(url)
                .click('#j_14 .tool-remove')
                .waitForNotExist('#j_14')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

    });

});
