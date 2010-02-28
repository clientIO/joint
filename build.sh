#!/bin/bash

PACKAGES="raphael joint joint.dia joint.dia.uml joint.dia.fsa joint.dia.pn joint.dia.devs joint.arrows"

./minify.sh
echo "minification completed"
./merge.sh
echo "merge completed"
rm -rf build
mkdir build
mv *-min.js ./build
cp ./build/raphael-min.js . # copy raphael-min.js back
mkdir ./build/src
for p in $PACKAGES; do
    cp $p.js ./build/src
done
echo "build completed"
