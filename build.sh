#!/bin/bash

DEPENDENCIES=" lib/raphael-min.js lib/json2-min.js "
PACKAGES=" joint joint.dia joint.dia.uml joint.dia.fsa joint.dia.pn joint.dia.devs joint.arrows joint.dia.serializer "

SRC_DIR="src/"

TIMESTAMP=$(date +%s)
BUILDDIR="./build-"$TIMESTAMP

VERSION=$(cat version)

TEMPLATES_DIR="www/templates/"
WWW_TARGET_DIR="www/"
WWW_PAGE_TEMPLATE="template.tpl"


##################################################
# Main functions
##################################################

print_info () {
    echo -e "\033[1;33m$1\e[0m"
}

# Result is stored in $MINIFIED_CONTENT and $SIZE_BEFORE_MINIFICATION variables.
minify () {
    MINIFIED_CONTENT=""
    SIZE_BEFORE_MINIFICATION=$((0))
    for f in $1; do
        echo $f
        SIZE_BEFORE_MINIFICATION=$(($SIZE_BEFORE_MINIFICATION + $(du -b $f | cut -f1)))
        MINIFIED_CONTENT="$MINIFIED_CONTENT $(python tools/jsmin/jsmin.py < $f)"
    done
}

build_www () {
    WWW_PAGE_TEMPLATE_CONTENT=$(cat $TEMPLATES_DIR$WWW_PAGE_TEMPLATE)
    TEMPLATE_VERSION_REPLACED=${WWW_PAGE_TEMPLATE_CONTENT//\{VERSION\}/${VERSION}}

    for f in $TEMPLATES_DIR*; do
        FILE_NAME=${f##*/}
        echo ${TEMPLATE_VERSION_REPLACED/\{CONTENT\}/$(cat $f)} > $WWW_TARGET_DIR${FILE_NAME%.tpl}.html
    done
}

build_api_reference () {
    # Generates API reference and saves it to ./docs/ folder.
    java -jar tools/jsdoc-toolkit/jsrun.jar tools/jsdoc-toolkit/app/run.js -c=tools/jsdoc-toolkit/conf/joint.conf    
}

print_usage () {
    echo "USAGE: "$0" [-c|-m]";
}


build_all () {

    # Prepare HEADER
    sed -i.bak -e s/{VERSION}/$VERSION/g HEADER

    # Minification.
    print_info "Minifying..."
    minify $SRC_DIR*

    # Merging.
    print_info "Merging..."
    cat $DEPENDENCIES$SRC_DIR*

    # Copying to an appropriate subdirectories of builddir.
    print_info "Creating build folders and copying sources..."
    mkdir -p $BUILDDIR/{src,lib,dep,doc,tests,www}
    cp $SRC_DIR* $BUILDDIR/src/
    cp $DEPENDENCIES $BUILDDIR/dep/

    # Build web and api reference
    print_info "Building web..."; build_www
    print_info "Building api reference..."; build_api_reference

    # Copy Joint build.
    cp /tmp/joint.all-min.js $BUILDDIR/lib/
    cp $BUILDDIR/lib/* www/joint/
    cp $BUILDDIR/src/* www/joint/
    cp $BUILDDIR/dep/* www/joint/

    # Copy web.
    print_info "Copying web..."
    cp -R www/* $BUILDDIR/www/

    # Revert HEADER
    mv HEADER.bak HEADER

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
    minify) print_info "Minifying..."; minify "$DEPENDENCIES $SRC_DIR*"; print_info "Size before minification: "$(($SIZE_BEFORE_MINIFICATION / 1024))KB; print_info "Size after minification: "$((${#MINIFIED_CONTENT} / 1024))KB; echo $MINIFIED_CONTENT > $MINIFIED_FILE; print_info "Minified file: "$MINIFIED_FILE ;;
    merge) print_info "Merging..."; ls -1 $DEPENDENCIES $SRC_DIR*; cat $DEPENDENCIES $SRC_DIR* > $MERGED_FILE; print_info "Merged file: "$MERGED_FILE ;;
    build) 
esac


