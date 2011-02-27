#!/bin/bash

DEPENDENCIES=" lib/raphael-min.js lib/json2-min.js "
PACKAGES=" src/joint.js src/joint.dia.js src/joint.dia.uml.js src/joint.dia.fsa.js src/joint.dia.pn.js src/joint.dia.devs.js src/joint.dia.cdm.js src/joint.dia.erd.js src/joint.dia.org.js src/joint.arrows.js src/joint.dia.serializer.js "

TIMESTAMP=$(date +%s)
BUILDID="build-"$TIMESTAMP
BUILDLOG="BUILDLOG"

VERSION=$(cat version)
HEADER=$(sed -e s/{VERSION}/$VERSION/g ./HEADER)

##################################################
# Main functions
##################################################

print_info () {
#    echo -e "\033[1;33m$1\e[0m";
    echo -e "$1" | tee -a $BUILDLOG
}

# Result is stored in $MINIFIED_CONTENT
minify () {
#    MINIFIED_CONTENT=""
#    for f in $1; do
#        MINIFIED_CONTENT="$MINIFIED_CONTENT $(python tools/jsmin/jsmin.py < $f)"
#    done

    CLOSURE_COMPILER_ARGUMENTS=""
    for f in $1; do
        CLOSURE_COMPILER_ARGUMENTS="$CLOSURE_COMPILER_ARGUMENTS --js $f"
    done
    MINIFIED_CONTENT="$(java -jar tools/closure_compiler/compiler.jar $CLOSURE_COMPILER_ARGUMENTS 2>>$BUILDLOG)"
}

# Generates API reference and saves it to ./docs/ folder.
build_api_reference () {
    rm -rf www/api
    java -jar tools/jsdoc-toolkit/jsrun.jar tools/jsdoc-toolkit/app/run.js -c=tools/jsdoc-toolkit/conf/joint.conf -d="www/api"
}

print_usage () {
    echo "USAGE: "$0" [-c|-m]";
}

files_size () {
    echo $(du -b $1 | cut -f1 | (tr '\n' + ; echo 0) | bc)
}

# build and create api reference
build_all () {
    build;

    # Build web and api reference
    print_info "\nBuilding api reference..."; build_api_reference
}

build () {
    rm -rf www/build/*

    # Init log file.
    if [ -f $BUILDLOG ]; then
        rm -f $BUILDLOG
    fi
    touch $BUILDLOG
    print_info "Build ID: $BUILDID"
    print_info "$(date)"
    print_info ""

    # Minification.
    print_info "Creating standalone package (joint.all.min.js)..."
    minify "$DEPENDENCIES$PACKAGES"
    print_info "Size before minification: $(files_size "$DEPENDENCIES$PACKAGES") B"
    print_info "Size after minification: ${#MINIFIED_CONTENT} B \n"

    # Create Joint build.
    echo "$HEADER"$MINIFIED_CONTENT >www/build/joint.all.min.js

    # Minify all sources separately.
    for f in $PACKAGES; do
        minify $f
        print_info "Minifying $f: $(files_size "$f") B => ${#MINIFIED_CONTENT} B"
        echo "$HEADER"$MINIFIED_CONTENT >www/build/$(basename $f .js).min.js
    done
}

##################################################
# Process command line arguments.
##################################################

if [ $# -eq 0 ]; then
    MODE="buildall"
fi

while [ $# -gt 0 ]; do 
    case $1 in
        -b) MODE="build"; shift 1;;
        -c) MODE="minify"; MINIFIED_FILE=$2; shift 2;;
        -m) MODE="merge"; MERGED_FILE=$2; shift 2;;
        -a) MODE="api"; shift 1;;
        *)  print_usage; exit 1
    esac
done

case $MODE in
    buildall) build_all ;;
    build) build ;;
    api) build_api_reference ;;
    minify) print_info "Minifying..."; 
            minify "$DEPENDENCIES$PACKAGES"; 
            print_info "Size before minification: $(files_size "$DEPENDENCIES$PACKAGES") B"
            print_info "Size after minification: ${#MINIFIED_CONTENT} B"; 
            echo "$HEADER"$MINIFIED_CONTENT > $MINIFIED_FILE; 
            print_info "Minified file: "$MINIFIED_FILE ;;
    merge) print_info "Merging..."; ls -1 $DEPENDENCIES $PACKAGES; echo "$HEADER" >$MERGED_FILE; cat $DEPENDENCIES$PACKAGES >> $MERGED_FILE; print_info "Merged file: "$MERGED_FILE ;;
esac


