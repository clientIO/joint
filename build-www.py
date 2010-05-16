#!/usr/bin/env python

# Generate www.

fVersion = open('version')
JOINT_VERSION = fVersion.read()
fVersion.close()
TEMPLATES_DIR = 'www/templates/'
TEMPLATE_SUFFIX = '.tpl'
TARGET_DIR = 'www/'
TARGET_SUFFIX = '.html'

template = 'template.tpl'
pages = ['index', 'about', 'aboutme', 'license', 'tutorial', 'manual']


if __name__ == "__main__":

    fTemplate = open(TEMPLATES_DIR + template)
    sTemplate = fTemplate.read()
    sTemplate = sTemplate.replace('{VERSION}', JOINT_VERSION)
    fTemplate.close()

    for p in pages:
        fPage = open(TEMPLATES_DIR + p + TEMPLATE_SUFFIX)
        sPage = fPage.read()
        sPage = sPage.replace('{VERSION}', JOINT_VERSION)
        fNewpage = open(TARGET_DIR + p + TARGET_SUFFIX, 'w')
        fNewpage.write(sTemplate.replace('{CONTENT}', sPage))
        fPage.close()
        fNewpage.close()


    

