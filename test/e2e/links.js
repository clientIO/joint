/*
 * e2e test for LINKS demo: http://jointjs.com/demos/links
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('Links demo', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/links/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#paper .joint-link')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    describe('Link', function() {

        it('should be removable', function(done) {

            client.url(url)
                .click('#j_1 .tool-remove')
                .waitForNotExist('#j_1')
                .then(function(exists) {
                    expect(exists).to.equal(true);
                    done();
                });

        });

        it('should be changeable', function(done) {

            client.url(url)
                .getAttribute('#paper #j_1 path.connection', 'd')
                .then(function(orig_connection_data) {

                    this
                        .moveToObject('#paper #j_1', 100/* x-offset */, 10/* y-offset */)
                        .buttonDown()
                        .moveToObject('#paper svg', 100 /* x-offset */, 100 /* y-offset */)
                        .buttonUp()
                        .getAttribute('#paper #j_1 path.connection', 'd')
                        .then(function(new_connection_data) {
                            expect(new_connection_data).not.to.equal(orig_connection_data);
                            done();
                        });

                });
        });

        it('should be stretchable', function(done) {

            client.url(url)
                .getAttribute('#paper #j_1 path.connection', 'd')
                .then(function(orig_connection_data) {

                    this
                        .moveToObject('#paper #j_1 .marker-arrowhead-group-target', 10/* x-offset */, 10/* y-offset */)
                        .buttonDown()
                        .moveToObject('#paper svg', 500 /* x-offset */, 100 /* y-offset */)
                        .buttonUp()
                        .getAttribute('#paper #j_1 path.connection', 'd')
                        .then(function(new_connection_data) {
                            expect(new_connection_data).not.to.equal(orig_connection_data);
                            done();
                        });

                });
        });

    });

});
