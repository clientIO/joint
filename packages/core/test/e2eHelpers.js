'use strict';

var _ = require('lodash');
var express = require('express');
var serveStatic = require('serve-static');
var webdriverio = require('webdriverio');

var config = {
    timeouts: {
        'script': 15000,
        'implicit': 5000,
        'page load': 30000
    },
    // Uncomment the following line to enable verbose logging for webdriverio.
    // logLevel: 'verbose'
};

var app;
var client;
var host = 'localhost';
var port = 3000;

var e2eHelpers = module.exports = {
    config: config,
    staticUrl: function(uri) {

        return 'http://' + host + ':' + port + uri;
    },
    setUp: function(cb) {

        e2eHelpers.createStaticServer(cb);
    },
    createStaticServer: function(cb) {

        app = express();
        app.use(serveStatic(__dirname + '/..'));
        app.server = app.listen(port, host);
        cb();
    },
    tearDown: function(cb) {

        e2eHelpers.destroyClient(function(error) {
            if (error)
                return cb(error);
            e2eHelpers.destroyStaticServer(cb);
        });
    },
    destroyClient: function(cb) {

        if (!client)
            return cb();

        client.end().then(function() {
            client = null;
            cb();
        });
    },
    destroyStaticServer: function(cb) {

        app.server.close();
        app = null;
        cb();
    },
    client: function(cb) {

        if (client) {
            setTimeout(cb, 0);
            return client;
        }

        var options = {
            // https://code.google.com/p/selenium/wiki/DesiredCapabilities
            desiredCapabilities: {
                browserName: process.env.E2E_BROWSER || 'chrome'
            }
        };

        if (process.env.E2E_DESIRED) {
            options.desiredCapabilities = JSON.parse(process.env.E2E_DESIRED);
        }

        if (process.env.SELENIUM_HOST) {
            options.host = process.env.SELENIUM_HOST;
        }

        if (process.env.SELENIUM_PORT) {
            options.port = process.env.SELENIUM_PORT;
        }

        if (process.env.SELENIUM_USER) {
            options.user = process.env.SELENIUM_USER;
        }

        if (process.env.SELENIUM_KEY) {
            options.key = process.env.SELENIUM_KEY;
        }

        if (config.logLevel) {
            options.logLevel = config.logLevel;
        }

        client = webdriverio.remote(options);

        _.each(e2eHelpers.customCommands, function(fn, name) {
            client.addCommand(name, fn, true);
        });

        return client.init()
            .setViewportSize({ width: 1024, height: 768 }, false)
            .timeouts('script', config.timeouts['script'])

        /*
                 Cannot set 'implicit' timeout because of a bug in webdriverio [1].
                 [1] https://github.com/webdriverio/webdriverio/issues/974
                 */
        // .timeouts('implicit', config.timeouts['implicit'])
            .timeouts('page load', config.timeouts['page load'])
            .then(function() {
                cb();
            }).catch(cb);
    },
    customCommands: {
        waitForNotExist: function(selector, waitTime) {

            if (_.isUndefined(waitTime)) {
                waitTime = config.timeouts['implicit'];
            }

            return this.waitForExist(selector, waitTime, true/* reverse */).then(function(notExists) {
                return notExists;
            });
        },
        moveElement: function(selector, posX, posY) {

            var selectorId = selector.split(' ')[0];

            if (!posX) {
                posX = 40;
            }
            if (!posY) {
                posY = 30;
            }

            return this
                .moveToObject(selector, 20/* x-offset */, 20/* y-offset */)
                .buttonDown()
                .moveToObject(selectorId + ' svg', posX /* x-offset */, posY /* y-offset */)
                .buttonUp()
                .getAttribute(selector, 'transform')
                .then(function(transform) {
                    return transform;
                });
        },
        changeRange: function(selector, posRangeX, newPosRangeX) {

            var retObj = {
                transform: '',
                width: '',
                height: ''
            };

            return this
                .waitForExist(selector)
                .moveToObject(selector, posRangeX/* x-offset */, 10/* y-offset */)
                .buttonDown()
                .moveToObject(selector, newPosRangeX/* x-offset */, 10/* y-offset */)
                .buttonUp()
                .getAttribute('#paper .joint-viewport', 'transform')
                .then(function(transform) {
                    retObj.transform = transform;
                })
                .getAttribute('#paper svg', 'width')
                .then(function(width) {
                    retObj.width = width;
                })
                .getAttribute('#paper svg', 'height')
                .then(function(height) {
                    retObj.height = height;
                    return retObj;
                });
        }
    }
};

// Set global hooks.
before(e2eHelpers.setUp);
after(e2eHelpers.tearDown);
