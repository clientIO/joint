/*
 * e2e test for PETRI NETS demo: http://jointjs.com/demos/pn
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('Petri Nets', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/petri nets/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#paper .joint-type-pn.joint-type-pn-transition')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    describe('Element', function() {

        it('should be movable', function(done) {

            client.url(url)
                .moveToObject('#paper .joint-type-pn.joint-type-pn-place', 30/* x-offset */, 30/* y-offset */)
                .buttonDown()
                .moveToObject('#paper svg', 40 /* x-offset */, 30 /* y-offset */)
                .buttonUp()
                .getAttribute('#paper .joint-type-pn.joint-type-pn-place', 'transform')
                .then(function(transform) {
                    expect(transform[0]).to.equal('translate(10,20)');
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
                .click('#j_10 .tool-remove')
                .waitForNotExist('#j_10')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

    });

});
