# JointJS - JavaScript diagramming library

[![Build Status](https://travis-ci.org/clientIO/joint.svg?branch=master)](https://travis-ci.org/clientIO/joint)

JointJS is a JavaScript diagramming library. It can be used to create either static diagrams or, and more
importantly, fully interactive diagramming tools and application builders.

Please see [http://jointjs.com](http://jointjs.com) for more information, demos and documentation.


## Features

* basic diagram elements (rect, circle, ellipse, text, image, path)
* ready-to-use diagram elements of well-known diagrams (ERD, Org chart, FSA, UML, PN, DEVS, ...)
* custom diagram elements based on SVG or programmatically rendered
* interactive elements and links
* connecting diagram elements with links
* customizable links, their arrowheads and labels
* links smoothing (bezier interpolation)
* magnets (link connection points) can be placed basically anywhere
* hierarchical diagrams
* serialization/deserialization to/from JSON format
* highly event driven - you can react on any event that happens inside the paper
* zoom in/out
* touch support
* plugin awareness
* MVC architecture
* ... a lot more


## Supported browsers

Only the good ones (those that support SVG):

* Latest Google Chrome (including mobile)
* Latest Firefox
* Safari (including mobile)
* IE 9+


## Development Environment

If you want to work on JointJS locally, use the following guidelines to get started.

### Dependencies

Make sure you have the following dependencies installed on your system:
* [Node.js](https://nodejs.org/)
* [grunt-cli](http://gruntjs.com/using-the-cli)
* [bower](http://bower.io/)
* git

### Setup

Clone this git repository:
```
git clone https://github.com/clientIO/joint.git
```

Change into the joint directory:
```
cd joint
```

Run installation
```
npm install
```
This will install all npm and bower dependencies as well as run a full build.

### Tests

To run all tests:
```
grunt test
```

To run only the server-side tests:
```
grunt test:server
```

To run only the client-side tests:
```
grunt test:client
```

To run code style checks:
```
grunt test:code-style
```

### Code Coverage

It is possible to generate code coverage reports using the existing qunit tests. For example, to output the coverage report in [lcov format](http://ltp.sourceforge.net/coverage/lcov/geninfo.1.php) for all unit tests:
```
grunt qunit:all_coverage --reporter lcov --coverage
```

By default, the output will be saved to `coverage.info` at the root of the project directory. You can change the output file like this:
```
grunt qunit:all_coverage --reporter lcov --output customfilename.info --coverage
```

### Building Distribution Files

The `dist` directory contains pre-built distribution files. To re-build them, run the following:
```
grunt dist
```


## License

JointJS library is licensed under the Mozilla Public License, v. 2.0. Please see the LICENSE file for the full license.

Copyright (c) 2013 client IO


## Contributors

- [David Durman](http://github.com/DavidDurman)
- [Roman Bruckner](http://github.com/kumilingus)
- [Emanuele Palombo](http://github.com/elbowz)
- [Charles Hill](http://github.com/chill117)
- [Daniel K.](http://github.com/FredyC)

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/DavidDurman/joint/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
