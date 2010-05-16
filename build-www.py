#!/usr/bin/env python

# Generate www.

TEMPLATES_DIR = 'www/templates/'
TEMPLATE_SUFFIX = '.tpl'
TARGET_DIR = 'www/'
TARGET_SUFFIX = '.html'

template = 'template.tpl'
pages = ['index', 'about', 'aboutme', 'license', 'tutorial', 'manual']


if __name__ == "__main__":

    fTemplate = open(TEMPLATES_DIR + template)
    sTemplate = fTemplate.read()

    for p in pages:
        fPage = open(TEMPLATES_DIR + p + TEMPLATE_SUFFIX)
        fNewpage = open(TARGET_DIR + p + TARGET_SUFFIX, 'w')
        fNewpage.write(sTemplate.replace('{CONTENT}', fPage.read()))
        fPage.close()
        fNewpage.close()
    
