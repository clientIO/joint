/*
 * e2e test for CHESS demo: http://jointjs.com/demos/chess
 */

'use strict';

var expect = require('chai').expect;
var e2eHelpers = require('../e2eHelpers');

describe('Chess', function() {

    var client;
    var url;

    before(function(done) {

        url = e2eHelpers.staticUrl('/demo/chess/index.html');
        client = e2eHelpers.client(done);
    });

    it('should be visible', function(done) {

        client.url(url)
            .waitForExist('#board .joint-type-chess-rookwhite')
            .then(function(exists) {
                expect(exists).to.equal(true);
                done();
            });

    });

    it('should be movable', function(done) {

        client.url(url)
            .getAttribute('#board g[transform="translate(150,300)"]', 'model-id') // PawnWhite d2
            .then(function(modelId) {
                this
                    .moveElement('#board g[model-id="' + modelId + '"]', 150 + 30, 200 + 20) // d4
                    .then(function(transform) {
                        expect(transform).to.equal('translate(150,200)');
                        done();
                    });
            });

    });

    it('should be playable', function(done) {

        client.url(url)
            .getAttribute('#board g[transform="translate(150,300)"]', 'model-id') // PawnWhite d2
            .then(function(modelId) {
                this
                    .moveElement('#board g[model-id="' + modelId + '"]', 150 + 30, 200 + 20) // d4
                    .pause(100)
                    .getText('#message')
                    .then(function(msg) {
                        // msg return: 1. d4 ?
                        var msgMoves = msg.split(' ').length;
                        expect(msgMoves).to.equal(3);
                        done();
                    });
            });

    });

});
