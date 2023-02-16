const Handlebars = require('handlebars');

function processItem(baseDir, item) {

    item.key = docFilePathToKey(item.file, baseDir);
    item.isIntro = item.key.substr(item.key.lastIndexOf('.') + 1) === 'intro';

    item.heading = item.key;
    if (item.isIntro) {
        item.heading = item.heading.substr(0, item.heading.lastIndexOf('.'));
    }

    return item;
}

function docFilePathToKey(filePath, baseDir) {

    return filePath.substr(baseDir.length).split('.').shift().replace(/\//g, '.');
}

module.exports = function(grunt) {

    const utils = require('../resources/utils')(grunt);
    const pkg = utils.pkg;

    (function registerPartials(partials) {

        partials = grunt.file.expand(partials);

        partials.forEach(function(partial) {
            var name = partial.split('/').pop().split('.').shift();
            var html = grunt.file.read(partial);
            Handlebars.registerPartial(name, html);
        });

    })('docs/templates/partials/*.html');

    Handlebars.registerHelper('depth', function() {
        return Math.min(6, this.key.split('.').length + 1);
    });

    Handlebars.registerHelper('label', function() {
        return this.key.indexOf('.') === -1 ? this.key : this.key.substr(this.key.lastIndexOf('.') + 1);
    });

    /* 
        Create unique title tag for documentation page that includes version number.
        For SEO performance, title and h1 tags should be unique, and titles need 
        to be unique across different versions of the documentation.
    */
    Handlebars.registerHelper('title', function() {
        return `${this.heading} (v${pkg.version.split('.').slice(0, -1).join('.')}) - JointJS Docs`;
    });

    /* 
        Create unique content to insert into documentation meta description using the page heading and version number.
        `Joint API v(3.6)`
        For SEO performance, each documentation page meta description should be unique, and also unique across
        different versions of the documentation.
    */
    Handlebars.registerHelper('description', function() {
        return `${this.heading} (v${pkg.version.split('.').slice(0, -1).join('.')})`;
    });

    return {
        all: {
            options: {
                template: 'docs/templates/api.html',
                compileTemplate: Handlebars.compile,
                sortItems: 'js-api'
            },
            files: [
                {
                    meta: {
                        heading: 'Geometry API',
                        searchPlaceholder: 'i.e. point'
                    },
                    intro: 'docs/src/geometry/intro.md',
                    processItems: processItem.bind(undefined, 'docs/src/geometry/api/'),
                    dest: 'build/docs/geometry.html',
                    src: 'docs/src/geometry/api/**/*.{md,html}'
                },
                {
                    meta: {
                        heading: 'Joint API',
                        searchPlaceholder: 'i.e. graph'
                    },
                    intro: 'docs/src/joint/intro.html',
                    processItems: processItem.bind(undefined, 'docs/src/joint/api/'),
                    dest: 'build/docs/joint.html',
                    src: 'docs/src/joint/api/**/*.{md,html}'
                },
                {
                    meta: {
                        heading: 'Vectorizer API',
                        searchPlaceholder: 'i.e. addClass'
                    },
                    intro: 'docs/src/vectorizer/intro.html',
                    processItems: processItem.bind(undefined, 'docs/src/vectorizer/api/'),
                    dest: 'build/docs/vectorizer.html',
                    src: 'docs/src/vectorizer/api/**/*.{md,html}'
                }
            ]
        }
    };
};
