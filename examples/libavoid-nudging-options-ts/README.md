# JointJS Libavoid Nudging Options Demo

A demo of three libavoid routing options that change how links which share a port are drawn:

- `nudgeSharedPathsWithCommonEndPoint` - splits the links that leave one port into parallel lines instead of one trunk that branches.
- `nudgeOrthogonalSegmentsConnectedToShapes` - moves the link ends apart, beside the port. It only acts on links that already run side by side, so on its own it changes nothing in this demo.
- `nudgeOrthogonalTouchingColinearSegments` - nudges apart colinear segments that only touch at their ends.

Each option has an ON / OFF button, and the links are routed again when an option or an element position changes. The status line counts the link ends that the route does not attach to the center of their port.

The router is set up as `@joint/router-avoid` sets up libavoid (orthogonal routing, shape buffer distance 10, ideal nudging distance 5, the unifying nudging preprocessing step, every element an obstacle with a pin at its center and one per port), and the routes are applied to the links the same way: the ends become anchors relative to the ports, the points in between become vertices. `@joint/router-avoid` turns the first two options on and the third off. Unlike `@joint/router-avoid`, the demo has no fallback for a link libavoid cannot route; every link in it can be routed.

Open `index.html?ends=1&sharedPaths=1&touchingColinear=0` to start with given options.

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
