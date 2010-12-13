#!/bin/bash

DEPENDENCIES=" lib/raphael-min.js lib/json2-min.js "
PACKAGES=" src/joint.js src/joint.dia.js src/joint.dia.uml.js src/joint.dia.fsa.js src/joint.dia.pn.js src/joint.dia.devs.js src/joint.arrows.js src/joint.dia.serializer.js "

SRC_DIR="src/"

TIMESTAMP=$(date +%s)
BUILDDIR="./build-"$TIMESTAMP

VERSION=$(cat version)
HEADER=$(sed -e s/{VERSION}/$VERSION/g ./HEADER)

TEMPLATES_DIR="www/templates/"
WWW_TARGET_DIR="$BUILDDIR/www/"
WWW_PAGE_TEMPLATE="template.tpl"


##################################################
# Main functions
##################################################

print_info () {
#    echo -e "\033[1;33m$1\e[0m";
    echo -e "$1" | tee -a $BUILDDIR/buildlog
}

# Result is stored in $MINIFIED_CONTENT
minify () {
    MINIFIED_CONTENT=""
    for f in $1; do
        MINIFIED_CONTENT="$MINIFIED_CONTENT $(python tools/jsmin/jsmin.py < $f)"
    done
}

build_www () {
    for f in $TEMPLATES_DIR*; do
        FILE_NAME=${f##*/}
        sed -e "/{CONTENT}/r $f" -e "/{CONTENT}/d" -e "s/{VERSION}/$VERSION/g" $TEMPLATES_DIR$WWW_PAGE_TEMPLATE >$WWW_TARGET_DIR${FILE_NAME%.tpl}.html
        sed -i -e "s/{VERSION}/$VERSION/g" $WWW_TARGET_DIR${FILE_NAME%.tpl}.html
    done
}

# Generates API reference and saves it to ./docs/ folder.
build_api_reference () {
    java -jar tools/jsdoc-toolkit/jsrun.jar tools/jsdoc-toolkit/app/run.js -c=tools/jsdoc-toolkit/conf/joint.conf -d="$BUILDDIR/www/api"
}

print_usage () {
    echo "USAGE: "$0" [-c|-m]";
}

files_size () {
    echo $(du -b $1 | cut -f1 | (tr '\n' + ; echo 0) | bc)
}

build_all () {

    # Copying to an appropriate subdirectories of builddir.
    mkdir -p $BUILDDIR/{src,lib,dep,doc,tests,www}

    # Init log file.
    touch $BUILDDIR/buildlog
    print_info "Build ID: $BUILDDIR"
    print_info "$(date)"
    print_info ""

    print_info "Copying sources..."
    cp $SRC_DIR* $BUILDDIR/src/
    cp $DEPENDENCIES $BUILDDIR/dep/

    # Minification.
    print_info "Creating standalone package (joint.all-min.js)..."
    minify "$DEPENDENCIES$PACKAGES"
    print_info "Size before minification: $(files_size "$DEPENDENCIES$PACKAGES") B"
    print_info "Size after minification: ${#MINIFIED_CONTENT} B"

    # Create Joint build.
    echo "$HEADER"$MINIFIED_CONTENT >$BUILDDIR/lib/joint.all-min.js

    # Minify all sources separately.
    for f in $PACKAGES; do
        minify $f
        print_info "Minifying $f: $(files_size "$f") B => ${#MINIFIED_CONTENT} B"
        echo "$HEADER"$MINIFIED_CONTENT >$BUILDDIR/lib/$(basename $f .js)-min.js
    done

    cp -R www/* $BUILDDIR/www/
    # Copy whole build to www/joint for web site use.
    cp $BUILDDIR/lib/* $BUILDDIR/src/* $BUILDDIR/dep/* $BUILDDIR/www/joint/

    # Build web and api reference
    print_info "Building web..."; build_www
    print_info "Building api reference..."; build_api_reference

    print_info "Build completed ($BUILDDIR)."
}

##################################################
# Process command line arguments.
##################################################

if [ $# -eq 0 ]; then
    MODE="buildall"
fi

while [ $# -gt 0 ]; do 
    case $1 in
        -b) MODE="build"; BUILD_FILE=$2; shift 2;;
        -c) MODE="minify"; MINIFIED_FILE=$2; shift 2;;
        -m) MODE="merge"; MERGED_FILE=$2; shift 2;;
        *)  print_usage; exit 1
    esac
done

case $MODE in
    buildall) build_all ;;
    minify) print_info "Minifying..."; 
            minify "$DEPENDENCIES$PACKAGES"; 
            print_info "Size before minification: $(files_size "$DEPENDENCIES$PACKAGES") B"
            print_info "Size after minification: ${#MINIFIED_CONTENT} B"; 
            echo "$HEADER"$MINIFIED_CONTENT > $MINIFIED_FILE; 
            print_info "Minified file: "$MINIFIED_FILE ;;
    merge) print_info "Merging..."; ls -1 $DEPENDENCIES $PACKAGES; echo "$HEADER" >$MERGED_FILE; cat $DEPENDENCIES$PACKAGES >> $MERGED_FILE; print_info "Merged file: "$MERGED_FILE ;;
    build) 
esac


