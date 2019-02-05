# JointJS - JavaScript diagramming library

[![Build Status](https://travis-ci.org/clientIO/joint.svg?branch=master)](https://travis-ci.org/clientIO/joint)
[![Code Quality: Javascript](https://img.shields.io/lgtm/grade/javascript/g/clientIO/joint.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/clientIO/joint/context:javascript)
[![Total Alerts](https://img.shields.io/lgtm/alerts/g/clientIO/joint.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/clientIO/joint/alerts)

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

* Latest Google Chrome (including mobile)
* Latest Firefox
* Latest Safari (including mobile)
* Latest MSEdge
* Latest Opera
* IE 10+
* PhantomJS

Any problem with JointJS in the above browsers should be reported as a bug in JointJS.

## Development Environment

If you want to work on JointJS locally, use the following guidelines to get started.

### Dependencies

Make sure you have the following dependencies installed on your system:
* [Node.js](https://nodejs.org/)
* [grunt-cli](http://gruntjs.com/using-the-cli)
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
This will install all npm dependencies as well as run a full build.

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

### Code Coverage Reports

To output a code coverage report in HTML:
```
grunt test:coverage"
```

To output a code coverage report in [lcov format](http://ltp.sourceforge.net/coverage/lcov/geninfo.1.php):
```
grunt test:coverage --reporter="lcov"
```

The output for all unit tests will be saved in the `coverage` directory.


### Building Distribution Files

The `dist` directory contains pre-built distribution files. To re-build them, run the following:
```
grunt dist
```


## Documentation

The source for the JointJS documentation (plus geometry and Vectorizer libraries) are included in this repository; see the `docs` directory. The documentation can be built into stand-alone HTML documents like this:
```
grunt build:docs
```
The output of the above command can be found at `build/docs`.



## License

JointJS library is licensed under the Mozilla Public License, v. 2.0. Please see the LICENSE file for the full license.

Copyright (c) 2013 client IO


## Contributors

- [David Durman](https://github.com/DavidDurman)
- [Roman Bruckner](https://github.com/kumilingus)
- [Charles Hill](https://github.com/chill117)
- [Vladimir Talas](https://github.com/vtalas)
- [Zbynek Stara](https://github.com/zbynekstara)
