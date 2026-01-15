# JointJS Offscreen Rendering

The example shows how to render diagrams offscreen.

1. **Performance optimization**
    Avoid triggering reflows and repaints in the browser while preparing or modifying the diagram. You can do all heavy computation offscreen and then inject the final version once it's ready.

2. **Exporting (e.g., to PNG, SVG)**
    Render the diagram offscreen to produce an image or export without affecting the visible page or needing to show intermediate layout changes.

3. **Server-side rendering**
    Render diagrams in a Node.js environment using tools like JSDOM and SVG polyfills, allowing generation of non-interactive diagrams on the backend (e.g., for reports, previews, or emails).

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
