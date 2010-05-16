#!/bin/bash

for p in $@; do
    cat $p.js.HEADER > $p-min.js
    python jsmin.py < $p.js >>$p-min.js
    echo File $p.js minified \($p-min.js\).
done
