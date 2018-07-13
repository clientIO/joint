/*
 * e2e test for PAPER ATTRIBUTES demo: http://jointjs.com/demos/paper
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('Paper attributes', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/paper/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#paper .joint-type-basic-path')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    describe('Attributes', function() {

        it('origin x should be changable', function(done) {

            client.url(url)
                .changeRange('#ox', 60/* orig range */, 80/* new range */)
                .then(function(data) {
                    expect(data.transform).to.equal('translate(101,0)');
                    done();
                });

        });

        it('origin y should be changable', function(done) {

            client.url(url)
                .changeRange('#oy', 60/* orig range */, 80/* new range */)
                .then(function(data) {
                    expect(data.transform).to.equal('translate(0,101)');
                    done();
                });

        });

        it('scale x should be changable', function(done) {

            client.url(url)
                .changeRange('#sx', 35/* orig range */, 80/* new range */)
                .then(function(data) {
                    expect(data.transform).to.equal('scale(2.3,1)');
                    done();
                });

        });

        it('scale y should be changable', function(done) {

            client.url(url)
                .changeRange('#sy', 35/* orig range */, 80/* new range */)
                .then(function(data) {
                    expect(data.transform).to.equal('scale(1,2.3)');
                    done();
                });

        });

        it('width should be changable', function(done) {

            client.url(url)
                .changeRange('#width', 55/* orig range */, 80/* new range */)
                .then(function(data) {
                    expect(data.width).to.equal('928');
                    done();
                });

        });

        it('height should be changable', function(done) {

            client.url(url)
                .changeRange('#height', 35/* orig range */, 80/* new range */)
                .then(function(data) {
                    expect(data.height).to.equal('928');
                    done();
                });

        });

    });

    describe('Fit to content', function() {

        it('padding should be changable', function(done) {

            client.url(url)
                .changeRange('#ftc-padding', 10/* orig range */, 80/* new range */)
                .then(function(data) {
                    expect(data.transform).to.equal('translate(0,25)');
                    expect(data.width).to.equal('625');
                    expect(data.height).to.equal('440');
                    done();
                });

        });

        it('grid width should be changable', function(done) {

            client.url(url)
                .changeRange('#ftc-grid-width', 10/* orig range */, 80/* new range */)
                .then(function(data) {
                    expect(data.transform).to.equal('translate(-75,-50)');
                    expect(data.width).to.equal('525');
                    expect(data.height).to.equal('290');
                    done();
                });

        });

        it('grid height should be changable', function(done) {

            client.url(url)
                .changeRange('#ftc-grid-height', 10/* orig range */, 80/* new range */)
                .then(function(data) {
                    expect(data.transform).to.equal('translate(-75,0)');
                    expect(data.width).to.equal('475');
                    expect(data.height).to.equal('375');
                    done();
                });

        });

    });

    describe('Scale content to fit', function() {

        it('padding should be changable', function(done) {

            client.url(url)
                .changeRange('#stf-padding', 10/* orig range */, 50/* new range */)
                .then(function(data) {
                    expect(data.transform).not.to.equal(null);
                    done();
                });

        });

    });
});
