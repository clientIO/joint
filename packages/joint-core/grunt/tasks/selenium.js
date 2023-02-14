const selenium = require('selenium-standalone');

module.exports = function(grunt) {

    let seleniumChildProcess;

    const seleniumConfig = {
        drivers: {
            chrome: {
                version: 2.29,
                baseURL: 'https://chromedriver.storage.googleapis.com'
            }
        }
    };

    let seleniumInstalled = grunt.file.exists('./node_modules/selenium-standalone/.selenium/selenium-server');

    function startSelenium(cb) {
        grunt.log.writeln('Starting selenium..');
        selenium.start(seleniumConfig, function(error, child) {
            if (error) return cb(error);
            seleniumChildProcess = child;
            cb();
        });
    }

    function stopSelenium(cb) {
        if (seleniumChildProcess) seleniumChildProcess.kill();
        cb();
    }

    function installSelenium(cb) {
        if (seleniumInstalled) return cb();
        grunt.log.writeln('Installing selenium..');
        seleniumInstalled = true;
        selenium.install(seleniumConfig, cb);
    }

    process.on('exit', function() {
        // Kill selenium server process if it is running.
        if (seleniumChildProcess) seleniumChildProcess.kill();
    });

    grunt.registerTask('selenium', function(action) {

        const done = this.async();

        switch (action) {

            case 'install':
                return installSelenium(done);

            case 'start':
                return installSelenium(function(error) {
                    if (error) return done(error);
                    startSelenium(done);
                });

            case 'stop':
                return stopSelenium(done);

            // For backwards compatibility (`grunt selenium`).
            // This task starts the local selenium server and then waits.
            default:
                return installSelenium(function(error) {
                    if (error) return done(error);
                    startSelenium(function(error) {
                        if (error) return done(error);
                        grunt.log.writeln('Selenium started');
                        grunt.log.writeln('Exit this process ' + '[CTRL+C]'['white'].bold + ' to stop selenium');
                        // Never call done.
                        // This allows selenium to continue running until the grunt process is killed.
                    });
                });
        }
    });
};
