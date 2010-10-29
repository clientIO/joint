#!/bin/bash

DEPENDENCIES=" raphael json2 "
PACKAGES=" joint joint.dia joint.dia.uml joint.dia.fsa joint.dia.pn joint.dia.devs joint.arrows joint.dia.serializer "

TIMESTAMP=$(date +%s)
BUILDDIR="./build-"$TIMESTAMP

VERSION=$(cat version)

# Prepare HEADER
sed -i.bak -e s/{VERSION}/$VERSION/g HEADER

# Minification.
echo ">>> Minifying..."
./minify.sh $PACKAGES

# prepare merging
echo ">>> Merging..."
cp lib/raphael-min.js /tmp/raphael-min.js
python tools/jsmin/jsmin.py < lib/json2.js >/tmp/json2-min.js

# Merging.
./merge.sh $DEPENDENCIES$PACKAGES

# Copying to an appropriate subdirectories of builddir.
echo ">>> Creating build folders and copying sources..."
mkdir -p $BUILDDIR/{src,lib,dep,doc,tests,www}

for p in $PACKAGES; do
    cat HEADER > $BUILDDIR/src/$p.js
    cat src/$p.js >> $BUILDDIR/src/$p.js
    cp /tmp/$p-min.js $BUILDDIR/lib
done
for p in $DEPENDENCIES; do
    cp lib/$p.js $BUILDDIR/dep
    cp /tmp/$p-min.js $BUILDDIR/dep
done

# Build web.
echo ">>> Building web..."
python ./build-www.py
echo ">>> Building api reference..."
./build-api-reference.sh

# Copy Joint build.
cp /tmp/joint.all-min.js $BUILDDIR/lib/
cp $BUILDDIR/lib/* www/joint/
cp $BUILDDIR/src/* www/joint/
cp $BUILDDIR/dep/* www/joint/

# Copy web.
echo ">>> Copying web..."
cp -R www/* $BUILDDIR/www/

# Revert HEADER
mv HEADER.bak HEADER

echo "Build completed ($BUILDDIR)."


