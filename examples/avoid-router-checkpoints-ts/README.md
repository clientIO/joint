# JointJS Avoid Router Checkpoints Demo

A demo of `@joint/router-avoid` with routes that pass through checkpoints.

The router option `experimental_checkpointsAttribute: 'checkpoints'` makes libavoid route each link through the points in its `checkpoints` attribute, in order. The router still writes the computed route to `vertices`.

`linkTools.Vertices({ attribute: 'checkpoints' })` edits `checkpoints` instead of `vertices` (the `attribute` option is a proof of concept too):

- Click a link to add a checkpoint.
- Drag a checkpoint to move it.
- Double-click a checkpoint to remove it.
- Right-click a checkpoint to cycle the direction the route passes it in (`arrival` / `departure`: the side the route comes from and the side it leaves toward).

> The checkpoints option is a proof of concept. Its name and behavior will change.

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
