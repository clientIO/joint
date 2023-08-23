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

                let highlighted = false;

                $('code:not(.highlighted)').each(function() {

                    const lang = ($(this).attr('data-lang') || 'javascript').toLowerCase();

                    if (lang) {
                        const code = decodeHtmlEntities($(this).text());
                        const highlightedCode = Prism.highlight(code, Prism.languages[lang]);
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
