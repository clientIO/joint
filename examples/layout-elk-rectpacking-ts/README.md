# JointJS ELK Rectangle Packing Demo

A storage drive's folders and files packed with ELK's rectangle packing algorithm (`'elk.algorithm': 'rectpacking'`) via `@joint/layout-elk`. Every folder is a container, every file a tile whose area is proportional to the file's size. Each folder packs its own files, then the folders are packed together, so the whole board stays close to the chosen aspect ratio. The toolbar changes the `rectpacking` options and the layout re-runs with an animated transition:

- **Optimization goal** - `elk.rectpacking.widthApproximation.optimizationGoal` (`MAX_SCALE_DRIVEN`, `ASPECT_RATIO_DRIVEN`, `AREA_DRIVEN`).
- **Aspect ratio** - `elk.aspectRatio`, the width/height the packing aims for.
- **White space** - `elk.rectpacking.whiteSpaceElimination.strategy`, which stretches tiles to fill the gaps left in a folder. `@joint/layout-elk` applies ELK-computed sizes to containers only, so the example's own `setElementAttributes` callback applies them to the tiles too. Its `exportElement` callback hands ELK each tile's original size, so a stretched tile doesn't keep growing from one layout to the next.
- **Order by size** - `elk.rectpacking.orderBySize`. Otherwise files are packed in model order, which **Shuffle** changes.

ELK doesn't pass layout options down the hierarchy, so `exportElement` also sets `rectpacking` (and its options) on every folder. `elk.hierarchyHandling: 'SEPARATE_CHILDREN'` overrides the package's default `INCLUDE_CHILDREN`, which only matters for edges crossing a container's boundary.

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
