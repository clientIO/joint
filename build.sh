#!/bin/bash

./minify.sh
./merge.sh
rm -rf build
mkdir build
mv *-min.js ./build
