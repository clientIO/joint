# JointJS - JavaScript diagramming library powering exceptional UIs

[![Build Status](https://travis-ci.com/clientIO/joint.svg?branch=master)](https://travis-ci.com/clientIO/joint)
[![Total Discussion](https://img.shields.io/github/discussions/badges/shields)](https://github.com/clientIO/joint/discussions)
[![NPM Version](https://img.shields.io/npm/v/jointjs)](https://www.npmjs.com/package/jointjs)
[![NPM License](https://img.shields.io/npm/l/jointjs?color=blue)](https://github.com/clientIO/joint/blob/master/LICENSE)

 [JointJS](https://jointjs.com) is a tested and proven  *JavaScript*/*Typescript* diagramming library that helps developers and companies of any size build visual and No-Code/Low-Code applications faster and with confidence. It’s a flexible tool from which a wide range of UIs can be created (interactive diagramming applications, drawing tools, data visualizations, UIs for monitoring systems, and many more). It can become the foundational layer of your next application and help you bring your idea to market in days, not months or years.

![Use Cases](https://user-images.githubusercontent.com/3967880/200360293-808f148c-32af-4f46-bec1-b4ae4e1592a0.jpg)

Further **information**, **examples** and **documentation** can be found at [jointjs.com](https://jointjs.com).

:1234: Get started with [tutorials](https://resources.jointjs.com/tutorial).

:bulb: To ask a question, share feedback, or engage in a discussion with other community members, visit our [GitHub discussions](https://github.com/clientIO/joint/discussions).

:pen: More examples are available on [CodePen](https://codepen.io/jointjs).

:book: Check out our [mind-map documentation](https://resources.jointjs.com/mmap/joint.html).

## Features

* essential diagram elements (rect, circle, ellipse, text, image, path)
* ready-to-use diagram elements of well-known diagrams (ERD, Org chart, FSA, UML, PN, DEVS, ...)
* custom diagram elements based on SVG or programmatically rendered
* connecting diagram elements with links or links with links
* customizable links, their arrowheads and labels
* configurable link shapes (anchors, connection points, vertices, routers, connectors)
* custom element properties and data
* import/export from/to JSON format
* customizable element ports (look and position, distributed around shapes or manually positioned)
* rich graph API (traversal, dfs, bfs, find neighbors, predecessors, elements at point, ...)
* granular interactivity
* hierarchical diagrams (containers, embedded elements, child-parent relationships)
* element & link tools (buttons, status icons, tools to change the shape of links, ...)
* highlighters (provide visual emphasis to your elements)
* automatic layouts (arrange the elements and links automatically)
* highly event driven (react on any event that happens inside the diagram)
* zoom in/out
* touch support
* MVC architecture
* SVG based
* ... a lot more


## Supported browsers

* Latest Google Chrome (including mobile)
* Latest Firefox
* Latest Safari (including mobile)
* Latest Microsoft's Edge
* Latest Opera

## Development Environment

If you want to work on *JointJS* locally, use the following guidelines to get started.

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

Install all NPM dependencies:
```
npm install
```

Generate build files from the source code:
```
grunt install
```

You are ready now to browse our demos:
```
cd demo
```

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


### Lint

To check for linting errors in `src` and `types` directories:

```
npm run lint
```

To auto fix errors, run eslint for `src` and `types` directories:

```
npm run lint:fix
```

### Code Coverage Reports

To output a code coverage report in HTML:
```
grunt test:coverage
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

The source for the *JointJS* documentation (plus *Geometry* and *Vectorizer* libraries) are included in this repository; see the `docs` directory. The documentation can be built into stand-alone HTML documents like this:
```
grunt build:docs
```
The output of the above command can be found at `build/docs`.


## Contributors

<a href="https://github.com/clientIO/joint/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=clientIO/joint" />
</a>


## License

The *JointJS* library is licensed under the [Mozilla Public License 2.0](https://github.com/clientIO/joint/blob/master/LICENSE).

Copyright © 2013-2023 client IO
