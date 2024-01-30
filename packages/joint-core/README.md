# JointJS Core

The base of the *[JointJS](https://www.jointjs.com/)* library.

## Development Environment

If you want to work on *JointJS* locally, use the following guidelines to get started.

### Dependencies

Make sure you have the following dependencies installed on your system:
* [Node.js](https://nodejs.org/)
* [grunt-cli](http://gruntjs.com/using-the-cli)
* [git](https://git-scm.com/)
* [yarn](https://yarnpkg.com/getting-started/install)

### Setup

Clone the root git repository:
```bash
git clone https://github.com/clientIO/joint.git
```

Navigate to the root `joint` directory:
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

You are now ready to browse our demos:
```bash
cd packages/joint-core/demo
```
Most demos can be run by simply opening the `index.html` file in your browser. Some demos have additional instructions, which you can find in their respective `README.md` files.

## License

The *JointJS* library is licensed under the [Mozilla Public License 2.0](https://github.com/clientIO/joint/blob/master/LICENSE).

Copyright © 2013-2024 client IO
