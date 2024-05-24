# JointJS - JavaScript diagramming library powering exceptional UIs

[![Build Status](https://app.travis-ci.com/clientIO/joint.svg?token=YC3doXGarvYwgzfqe9zy&branch=master)](https://app.travis-ci.com/clientIO/joint)
[![Total Discussion](https://img.shields.io/github/discussions/badges/shields)](https://github.com/clientIO/joint/discussions)
[![NPM Version](https://img.shields.io/npm/v/jointjs)](https://www.npmjs.com/package/jointjs)
[![NPM License](https://img.shields.io/npm/l/jointjs?color=blue)](https://github.com/clientIO/joint/blob/master/LICENSE)

[JointJS](https://jointjs.com) is a tested and proven *JavaScript*/*Typescript* diagramming library that helps developers and companies of any size build visual and No-Code/Low-Code applications faster and with confidence. It’s a flexible tool from which a wide range of UIs can be created (interactive diagramming applications, drawing tools, data visualizations, UIs for monitoring systems, and many more). It can become the foundational layer of your next application and help you bring your idea to market in days, not months or years.

![Use Cases](https://user-images.githubusercontent.com/3967880/200360293-808f148c-32af-4f46-bec1-b4ae4e1592a0.jpg)

Further **information**, **examples** and **documentation** can be found at [jointjs.com](https://jointjs.com).

:1234: Get started with [tutorials](https://docs.jointjs.com).

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
* [git](https://git-scm.com/)
* [yarn](https://yarnpkg.com/getting-started/install)

Make sure that you are using Yarn version >= 2.0.0, so that you have access to [Yarn workspace ranges](https://yarnpkg.com/features/workspaces#workspace-ranges-workspace) functionality. If you are using [Volta](https://volta.sh/), it will automatically read this restriction from `package.json`.

### Setup

Clone this git repository:
```bash
git clone https://github.com/clientIO/joint.git
```

Navigate to the `joint` directory:
```bash
cd joint
```

Install all dependencies:
```bash
yarn install
```

Generate distribution files from the source code:
```bash
yarn run dist
```

You are now ready to browse our example applications, which combine functionality from multiple JointJS packages:
```bash
cd examples
```
Refer to each application's `README.md` file for additional instructions.

You can also browse the demo applications of our JointJS Core package:
```bash
cd packages/joint-core/demo
```
Most demos can be run by simply opening the `index.html` file in your browser. Some demos have additional instructions, which you can find in their respective `README.md` files.

### Tests

To run all tests:
```bash
yarn run test
```

To run only the server-side tests:
```bash
yarn run test-server
```

To run only the client-side tests:
```bash
yarn run test-client
```

To run only TypeScript tests:
```bash
yarn run test-ts
```

### Lint

To check for linting errors in `src` and `types` directories:
```bash
yarn run lint
```

To auto fix errors, run eslint for `src` and `types` directories:
```bash
yarn run lint-fix
```

### Code Coverage Reports

To output a code coverage report in HTML:
```bash
yarn run test-coverage
```

To output a code coverage report in [lcov format](http://ltp.sourceforge.net/coverage/lcov/geninfo.1.php):
```bash
yarn run test-coverage-lcov
```

The output for all unit tests will be saved in the `packages/joint-core/coverage` directory.

## Documentation

The source files for the *JointJS* documentation (plus *Geometry* and *Vectorizer* libraries) are included in this repository; see the `packages/joint-core/docs` directory. The documentation can be built into stand-alone HTML documents like this:
```bash
yarn run build-docs
```
The output of the above command can be found at `packages/joint-core/build/docs`.

## Contributors

<a href="https://github.com/clientIO/joint/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=clientIO/joint" />
</a>

## License

The *JointJS* library is licensed under the [Mozilla Public License 2.0](https://github.com/clientIO/joint/blob/master/LICENSE).

Copyright © 2013-2024 client IO
