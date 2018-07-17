/*
 * e2e test for SMART ROUTING demo: http://jointjs.com/demos/routing
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('Smart Routing', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/routing/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#paper .joint-type-basic-rect')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    describe('Element', function() {

        it('should be movable', function(done) {

            client.url(url)
                .moveElement('#paper .joint-type-basic-rect')
                .then(function(transform) {
                    expect(transform[0]).to.equal('translate(20,10)');
                    done();
                });

        });

    });

    describe('Route', function() {

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
                .click('#paper .joint-link .tool-remove')
                .waitForNotExist('#paper .joint-link')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

        it('should be smart', function(done) {

            client.url(url)
                .getAttribute('#paper .joint-link path.connection', 'd')
                .then(function(orig_path) {
                    this
                        .moveElement('#paper #j_1', 250, 100)
                        .getAttribute('#paper .joint-link path.connection', 'd')
                        .then(function(new_path) {
                            expect(new_path).not.to.equal(orig_path);
                            done();
                        });

                });

        });

    });

    describe('Button', function() {

        it('Normal/none should be clickable', function(done) {

            client.url(url)
                .getAttribute('#paper .joint-link path.connection', 'd')
                .then(function(orig_path) {
                    this
                        .click('button[data-connector="normal"]')
                        .getAttribute('#paper .joint-link path.connection', 'd')
                        .then(function(new_path) {
                            expect(new_path).not.to.equal(orig_path);
                            done();
                        });

                });

        });

        it('Normal/orthogonal should be clickable', function(done) {

            client.url(url)
                .getAttribute('#paper .joint-link path.connection', 'd')
                .then(function(orig_path) {
                    this
                        .click('button[data-router="orthogonal"]')
                        .getAttribute('#paper .joint-link path.connection', 'd')
                        .then(function(new_path) {
                            expect(new_path).not.to.equal(orig_path);
                            done();
                        });

                });

        });

    });
});
