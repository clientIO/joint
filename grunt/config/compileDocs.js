const Handlebars = require('handlebars');

function processItem(baseDir, item) {

    item.key = docFilePathToKey(item.file, baseDir);
    item.isIntro = item.key.substr(item.key.lastIndexOf('.') + 1) === 'intro';

    item.title = item.key;
    if (item.isIntro) {
        item.title = item.title.substr(0, item.title.lastIndexOf('.'));
    }

    return item;
}

function docFilePathToKey(filePath, baseDir) {

    return filePath.substr(baseDir.length).split('.').shift().replace(/\//g, '.');
}

module.exports = function(grunt) {

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
                        title: 'Geometry API',
                        searchPlaceholder: 'i.e. point'
                    },
                    intro: 'docs/src/geometry/intro.md',
                    processItems: processItem.bind(undefined, 'docs/src/geometry/api/'),
                    dest: 'build/docs/geometry.html',
                    src: 'docs/src/geometry/api/**/*.{md,html}'
                },
                {
                    meta: {
                        title: 'Joint API',
                        searchPlaceholder: 'i.e. graph'
                    },
                    intro: 'docs/src/joint/intro.html',
                    processItems: processItem.bind(undefined, 'docs/src/joint/api/'),
                    dest: 'build/docs/joint.html',
                    src: 'docs/src/joint/api/**/*.{md,html}'
                },
                {
                    meta: {
                        title: 'Vectorizer API',
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
}
