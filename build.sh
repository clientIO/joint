#!/bin/bash

DEPENDENCIES=" raphael "
PACKAGES=" joint joint.dia joint.dia.uml joint.dia.fsa joint.dia.pn joint.dia.devs joint.arrows joint.dia.serializer "

TIMESTAMP=$(date +%s)
BUILDDIR="./build-"$TIMESTAMP

# Minification.
./minify.sh $PACKAGES
echo "--- Minification completed. ---"

# Merging.
./merge.sh $DEPENDENCIES$PACKAGES
echo "--- Merge completed. ---"

# Copying to an appropriate subdirectories of builddir.
mkdir -p $BUILDDIR/{src,lib,dep,doc,tests,www}
for p in $PACKAGES; do
    cp $p.js $BUILDDIR/src
    cp $p-min.js $BUILDDIR/lib
done
for p in $DEPENDENCIES; do
    cp $p.js $BUILDDIR/dep
    cp $p-min.js $BUILDDIR/dep
done
echo --- Build completed \($BUILDDIR\). ---

# Generating documentation.
