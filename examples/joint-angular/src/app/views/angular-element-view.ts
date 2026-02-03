import {
    ApplicationRef,
    ComponentRef,
    createComponent,
    EnvironmentInjector,
} from '@angular/core';
import { dia } from '@joint/core';
import { NodeComponent, NodeData } from '../components/node.component';

/**
 * Custom JointJS ElementView that renders an Angular component inside the view.
 *
 * This demonstrates how to use Angular's createComponent() API to dynamically
 * render Angular components within JointJS element views.
 */
export class AngularElementView extends dia.ElementView {
    private componentRef: ComponentRef<NodeComponent> | null = null;
    private container: HTMLDivElement | null = null;

    // These will be set by the Paper configuration
    static appRef: ApplicationRef;
    static injector: EnvironmentInjector;

    override preinitialize(): void {
        // Set the root element to be a foreignObject directly
        this.tagName = 'foreignObject';
    }

    // Define the presentation attributes to include the 'data' property for change detection
    override presentationAttributes(): dia.CellView.PresentationAttributes {
        return dia.ElementView.addPresentationAttributes({
            data: dia.ElementView.Flags.UPDATE
        });
    }

    /**
     * Called when the view is rendered.
     * The root element (this.el) is already a foreignObject.
     */
    override render(): this {
        super.render();
        this.renderAngularComponent();
        return this;
    }

    /**
     * Called when the model changes.
     * We update the Angular component's inputs.
     */
    override update(): void {
        this.updateTransformation();
        this.updateAngularComponent();
    }

    /**
     * Called when the view is removed.
     * We clean up the Angular component.
     */
    override onRemove(): void {
        this.destroyAngularComponent();
        super.onRemove();
    }

    /**
     * Creates and renders the Angular component inside the foreignObject root.
     */
    private renderAngularComponent(): void {
        const { model, el } = this;
        const size = model.size();

        // Configure the foreignObject (this.el)
        el.setAttribute('width', String(size.width));
        el.setAttribute('height', String(size.height));
        el.setAttribute('class', 'angular-host');

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

    /**
     * Updates the Angular component's inputs based on the model data.
     */
    private updateAngularComponent(): void {
        if (!this.componentRef) return;

        const { model, el } = this;
        const data = model.get('data') as NodeData | undefined;
        const size = model.size();

        // Update foreignObject size (this.el is the foreignObject)
        el.setAttribute('width', String(size.width));
        el.setAttribute('height', String(size.height));

        // Update component inputs using setInput() for proper OnPush change detection
        if (data) {
            this.componentRef.setInput('id', data.id);
            this.componentRef.setInput('label', data.label);
            this.componentRef.setInput('description', data.description);
            this.componentRef.setInput('type', data.type);
            this.componentRef.setInput('isSelected', data.isSelected ?? false);
        }
    }

    /**
     * Destroys the Angular component and cleans up.
     */
    private destroyAngularComponent(): void {
        if (this.componentRef) {
            AngularElementView.appRef?.detachView(this.componentRef.hostView);
            this.componentRef.destroy();
            this.componentRef = null;
        }
    }
}

/**
 * Factory function to create the custom element view class with Angular DI context.
 */
export function createAngularElementView(
    appRef: ApplicationRef,
    injector: EnvironmentInjector
): typeof AngularElementView {
    // Set the static properties for the view class
    AngularElementView.appRef = appRef;
    AngularElementView.injector = injector;
    return AngularElementView;
}
