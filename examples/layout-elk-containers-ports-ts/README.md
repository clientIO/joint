# JointJS ELK Containers & Ports Demo

A fixed (non-random) web platform reference architecture laid out automatically with `@joint/layout-elk`: nested containers ("Client Layer" > "Edge", "Core Services" > "Data Layer", "Observability") grouping services that connect through ports, plus a couple of links connecting containers directly - including one that crosses from one container into another. Styled with Material Design, via JointJS's theme mechanism and CSS.

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
