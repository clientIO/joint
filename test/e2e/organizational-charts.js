/*
 * e2e test for ORGANIZATIONAL CHARTS demo: http://jointjs.com/demos/org
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('Organizational Charts', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/org/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#paper .joint-type-org-member')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    describe('Member', function() {

        it('should be movable', function(done) {

            client.url(url)
                .moveElement('#paper .joint-type-org-member')
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
                .click('#j_12 .tool-remove')
                .waitForNotExist('#j_12')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

    });

});
