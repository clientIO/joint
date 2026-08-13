# JointJS Avoid Router Demo

<img width="709" alt="image" src="https://github.com/clientIO/joint/assets/3967880/acb322cb-8913-429b-aaa9-87322f3aad9a">

A demo of `@joint/router-avoid`, showing three graphs, one per tab:

- **Simple graph** / **Simple graph extra** - libavoid running on the main thread.
- **Large graph** - libavoid running inside a Web Worker (`useWorker: true`), for a larger graph where routing off the main thread keeps the UI responsive.

## Setup

Use Yarn to run this demo.

You need to build *JointJS* first. Navigate to the root folder and run:
```bash
yarn install
yarn run build
```

Navigate to this directory, then run:
```bash
yarn start
```

## License

The *JointJS* library is licensed under the [Mozilla Public License 2.0](https://github.com/clientIO/joint/blob/master/LICENSE).

Copyright © 2013-2026 client IO

The *Libavoid-js* library is licensed under the [LGPL-2.1 license](https://github.com/Aksem/libavoid-js?tab=LGPL-2.1-1-ov-file#readme).
