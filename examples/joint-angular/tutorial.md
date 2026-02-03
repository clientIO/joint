# Rendering Angular Components Inside JointJS Element Views

This tutorial explains step by step how to render Angular components inside JointJS element views using Angular's `createComponent()` API.

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
    isSelected?: boolean;
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
    @Input() isSelected = false;

    @Output() descriptionChanged = new EventEmitter<string>();

    @HostBinding('class')
    get hostClass(): string {
        const classes = ['node-container', `type-${this.type}`];
        if (this.isSelected) {
            classes.push('selected');
        }
        return classes.join(' ');
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
    const { model, el } = this;
    const size = model.size();

    // Configure the foreignObject (this.el)
    el.setAttribute('width', String(size.width));
    el.setAttribute('height', String(size.height));

    // Create a container div for the Angular component
    this.container = document.createElement('div');
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    el.appendChild(this.container);

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
    this.updateTransformation();
    this.updateAngularComponent();
}

private updateAngularComponent(): void {
    if (!this.componentRef) return;

    const { model, el } = this;
    const data = model.get('data') as NodeData | undefined;
    const size = model.size();

    // Update foreignObject size
    el.setAttribute('width', String(size.width));
    el.setAttribute('height', String(size.height));

    // Update component inputs using setInput()
    if (data) {
        this.componentRef.setInput('id', data.id);
        this.componentRef.setInput('label', data.label);
        this.componentRef.setInput('description', data.description);
        this.componentRef.setInput('type', data.type);
        this.componentRef.setInput('isSelected', data.isSelected ?? false);
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

Create a custom element class with empty markup (since the view handles rendering):

```typescript
class AngularElement extends dia.Element {
    override defaults() {
        return {
            ...super.defaults,
            type: 'AngularElement',
            size: { width: 200, height: 120 },
            markup: [],  // Empty - view handles rendering
            data: {
                id: '',
                label: 'Node',
                description: '',
                type: 'default',
                isSelected: false,
            } as NodeData,
        };
    }
}
```

Key points:
- Set `markup: []` since the custom view handles all rendering
- Store component data in a `data` property
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
node.set('data', { ...node.get('data'), isSelected: true });
```

## Summary

The integration works through these mechanisms:

1. **foreignObject as root** - `preinitialize()` sets `tagName = 'foreignObject'` so the view's root element can contain HTML
2. **Dynamic component creation** - `createComponent()` renders the Angular component into a host element
3. **Change detection integration** - `appRef.attachView()` includes the component in Angular's change detection
4. **Model-to-view sync** - `presentationAttributes()` triggers `update()` on data changes, which uses `setInput()` to update the component
5. **View-to-model sync** - Component outputs are subscribed to update the JointJS model
6. **Lifecycle management** - Components are properly destroyed when elements are removed

This pattern allows you to use the full power of Angular components (dependency injection, reactive forms, animations, etc.) inside JointJS diagrams.
