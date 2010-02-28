#!/bin/bash

PACKAGES="raphael joint joint.dia joint.dia.uml joint.dia.fsa joint.dia.pn joint.dia.devs joint.arrows"

cat joint.all.js.HEADER > joint.all-min.js
for p in $PACKAGES; do
    cat $p-min.js >> joint.all-min.js
done
