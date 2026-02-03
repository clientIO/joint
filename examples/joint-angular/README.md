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

    override render(): this {
        super.render();

        // Create foreignObject to host Angular component
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        const container = document.createElement('div');
        foreignObject.appendChild(container);
        this.el.appendChild(foreignObject);

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

### Setting Up the Paper

Configure the Paper to use the custom element view for specific element types:

```typescript
const CustomElementView = createAngularElementView(appRef, injector);

const paper = new dia.Paper({
    // ...
    elementView: (element: dia.Element) => {
        if (element.get('type') === 'angular.Element') {
            return CustomElementView;
        }
        return dia.ElementView;
    },
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

## Requirements

- Angular 19+
- JointJS @joint/core
