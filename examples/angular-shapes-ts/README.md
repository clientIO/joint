# JointJS + Angular Example

This example demonstrates how to integrate JointJS with Angular using custom element views that render Angular components inside the views.

## Key Concepts

### Custom Element View with Angular Components

The main integration point is the `AngularElementView` class which extends `dia.ElementView` and uses Angular's `createComponent()` API to dynamically render Angular components inside JointJS element views.

```typescript
import { createComponent, ApplicationRef, EnvironmentInjector } from '@angular/core';
import { dia } from '@joint/core';
import { NodeComponent } from './components/node.component';

export class AngularElementView extends dia.ElementView {
    private componentRef: ComponentRef<NodeComponent> | null = null;

    static appRef: ApplicationRef;
    static injector: EnvironmentInjector;

    override preinitialize(): void {
        // Set the root element to be a foreignObject directly
        this.tagName = 'foreignObject';
    }

    override render(): this {
        super.render();

        // Find the container div created by the element's markup
        const container = this.findNode('container') as HTMLDivElement;

        // Create Angular component using createComponent
        this.componentRef = createComponent(NodeComponent, {
            hostElement: container,
            environmentInjector: AngularElementView.injector,
        });

        // Attach to Angular's change detection
        AngularElementView.appRef.attachView(this.componentRef.hostView);

        return this;
    }
}
```

### Element Model with HTML Markup

The element model defines an HTML container inside the foreignObject:

```typescript
export class AngularElement extends dia.Element {
    override defaults() {
        return {
            ...super.defaults,
            type: 'AngularElement',
            size: { width: 200, height: 120 },
            markup: [{
                tagName: 'div',
                selector: 'container',
                namespaceURI: 'http://www.w3.org/1999/xhtml',
                style: { width: '100%', height: '100%' }
            }],
            data: { id: '', label: 'Node', description: '', type: 'default' },
            attrs: {
                root: { width: 'calc(w)', height: 'calc(h)' }
            }
        };
    }
}
```

### Setting Up the Paper

Configure the Paper to use the custom element view:

```typescript
const CustomElementView = createAngularElementView(appRef, injector);

const paper = new dia.Paper({
    cellViewNamespace: {
        ...cellNamespace,
        AngularElementView: CustomElementView,
    },
    // ...
});
```

### Angular Component Communication

The Angular component can communicate back to JointJS through outputs:

```typescript
// In the view
this.componentRef.instance.descriptionChanged.subscribe((description: string) => {
    model.set('data', { ...model.get('data'), description });
});

// In the component
@Output() descriptionChanged = new EventEmitter<string>();
```

### Selection with Highlighters

Selection is managed using JointJS highlighters instead of component state:

```typescript
setSelection(cellIds: dia.Cell.ID[]): void {
    // Remove all existing selection highlighters
    highlighters.addClass.removeAll(paper, 'selection');

    this.selection = cellIds;

    // Add highlighters to newly selected cells
    for (const id of this.selection) {
        const cellView = paper.findViewByModel(id);
        if (cellView) {
            highlighters.addClass.add(cellView, 'root', 'selection', {
                className: 'selected'
            });
        }
    }
}
```

## Project Structure

```
src/
├── main.ts                           # Angular bootstrap
├── styles.css                        # Global styles
├── index.html                        # HTML entry point
└── app/
    ├── app.component.ts              # Main component with JointJS setup
    ├── components/
    │   └── node.component.ts         # Angular component rendered in views
    ├── models/
    │   └── angular-element.ts        # Custom JointJS element model
    └── views/
        └── angular-element-view.ts   # Custom JointJS view using createComponent
```

## Running the Example

```bash
# Install dependencies
yarn install

# Start development server
yarn start
```

Navigate to `http://localhost:4200/` in your browser.

## Features

- **Dynamic Angular Components**: Each JointJS element renders a fully functional Angular component
- **Two-way Binding**: Changes in the Angular component update the JointJS model
- **Component Inputs/Outputs**: Full support for Angular's input/output decorators
- **Change Detection**: Components are properly attached to Angular's change detection
- **Clean Lifecycle**: Components are destroyed when elements are removed
- **Selection with Highlighters**: UI state like selection is managed separately from data

## Requirements

- Angular 19+
- JointJS @joint/core

## Tutorial

See [tutorial.md](./tutorial.md) for a detailed step-by-step guide on how this integration works.
