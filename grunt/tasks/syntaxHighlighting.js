const cheerio = require('cheerio');
const Prism = require('prismjs');

function decodeHtmlEntities(str) {

    const $ = cheerio.load('<div></div>');
    return $('div').html(str).text();
}

module.exports = function(grunt) {

    grunt.registerMultiTask('syntaxHighlighting', function() {

        this.files.forEach(function(file) {

            const files = grunt.file.expand(file.src);

            files.forEach(function(file) {

                const content = grunt.file.read(file);

                const $ = cheerio.load(content, {
                    normalizeWhitespace: false,
                    decodeEntities: false
                });

                const highlighted = false;

                $('code:not(.highlighted)').each(function() {

                    var lang = ($(this).attr('data-lang') || 'javascript').toLowerCase();

                    if (lang) {
                        var code = decodeHtmlEntities($(this).text());
                        var highlightedCode = Prism.highlight(code, Prism.languages[lang]);
                        $(this).html(highlightedCode);
                        $(this).addClass('highlighted');
                        highlighted = true;
                    }
                });

                if (highlighted) {
                    grunt.file.write(file, $.html());
                    grunt.log.writeln('File ' + file['cyan'] + ' highlighted.');
                }
            });
        });
    });

};
