#!/bin/bash

for p in $@; do
    cat HEADER > /tmp/$p-min.js
    python tools/jsmin/jsmin.py < src/$p.js >>/tmp/$p-min.js
    echo "File src/$p.js ($(du -h src/$p.js | cut -f1)) minified (/tmp/$p-min.js ($(du -h /tmp/$p-min.js | cut -f1)))."
done
