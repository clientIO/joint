# JointJS Element Geometry Demo

The shapes of the elements (a rhombus, an ellipse, a rectangle) and of their circular ports are defined on the model, with the `getElementGeometry` option of `dia.Graph`. The demo uses the geometry in two places:

- **Rendering.** A custom connection point calls `element.getGeometryIntersection()` and `element.getPortGeometryIntersection()`, so a link ends on the boundary of the shape without measuring the DOM.
- **Model.** `link.getSourcePoint()`, `link.getTargetPoint()` and `link.getBBox()` end on the boundary too. The checkbox draws them over the diagram.

Drag or rotate the elements (the rotated rhombus shows that the rotation is applied) to see both follow.

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
