# JointJS Directed Graph Layout with Fixed Ranks Demo

A small release pipeline laid out with `@joint/layout-directed-graph` and `ranker: 'fixed'`. The application gives every element its rank (`exportElement()` returns it as `rank`) and the layout only orders and positions the elements within the ranks. The demo shows a cluster, an empty rank (resize it with `emptyRankSize`), a backward link (routed through the ranks) and a link within one rank (left out of the layout).

## Setup

Use Yarn to run this demo.

You need to build *JointJS* first. Navigate to the root folder and run:
```bash
yarn install
yarn run build
```

Navigate to this directory, then run:
```bash
yarn dev
```

Then open the URL printed in the terminal (usually `http://localhost:5173`). `yarn build`
makes a production build in `dist/`, `yarn preview` serves it.

## License

The *JointJS* library is licensed under the [Mozilla Public License 2.0](https://github.com/clientIO/joint/blob/master/LICENSE).

Copyright © 2013-2026 client IO
