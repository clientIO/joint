JointJS - JavaScript diagramming library
========================================

[![Build Status](https://travis-ci.org/clientIO/joint.svg?branch=master)](https://travis-ci.org/clientIO/joint)

JointJS is a JavaScript diagramming library. It can be used to create either static diagrams or, and more
importantly, fully interactive diagramming tools and application builders.

Please see [http://jointjs.com](http://jointjs.com) for more information, demos and documentation.


Features
--------


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


Supported browsers
------------------

Only the good ones (those that support SVG):

* Latest Google Chrome (including mobile)
* Latest Firefox
* Safari (including mobile)
* IE 9+


Tests
-----

Before running tests, be sure to run a full build:
```
grunt all
```

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
grunt jscs
```


Code Coverage
-------------

It is possible to generate code coverage reports using the existing qunit tests. For example, to output the coverage report in [lcov format](http://ltp.sourceforge.net/coverage/lcov/geninfo.1.php) for the joint unit tests:
```
grunt qunit:joint --reporter lcov --coverage
```

And for all unit tests:
```
grunt qunit:all --reporter lcov --coverage
```

By default, the output will be saved to `coverage.info` at the root of the project directory. You can change the output file like this:
```
grunt qunit:joint --reporter lcov --output customfilename.info --coverage
```


License
-------

JointJS library is licensed under the Mozilla Public License, v. 2.0. Please see the LICENSE file for the full license.

Copyright (c) 2013 client IO


Contributors
------------

- [David Durman](http://github.com/DavidDurman)
- [Roman Bruckner](http://github.com/kumilingus)
- [Emanuele Palombo](http://github.com/elbowz)
- [Charles Hill](http://github.com/chill117)


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/DavidDurman/joint/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

