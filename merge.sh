#!/bin/bash

cat joint.all.js.HEADER > joint.all-min.js
for p in $@; do
    cat $p-min.js >> joint.all-min.js
done

echo File joint.all-min.js created.
