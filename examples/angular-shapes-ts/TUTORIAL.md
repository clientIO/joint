# Rendering Angular Components Inside JointJS Element Views

This tutorial explains step by step how to render Angular components inside JointJS element views using Angular's `createComponent()` API.

## Overview

JointJS renders elements as SVG. To embed Angular components, we use SVG's `<foreignObject>` element which allows HTML content inside SVG. We create a custom `ElementView` that:

1. Renders Angular components inside a `foreignObject` defined in the element's markup
2. Dynamically creates Angular components using `createComponent()`
3. Manages the component lifecycle (create, update, destroy)
4. Handles two-way data binding between JointJS model and Angular component

## Step 1: Create the Angular Component

First, create a standard Angular component that will be rendered inside the JointJS element view.

```typescript
// components/element.component.ts
import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    HostBinding,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ElementData {
    id: string;
    label: string;
    description: string;
    type: 'default' | 'process' | 'decision';
}

@Component({
    selector: 'app-element',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './element.component.html',
    styleUrls: ['./element.component.css'],
})
export class ElementComponent {
    @Input() id = '';
    @Input() label = '';
    @Input() description = '';
    @Input() type: 'default' | 'process' | 'decision' = 'default';

    @Output() descriptionChanged = new EventEmitter<string>();

    @HostBinding('class')
    get hostClass(): string {
        return `element-container type-${this.type}`;
    }

    onDescriptionChange(value: string): void {
        this.descriptionChanged.emit(value);
    }
}
```

The template (`element.component.html`):

```html
<div class="element-header">{{ label }}</div>
<div class="element-body">
    <span class="element-badge">{{ type }}</span>
    <input
        type="text"
        [ngModel]="description"
        (ngModelChange)="onDescriptionChange($event)"
    />
</div>
```

The styles (`element.component.css`):

```css
:host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    overflow: hidden;
}

.element-header {
    width: 100%;
    padding: 8px 12px;
    background: #1f2937;
    color: white;
    font-weight: 600;
    font-size: 14px;
}

.element-body {
    flex: 1;
    padding: 12px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
```

Key points:
- Use [`ChangeDetectionStrategy.OnPush`](https://angular.dev/api/core/ChangeDetectionStrategy) for better performance
- Define `@Input()` properties for data from JointJS model
- Define `@Output()` events to communicate changes back to JointJS
- Use `@HostBinding` for dynamic class binding on the host element

## Step 2: Create the Custom Element View

Create a [custom element view](https://docs.jointjs.com/learn/features/custom-views) by extending [`dia.ElementView`](https://docs.jointjs.com/api/dia/ElementView) to render the Angular component.

```typescript
// views/angular-element-view.ts
import {
    ApplicationRef,
    ComponentRef,
    createComponent,
    EnvironmentInjector,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { dia } from '@joint/core';
import { AngularElement } from '../models/angular-element';
import { ElementComponent } from '../components/element.component';

export class AngularElementView extends dia.ElementView<AngularElement> {
    private componentRef: ComponentRef<ElementComponent> | null = null;
    private container: HTMLDivElement | null = null;
    private subscription: Subscription | null = null;

    // Static properties set on subclasses created by the factory function
    static appRef?: ApplicationRef;
    static injector?: EnvironmentInjector;

    // Instance getters to access the subclass static properties
    protected get appRef(): ApplicationRef | undefined {
        return (this.constructor as typeof AngularElementView).appRef;
    }

    protected get injector(): EnvironmentInjector | undefined {
        return (this.constructor as typeof AngularElementView).injector;
    }

    // ... methods below
}
```

### Step 2.1: Define Presentation Attributes for Change Detection

Override `presentationAttributes()` to trigger updates when the model's `data` property changes:

```typescript
override presentationAttributes(): dia.CellView.PresentationAttributes {
    return dia.ElementView.addPresentationAttributes({
        data: dia.ElementView.Flags.UPDATE
    });
}
```

This tells JointJS to call `update()` whenever `model.set('data', ...)` is called.

### Step 2.2: Render the Angular Component

Override `render()` to create the Angular component:

```typescript
override render(): this {
    // Clean up any existing Angular component before re-rendering
    this.destroyAngularComponent();
    super.render();
    this.renderAngularComponent();
    return this;
}

private renderAngularComponent(): void {
    const { model } = this;

    // Find the container div created by markup
    this.container = this.findNode('container') as HTMLDivElement;

    // Create the Angular component using createComponent
    const { appRef, injector } = this;
    if (appRef && injector) {
        this.componentRef = createComponent(ElementComponent, {
            hostElement: this.container,
            environmentInjector: injector,
        });

        // Set initial inputs
        this.updateAngularComponent();

        // Subscribe to outputs (store subscription for cleanup)
        this.subscription = this.componentRef.instance.descriptionChanged.subscribe(
            (description: string) => {
                model.set('data', { ...model.get('data'), description });
            }
        );

        // Attach to Angular's change detection
        appRef.attachView(this.componentRef.hostView);
    }
}
```

Key points:
- Use [`createComponent()`](https://angular.dev/api/core/createComponent) with `hostElement` to render into a specific DOM element
- Pass [`EnvironmentInjector`](https://angular.dev/api/core/EnvironmentInjector) for dependency injection context
- Subscribe to component outputs to update the JointJS model
- Call [`ApplicationRef.attachView()`](https://angular.dev/api/core/ApplicationRef) to include the component in Angular's change detection

### Step 2.3: Update the Component on Model Changes

Override `update()` to sync model data to the Angular component:

```typescript
override update(): void {
    super.update();
    this.updateAngularComponent();
}

private updateAngularComponent(): void {
    if (!this.componentRef) return;

    const { model } = this;
    const data = model.get('data') as ElementData | undefined;

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

### Step 2.4: Clean Up on Remove

Override `onRemove()` to properly destroy the Angular component:

```typescript
override onRemove(): void {
    this.destroyAngularComponent();
    super.onRemove();
}

private destroyAngularComponent(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    if (this.componentRef) {
        this.appRef?.detachView(this.componentRef.hostView);
        this.componentRef.destroy();
        this.componentRef = null;
    }
}
```

### Step 2.5: Create a Factory Function

Create a factory function to inject Angular's DI context:

```typescript
export function createAngularElementView(
    appRef: ApplicationRef,
    injector: EnvironmentInjector
): typeof AngularElementView {
    // Return a new subclass to avoid global mutable state
    // when multiple papers are created
    return class extends AngularElementView {
        static override appRef = appRef;
        static override injector = injector;
    };
}
```

## Step 3: Define a Custom JointJS Element

Create a custom element class with [markup](https://docs.jointjs.com/learn/features/diagram-basics/cells/#markup) that includes a `foreignObject` containing the HTML container. Use `dia.Element`'s generic type parameter to define the attributes interface with typed `data`:

```typescript
// models/angular-element.ts
import { dia } from '@joint/core';
import { ElementData } from '../components/element.component';

// Define attributes interface with typed data property
export interface AngularElementAttributes extends dia.Element.Attributes {
    data: ElementData;
}

// Use generic type parameter for type-safe attribute access
export class AngularElement extends dia.Element<AngularElementAttributes> {
    override defaults() {
        return {
            ...super.defaults,
            type: 'AngularElement',
            size: { width: 200, height: 120 },
            markup: [{
                tagName: 'foreignObject',
                selector: 'foreignObject',
                attributes: {
                    overflow: 'visible',
                },
                children: [{
                    tagName: 'div',
                    selector: 'container',
                    namespaceURI: 'http://www.w3.org/1999/xhtml',
                    style: {
                        width: '100%',
                        height: '100%',
                    }
                }]
            }],
            data: {
                id: '',
                label: 'Element',
                description: '',
                type: 'default',
            } as ElementData,
            attrs: {
                foreignObject: {
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
- The `markup` includes a `foreignObject` element with an HTML `div` container as a child
- Using `foreignObject` in markup (not as root) preserves support for ports, highlighters, and other JointJS features
- Use `namespaceURI: 'http://www.w3.org/1999/xhtml'` for HTML elements inside foreignObject
- Store component data in a `data` property
- The `attrs.foreignObject` uses calc expressions to size the foreignObject to match the element model size `element.size()`.

## Step 4: Configure the Paper

Set up the JointJS Paper to use the custom view:

```typescript
@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
    private appRef = inject(ApplicationRef);
    private injector = inject(EnvironmentInjector);

    ngAfterViewInit(): void {
        // Create the custom view class with Angular DI
        const AngularElementView = createAngularElementView(
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
                AngularElementView,
            },
            // Allow default browser behavior on blank area clicks (e.g., blur inputs)
            preventDefaultBlankAction: false,
            // ... other options
        });
    }
}
```

Key points:
- Inject `ApplicationRef` and `EnvironmentInjector` in the component
- Call `createAngularElementView()` to create the view class with DI context
- Register the view in `cellViewNamespace` with the naming convention `{ElementType}View`
- Set `preventDefaultBlankAction: false` to allow default browser behavior (like blurring inputs) when clicking on the paper's blank area

## Step 5: Create Elements and Update Data

Create elements and update their data:

```typescript
// Create an element
const element = new AngularElement({
    position: { x: 50, y: 50 },
    data: {
        id: 'element-1',
        label: 'Start',
        description: 'Beginning of the flow',
        type: 'default',
    } as ElementData,
});
this.graph.addCell(element);

// Update element data (triggers view update)
element.set('data', {
    ...element.get('data'),
    description: 'Updated description'
});
```

## Step 6: Using Highlighters and Tools

JointJS [highlighters](https://docs.jointjs.com/learn/features/highlighters) and element tools work with Angular components as usual. Here's an example of managing selection state with highlighters.

### Maintain Selection State

Keep track of selected cell IDs in your component:

```typescript
export class AppComponent {
    selection: dia.Cell.ID[] = [];
    private static readonly SELECTION_HIGHLIGHTER_ID = 'selection';
}
```

### Add/Remove Highlighters and Tools on Selection Change

Use `highlighters.addClass` to apply a CSS class to selected cells, and add element tools:

```typescript
import { dia, elementTools, highlighters, shapes } from '@joint/core';

setSelection(cellIds: dia.Cell.ID[]): void {
    const { paper } = this;
    const highlighterId = AppComponent.SELECTION_HIGHLIGHTER_ID;

    // Remove all existing selection highlighters and tools
    highlighters.addClass.removeAll(paper, highlighterId);
    paper.removeTools();

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

    // Add element tools when a single element is selected
    if (this.selection.length === 1) {
        const cellView = paper.findViewByModel(this.selection[0]);
        if (cellView && cellView.model.isElement()) {
            const toolsView = new dia.ToolsView({
                tools: [
                    new elementTools.Connect({
                        x: '100%',
                        y: '50%',
                    }),
                ],
            });
            (cellView as dia.ElementView).addTools(toolsView);
        }
    }
}
```

### Handle Click Events

Wire up the selection to pointer events:

```typescript
// Handle cell selection
this.paper.on('cell:pointerclick', (cellView: dia.CellView) => {
    this.setSelection([cellView.model.id]);
});

this.paper.on('blank:pointerclick', () => {
    this.setSelection([]);
});
```

### Define Selection Styles in CSS

```css
/* The highlighter adds 'selected' class to the element view's root */
.selected .element-container {
    outline: 2px solid #2563eb;
    outline-offset: 3px;
}
```

### Benefits

- **Full JointJS compatibility** - Highlighters and tools work seamlessly with Angular components
- **Flexibility** - Easy to support multi-selection by adding multiple IDs to the array
- **Built-in API** - JointJS highlighters handle the DOM manipulation

## Summary

The integration works through these mechanisms:

1. **foreignObject in markup** - The element's markup includes a `foreignObject` with an HTML container, preserving support for ports, highlighters, and tools
2. **Dynamic component creation** - `createComponent()` renders the Angular component into the container element
3. **Change detection integration** - `appRef.attachView()` includes the component in Angular's change detection
4. **Model-to-view sync** - `presentationAttributes()` triggers `update()` on data changes, which uses `setInput()` to update the component
5. **View-to-model sync** - Component outputs are subscribed to update the JointJS model
6. **Lifecycle management** - Components are properly destroyed when elements are removed
7. **Full JointJS features** - Highlighters, tools, and other JointJS features work as expected

This pattern allows you to use the full power of Angular components (dependency injection, reactive forms, animations, etc.) inside JointJS diagrams.
