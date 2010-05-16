#!/bin/bash

cat HEADER > /tmp/joint.all-min.js
for p in $@; do
    cat /tmp/$p-min.js >> /tmp/joint.all-min.js
done

echo "File /tmp/joint.all-min.js ($(du -h /tmp/joint.all-min.js | cut -f1)) created".
