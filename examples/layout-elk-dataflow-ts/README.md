# JointJS ELK Dataflow Demo

A Ptolemy II dataflow model laid out automatically with `@joint/layout-elk`: actors connected through ports on fixed sides, in a fixed order, and three composite actors holding a sub-model of their own. ELK leaves room for the actor labels and reports the junction points where links merge. Zooming out hides the sub-models and labels.

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
