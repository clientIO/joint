# JointJS ELK Default Usage Demo

A small, fixed system diagram laid out automatically with `@joint/layout-elk`'s default behavior alone - no `exportElement`/`exportPort`/`setPortAttributes`/... callbacks, just plain ELK layout options (direction, spacing, edge routing). Containers, ports with labels, link labels, and all three link connectivity shapes (port-to-port, port-to-element, element-to-element) are laid out from the package's own defaults. Styled with Material Design, via JointJS's theme mechanism and CSS.

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
