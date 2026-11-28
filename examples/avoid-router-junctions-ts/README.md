# JointJS Avoid Router Junctions Demo

A demo of `@joint/router-avoid` with links that meet at junctions (hyperedges).

The router option `experimental_isJunction` marks the junction elements (the dots). libavoid routes the links attached to a junction as one tree and recommends where the junction should be; the router moves a junction there unless its `junctionFixed` attribute is `true`.

- Drag a junction to pin it (`junctionFixed: true`).
- Double-click a pinned junction to free it again.

> The junction options are a proof of concept. Their names and behavior will change.

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
