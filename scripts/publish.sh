#!/bin/bash

# Rebuild dist files, run all tests, and finally publish to npm only if everything is OK.
grunt dist && grunt test && npm publish;
