# JointJS React

React core components for working with JointJS.

>  [!NOTE]
> The goal of this project is to define a minimal basis for the various React components for JointJS. Please help us shape the package by reporting issues or proposing API changes.

>  [!IMPORTANT]
> This is an early stage product. The package may contain bugs and security issues. The API is subject to change.

## Installation

```bash
yarn install jointjs @joint/react
```

## API

### Components

#### \<Paper /\>

The main component that allows you to draw nodes and edges on the canvas. In *JointJS* terminology,  you draw `cells` (`elements` and `links`) on `paper`. The component requires the `<GraphProvider />` to be its ancestor.

##### Props

| Property   |      Type      |  Description |
|:-----------|:---------------|:-------------|
| *options?* | `dia.Paper.Options` | The options of the `paper`. It's `async` by default. |
| *renderElement?* | `(dia.Element) => React.JSX.Element \| null` | A callback to render React components inside the paper element views. The components are rendered using the `React.createPortal()`. |
| *onReady?* | `(dia.Paper) => void` | A callback that is triggered after the `paper` is mounted and ready (cells may not be rendered). |
| *onEvent?* | `(dia.Paper, eventName, ...eventArgs) => void` | A callback that allows you to listen to the [dia.Paper events](https://resources.jointjs.com/docs/jointjs/v3.7/joint.html#dia.Paper.events). |
| *dataAttributes?* | `string[]` |  A list of model attributes that, if changed, will cause the `renderElement` function to be triggered. The default is `["data"]`. |
| *portal?* | `Element \| string \| (dia.ElementView) => string \| Element` | An *HTMLElement* or *SVGElement* (or a string [selector](https://resources.jointjs.com/docs/jointjs/v3.7/joint.html#dia.Cell.markup)) that serves as [portal](https://react.dev/reference/react-dom/createPortal) for rendering element's content. By default, the `portal` is selector `"portal"`. |

##### Rendering React component inside an Element view

By default, the content of the element view is rendered using *JointJS*. However, the content (_SVG_ or _HTML_) can also be rendered using React.

 ```jsx
import { dia, shapes } from 'jointjs';
import { GraphProvider, Paper } from '@joint/react';

// Assumes that the `portal` node is a foreign object descendant.
const renderHTMLElement = (element) => {
    const { label, value } = element.get('data');
    return (
        <div className="my-element">
            <h3>{label}</h3>
            <input
                type='text'
                value={value}
                onChange={(e) => element.prop('data/value', e.target.value)}
            />
        </div>
    );
};

export default function Diagram() {
    const graph = new dia.Graph({}, { cellNamespace: shapes });
    const paperProps = { /* ... */ };
    return (
        <GraphProvider graph={graph}>
            <Paper renderHTMLElement={renderHTMLElement} ...paperProps />
        </GraphProvider>
    )
}
 ```

Currently, the following **drawbacks** are known with this approach:

- content rendered with _React_ cannot be the source/target of any link (it's always a good idea to also render the SVG \<rect /> under the `portal` node).
- `<Paper />` currently replaces the default `dia.Paper.prototype.options.elementView` with a custom `ElementView` that triggers the `portal:ready` event (`(elementView: dia.ElementView, portalEl: SVGElement | HTMLElement) => void`) when the `portal` node is rendered (`onRender()` method). If you want to use custom views and you want to use `renderElement` with them, make sure you trigger the `portal:ready` event manually.

##### Paper provides context implicitly.

The `<Paper />` context provides the `paper` context to its descendants implicitly. If you need to use the `paper` context outside of the `<Paper />`, use the `<PaperProvider />`.

 ```jsx
 <GraphProvider graph={graph}>
    <Paper>
        <MySelection/>{/* component is using JointJS `paper` */}
    </Paper>
</GraphProvider>
 ```
#### \<PaperProvider /\>

The `<PaperProvider />` component is a [context provider](https://react.dev/learn/passing-data-deeply-with-context) that makes it possible to access the JointJS [paper](https://resources.jointjs.com/tutorial/graph-and-paper) outside of the `<Paper />` component. Unlike the `GraphProvider`, the `PaperProvider` is not mandatory.

```jsx
import { GraphProvider, PaperProvider, Paper } from '@joint/react';

export default function Diagram() {
    return (
        <GraphProvider graph={graph}>
            <PaperProvider>
                <Paper/>
                <MyZoomInButton/>
                <MyZoomOutButton/>
            </PaperProvider>
        </GraphProvider>
    )
}
```

#### \<GraphProvider /\>

The `<GraphProvider />` component is a [context provider](https://react.dev/learn/passing-data-deeply-with-context) that provides JointJS [graph](https://resources.jointjs.com/tutorial/graph-and-paper) to `<Paper />` components. You need use the `<GraphProvider />` in order to render the `<Paper />` component.

Here's an example of a `GraphProvider` providing a `graph` to two `papers`.
```jsx
import { dia, shapes } from 'jointjs';
import { GraphProvider, Paper } from '@joint/react';

export default function Diagram() {
    const graph = new dia.Graph({}, { cellNamespace: shapes });
    const paperProps = { /* ... */ };
    const minimapProps = {  /* ... */ };
    return (
        <GraphProvider graph={graph}>
            <Paper ...paperProps className="canvas" />
            <Paper ...minimapProps className="minimap" />
        </GraphProvider>
    )
}
```

##### Props

| Property   |      Type      |  Description |
|:-----------|:---------------|:-------------|
| *graph* | `dia.Graph` | A `graph` instance to be provided to the descendants |

### Hooks

The package exposed several custom hooks.

#### usePaper

The `usePaper` is a hook that let you use the JointJS `paper` from your component.

```jsx
import { usePaper } from '@joint/react';

export default function MyZoomInButton() {
    const paper = usePaper();
    const zoomIn = () => {
        if (!paper) return;
        const { sx, sy } = paper.scale();
        paper.scale(sx * 2, sy * 2);
    }
    return <button onClick={zoomIn}>Zoom In</button>
}
```

#### useGraph

The `useGraph` is a hook that let you use the JointJS `graph` from your component.

```jsx
import { useGraph } from '@joint/react';

export default function MyDeleteAllButton() {
    const graph = useGraph();
    const deleteAll = () => {
        if (graph && confirm("Are you sure you want to delete all content?")) {
            graph.clear();
        }
    }
    return <button onClick={deleteAll}>Delete All</button>
}
```

## What's next

The possible tasks ahead of us.

### JointJS+

Define React Components for JointJS+.

```jsx
// NOTE: This is fictional code
// It is just an example of possible API.
import { dia, mvc } from '@joint/core';
import { CommandManager } from '@joint/command-manager';
import { Paper } from '@joint/react';
import DiagramProvider from '@joint/diagram-provider';
import Toolbar from '@joint/toolbar-react';
import Stencil from '@joint/stencil-react';
import Scroller from '@joint/scroller-react';
import Inspector from '@joint/inspector-react';
import Selection from '@joint/selection-react';
import Snaplines from '@joint/snaplines-react';
import Grid from 'some-ui-lib';

export default function Diagram() {
    const graph = new dia.Graph();
    const cmd = new CommandManager({ graph });
    const selection = new mvc.Collection();
    return (
        <DiagramProvider graph={graph} commandManager={cmd} selection={selection}/>
            <Toolbar />
            <Grid>
                <Stencil />
                <Scroller />
                    <Paper >
                        <Selection />
                        <Snaplines />
                    </Paper>
                <Scroller>
                <Navigator />
            </Grid>
            <Navigator />
        <DiagramProvider />
    )
}
```

### Higher-level Components

Define user-friendly higher-level components.

```jsx
// Paper, Scroller, Toolbar, CommandManager as a single component
<Diagram preset="kitchen-sink" width={400} height={400} fitView={true} virtualRendering={true}></Diagram>
```

```jsx
// Domain-specific diagram components
<OrgChartDiagram data={adjacencyList}></OrgChartDiagram>
```

## License

[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)

Copyright © 2013-2023 client IO
