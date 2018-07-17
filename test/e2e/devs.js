/*
 * e2e test for DISCRETE EVENT SYSTEM SPECIFICATION demo: http://jointjs.com/demos/devs
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('Discrete Event System Specification', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/devs/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#paper .joint-type-devs.joint-type-devs-atomic')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    describe('Coupled', function() {

        it('should be movable', function(done) {

            client.url(url)
                .waitForExist('#paper .joint-type-devs.joint-type-devs-coupled')
                .moveToObject('#paper .joint-type-devs.joint-type-devs-coupled', 50/* x-offset */, 50/* y-offset */)
                .buttonDown()
                .moveToObject('#paper svg', 40 /* x-offset */, 40 /* y-offset */)
                .buttonUp()
                .getAttribute('#paper .joint-type-devs.joint-type-devs-coupled', 'transform')
                .then(function(transform) {
                    expect(transform).to.equal('translate(21,-10)');
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
                .waitForExist('#paper .joint-type-devs.joint-type-devs-coupled')
                .moveToObject('#j_10 .tool-remove', 5/* x-offset */, 5/* y-offset */)
                .click('#j_10 .tool-remove')
                .waitForNotExist('#j_10')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

    });

});
