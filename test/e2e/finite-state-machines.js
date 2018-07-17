/*
 * e2e test for finite state machines demo: http://jointjs.com/demos/fsa
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('Finite State Machines', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/fsa/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#paper .joint-type-fsa-state')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    describe('State', function() {

        it('should be movable', function(done) {

            client.url(url)
                .moveElement('#paper .joint-type-fsa-state')
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

            var model_id;
            client.url(url)
                .getAttribute('#paper .joint-link', 'model-id')
                .then(function(attr) {
                    model_id = attr[0];

                    this
                        .click('#paper g[model-id="' + model_id + '"] .tool-remove')
                        .waitForNotExist('#paper g[model-id="' + model_id + '"]')
                        .then(function(exists) {
                            expect(exists).to.equal(true);
                            done();
                        });

                });

        });

    });

});
