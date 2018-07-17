/*
 * e2e test for LOGIC CIRCUITS demo: http://jointjs.com/demos/joint-type-logic
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('Logic Circuits', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/logic/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#paper .joint-type-logic.joint-type-logic-repeater')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    describe('Element', function() {

        it('should be movable', function(done) {

            client.url(url)
                .moveElement('#paper .joint-type-logic.joint-type-logic-input')
                .then(function(transform) {
                    expect(transform).to.equal('translate(10,5)');
                    done();
                });

        });

    });

    describe('Link', function() {

        it('should be visible', function(done) {

            client.url(url)
                .waitForExist('#paper .joint-type-logic.joint-link path.connection')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

        it('should be removable', function(done) {

            client.url(url)
                .click('#j_11 .tool-remove')
                .waitForNotExist('#j_11')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

    });

});
