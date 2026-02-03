# Rendering Angular Components Inside JointJS Element Views

This tutorial explains step by step how to render Angular components inside JointJS element views using Angular's `createComponent()` API.

## Documentation Links

- **Angular**
  - [createComponent()](https://angular.dev/api/core/createComponent) - Dynamically create components
  - [ApplicationRef](https://angular.dev/api/core/ApplicationRef) - Application reference for change detection
  - [EnvironmentInjector](https://angular.dev/api/core/EnvironmentInjector) - Dependency injection context
  - [ChangeDetectionStrategy](https://angular.dev/api/core/ChangeDetectionStrategy) - OnPush change detection

- **JointJS**
  - [Custom Views](https://docs.jointjs.com/learn/features/custom-views) - Creating custom element views
  - [dia.ElementView](https://docs.jointjs.com/api/dia/ElementView) - Base element view class
  - [Highlighters](https://docs.jointjs.com/learn/features/highlighters) - Built-in highlighting system
  - [Markup](https://docs.jointjs.com/learn/features/markup) - Defining element markup

## Overview

JointJS renders elements as SVG. To embed Angular components, we use SVG's `<foreignObject>` element which allows HTML content inside SVG. We create a custom `ElementView` that:

1. Uses `foreignObject` as its root element
2. Dynamically creates Angular components using `createComponent()`
3. Manages the component lifecycle (create, update, destroy)
4. Handles two-way data binding between JointJS model and Angular component

## Step 1: Create the Angular Component

First, create a standard Angular component that will be rendered inside the JointJS element view.

```typescript
// components/node.component.ts
import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    HostBinding,
} from '@angular/core';

export interface NodeData {
    id: string;
    label: string;
    description: string;
    type: 'default' | 'process' | 'decision';
}

@Component({
    selector: 'app-node',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="node-header">{{ label }}</div>
        <div class="node-body">
            <span class="node-badge">{{ type }}</span>
            <input
                type="text"
                [ngModel]="description"
                (ngModelChange)="onDescriptionChange($event)"
            />
        </div>
    `,
})
export class NodeComponent {
    @Input() id = '';
    @Input() label = '';
    @Input() description = '';
    @Input() type: 'default' | 'process' | 'decision' = 'default';

    @Output() descriptionChanged = new EventEmitter<string>();

    @HostBinding('class')
    get hostClass(): string {
        return `node-container type-${this.type}`;
    }

    onDescriptionChange(value: string): void {
        this.descriptionChanged.emit(value);
    }
}
```

Key points:
- Use `ChangeDetectionStrategy.OnPush` for better performance
- Define `@Input()` properties for data from JointJS model
- Define `@Output()` events to communicate changes back to JointJS
- Use `@HostBinding` for dynamic class binding on the host element

## Step 2: Create the Custom Element View

Create a custom `ElementView` that renders the Angular component.

```typescript
// views/angular-element-view.ts
import {
    ApplicationRef,
    ComponentRef,
    createComponent,
    EnvironmentInjector,
} from '@angular/core';
import { dia } from '@joint/core';
import { NodeComponent, NodeData } from '../components/node.component';

export class AngularElementView extends dia.ElementView {
    private componentRef: ComponentRef<NodeComponent> | null = null;
    private container: HTMLDivElement | null = null;

    // Static properties set by factory function
    static appRef: ApplicationRef;
    static injector: EnvironmentInjector;

    // ... methods below
}
```

### Step 2.1: Set the Root Element to foreignObject

Override `preinitialize()` to set the view's root element (`this.el`) to be a `foreignObject`:

```typescript
override preinitialize(): void {
    this.tagName = 'foreignObject';
}
```

This means `this.el` will be a `<foreignObject>` element instead of the default `<g>` element.

> **Note:** The `foreignObject` doesn't have to be the root element. If you need to render SVG elements alongside the Angular component (e.g., connection ports, decorators, or custom shapes), you can keep the default `<g>` as the root and add the `foreignObject` as a child in the element's markup. This gives you the flexibility to combine SVG rendering with Angular components in the same element view.

### Step 2.2: Define Presentation Attributes for Change Detection

Override `presentationAttributes()` to trigger updates when the model's `data` property changes:

```typescript
override presentationAttributes(): dia.CellView.PresentationAttributes {
    return dia.ElementView.addPresentationAttributes({
        data: dia.ElementView.Flags.UPDATE
    });
}
```

This tells JointJS to call `update()` whenever `model.set('data', ...)` is called.

### Step 2.3: Render the Angular Component

Override `render()` to create the Angular component:

```typescript
override render(): this {
    super.render();
    this.renderAngularComponent();
    return this;
}

private renderAngularComponent(): void {
    const { model } = this;

    // Find the container div created by markup
    this.container = this.findNode('container') as HTMLDivElement;

    // Create the Angular component using createComponent
    if (AngularElementView.appRef && AngularElementView.injector) {
        this.componentRef = createComponent(NodeComponent, {
            hostElement: this.container,
            environmentInjector: AngularElementView.injector,
        });

        // Set initial inputs
        this.updateAngularComponent();

        // Subscribe to outputs
        this.componentRef.instance.descriptionChanged.subscribe(
            (description: string) => {
                model.set('data', { ...model.get('data'), description });
            }
        );

        // Attach to Angular's change detection
        AngularElementView.appRef.attachView(this.componentRef.hostView);
    }
}
```

Key points:
- Use `createComponent()` with `hostElement` to render into a specific DOM element
- Pass `environmentInjector` for dependency injection context
- Subscribe to component outputs to update the JointJS model
- Call `appRef.attachView()` to include the component in Angular's change detection

### Step 2.4: Update the Component on Model Changes

Override `update()` to sync model data to the Angular component:

```typescript
override update(): void {
    super.update();
    this.updateAngularComponent();
}

private updateAngularComponent(): void {
    if (!this.componentRef) return;

    const { model } = this;
    const data = model.get('data') as NodeData | undefined;

    // Update component inputs using setInput()
    if (data) {
        this.componentRef.setInput('id', data.id);
        this.componentRef.setInput('label', data.label);
        this.componentRef.setInput('description', data.description);
        this.componentRef.setInput('type', data.type);
    }
}
```

**Important:** Use `componentRef.setInput()` instead of directly setting properties. This properly triggers Angular's `OnPush` change detection. Direct property assignment (`instance.prop = value`) bypasses the input binding mechanism and won't trigger updates.

### Step 2.5: Clean Up on Remove

Override `onRemove()` to properly destroy the Angular component:

```typescript
override onRemove(): void {
    this.destroyAngularComponent();
    super.onRemove();
}

private destroyAngularComponent(): void {
    if (this.componentRef) {
        AngularElementView.appRef?.detachView(this.componentRef.hostView);
        this.componentRef.destroy();
        this.componentRef = null;
    }
}
```

### Step 2.6: Create a Factory Function

Create a factory function to inject Angular's DI context:

```typescript
export function createAngularElementView(
    appRef: ApplicationRef,
    injector: EnvironmentInjector
): typeof AngularElementView {
    AngularElementView.appRef = appRef;
    AngularElementView.injector = injector;
    return AngularElementView;
}
```

## Step 3: Define a Custom JointJS Element

Create a custom element class with markup that defines the HTML container. Use `dia.Element`'s generic type parameter to define the attributes interface with typed `data`:

```typescript
// models/angular-element.ts
import { dia } from '@joint/core';
import { NodeData } from '../components/node.component';

// Define attributes interface with typed data property
export interface AngularElementAttributes extends dia.Element.Attributes {
    data: NodeData;
}

// Use generic type parameter for type-safe attribute access
export class AngularElement extends dia.Element<AngularElementAttributes> {
    override defaults() {
        return {
            ...super.defaults,
            type: 'AngularElement',
            size: { width: 200, height: 120 },
            markup: [{
                tagName: 'div',
                selector: 'container',
                namespaceURI: 'http://www.w3.org/1999/xhtml',
                style: {
                    width: '100%',
                    height: '100%',
                }
            }],
            data: {
                id: '',
                label: 'Node',
                description: '',
                type: 'default',
            } as NodeData,
            attrs: {
                root: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                }
            }
        };
    }
}
```

Key points:
- Extend `dia.Element.Attributes` to define a custom attributes interface with typed `data`
- Pass the attributes interface as a generic type parameter to `dia.Element<T>`
- This provides type safety when calling `element.get('data')` or `element.set('data', ...)`
- The `markup` defines an HTML `div` container inside the foreignObject
- Use `namespaceURI: 'http://www.w3.org/1999/xhtml'` for HTML elements
- Store component data in a `data` property
- The `attrs.root` uses calc expressions to size the foreignObject
- The `type` property is used for view resolution

## Step 4: Configure the Paper

Set up the JointJS Paper to use the custom view:

```typescript
@Component({ ... })
export class AppComponent implements AfterViewInit {
    private appRef = inject(ApplicationRef);
    private injector = inject(EnvironmentInjector);

    ngAfterViewInit(): void {
        // Create the custom view class with Angular DI
        const CustomElementView = createAngularElementView(
            this.appRef,
            this.injector
        );

        // Define cell namespace
        const cellNamespace = {
            ...shapes,
            AngularElement,
        };

        // Create the paper
        this.paper = new dia.Paper({
            el: this.paperContainer.nativeElement,
            model: this.graph,
            cellViewNamespace: {
                ...cellNamespace,
                AngularElementView: CustomElementView,
            },
            // ... other options
        });
    }
}
```

Key points:
- Inject `ApplicationRef` and `EnvironmentInjector` in the component
- Call `createAngularElementView()` to create the view class with DI context
- Register the view in `cellViewNamespace` with the naming convention `{ElementType}View`

## Step 5: Create Elements and Update Data

Create elements and update their data:

```typescript
// Create an element
const node = new AngularElement({
    position: { x: 50, y: 50 },
    data: {
        id: 'node-1',
        label: 'Start',
        description: 'Beginning of the flow',
        type: 'default',
    } as NodeData,
});
this.graph.addCell(node);

// Update element data (triggers view update)
node.set('data', {
    ...node.get('data'),
    description: 'Updated description'
});
```

## Step 6: Managing Selection with Highlighters

Instead of storing selection state in the element's data, use JointJS highlighters. This keeps UI state separate from data and leverages JointJS's built-in highlighting system.

### Maintain Selection State

Keep track of selected cell IDs in your component:

```typescript
export class AppComponent {
    selection: dia.Cell.ID[] = [];
    private static readonly SELECTION_HIGHLIGHTER_ID = 'selection';
}
```

### Add/Remove Highlighters on Selection Change

Use `highlighters.addClass` to apply a CSS class to selected elements:

```typescript
import { dia, highlighters, shapes } from '@joint/core';

setSelection(cellIds: dia.Cell.ID[]): void {
    const { paper } = this;
    const highlighterId = AppComponent.SELECTION_HIGHLIGHTER_ID;

    // Remove all existing selection highlighters
    highlighters.addClass.removeAll(paper, highlighterId);

    // Update selection
    this.selection = cellIds;

    // Add highlighters to newly selected cells
    for (const id of this.selection) {
        const cellView = paper.findViewByModel(id);
        if (cellView) {
            highlighters.addClass.add(cellView, 'root', highlighterId, {
                className: 'selected'
            });
        }
    }
}
```

### Handle Click Events

Wire up the selection to pointer events:

```typescript
// Handle element selection
this.paper.on('element:pointerclick', (elementView: dia.ElementView) => {
    this.setSelection([elementView.model.id]);
});

this.paper.on('blank:pointerclick', () => {
    this.setSelection([]);
});
```

### Define Selection Styles in CSS

```css
.selected {
    outline: 2px solid #2563eb;
    outline-offset: 3px;
    outline-style: dotted;
}
```

### Benefits of Using Highlighters

- **Separation of concerns** - Selection is UI state, not data
- **Performance** - No need to trigger Angular component updates for selection changes
- **Flexibility** - Easy to support multi-selection by adding multiple IDs to the array
- **Built-in API** - JointJS highlighters handle the DOM manipulation

## Summary

The integration works through these mechanisms:

1. **foreignObject as root** - `preinitialize()` sets `tagName = 'foreignObject'` so the view's root element can contain HTML
2. **Markup with HTML namespace** - The element's markup defines an HTML container for the Angular component
3. **Dynamic component creation** - `createComponent()` renders the Angular component into a host element
4. **Change detection integration** - `appRef.attachView()` includes the component in Angular's change detection
5. **Model-to-view sync** - `presentationAttributes()` triggers `update()` on data changes, which uses `setInput()` to update the component
6. **View-to-model sync** - Component outputs are subscribed to update the JointJS model
7. **Lifecycle management** - Components are properly destroyed when elements are removed
8. **Selection with highlighters** - Use JointJS highlighters for UI state like selection instead of component inputs

This pattern allows you to use the full power of Angular components (dependency injection, reactive forms, animations, etc.) inside JointJS diagrams while keeping a clean separation between data and UI state.
