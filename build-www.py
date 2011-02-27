#!/usr/bin/env python

# Generate www.

import os
import shutil

TEMPLATES_DIR = 'www/templates/'
TARGET_DIR = 'www/'
template = 'template.tpl'

if __name__ == "__main__":
    # copy demos to www
    shutil.rmtree(TARGET_DIR + 'demos/');
    shutil.rmtree(TARGET_DIR + 'lib/');
    shutil.rmtree(TARGET_DIR + 'src/');
    shutil.copytree('demos', TARGET_DIR + 'demos')
    shutil.copytree('lib', TARGET_DIR + 'lib')
    shutil.copytree('src', TARGET_DIR + 'src')

    template = open(TEMPLATES_DIR + template)
    templateContent = template.read()
    template.close()
    templates = os.listdir(TEMPLATES_DIR)

    for tpl in templates:
        if tpl == template: continue

        tplFile = open(TEMPLATES_DIR + tpl)
        tplContent = tplFile.read()
        page = open(TARGET_DIR + os.path.splitext(tpl)[0] + '.html', 'w')
        page.write(templateContent.replace('{CONTENT}', tplContent))
        page.close()
        tplFile.close()

