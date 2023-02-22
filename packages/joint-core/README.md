# JointJS Core

The base of the [JointJS](https://www.jointjs.com/) library.

## Development Environment

If you want to work on *JointJS* locally, use the following guidelines to get started.

### Dependencies

Make sure you have the following dependencies installed on your system:
* [Node.js](https://nodejs.org/)
* [grunt-cli](http://gruntjs.com/using-the-cli)
* git

### Setup

Clone the root git repository:
```
git clone https://github.com/clientIO/joint.git
```

Change into the root joint directory:
```
cd joint
```

Install all NPM dependencies:
```
npm install
```

Generate build files from the source code:
```
npm run grunt:install --workspaces --if-present
```

You are now ready to browse our demos:
```
cd packages/joint-core/demo
```
Most demos can be run by simply opening the `index.html` file in your browser. Some demos have additional instructions, which you can find in their respective `README.txt` files.

## License

The *JointJS* library is licensed under the [Mozilla Public License 2.0](https://github.com/clientIO/joint/blob/master/LICENSE).

Copyright © 2013-2023 client IO
