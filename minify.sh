#!/bin/bash

PACKAGES="joint joint.dia joint.dia.uml joint.dia.fsa joint.dia.pn joint.dia.devs joint.arrows"

for p in $PACKAGES; do
    cat $p.js.HEADER > $p-min.js
    python jsmin.py < $p.js >>$p-min.js
done

