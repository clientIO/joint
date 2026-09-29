# JointJS ELK Interactive Flowchart Demo

A top-to-bottom login flowchart - with two genuine cycles (retry loops) - laid out automatically with `@joint/layout-elk`. Click a step's top "+" to give it another input, or its bottom "+" to give it another output; click any of its unconnected output ports to grow a new, connected step from it, or drag a link between two unconnected ports to wire two existing steps together directly. Drag one step onto another step in the same layer (e.g. a decision's outcomes) to reorder them - a semitransparent floating copy follows the pointer while you drag, with nothing in the graph itself moving until you drop, at which point the graph re-lays out for real (ELK reordering ports as needed to keep crossings down, and respecting the new order).

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
