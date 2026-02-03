import {
    ApplicationRef,
    ComponentRef,
    createComponent,
    EnvironmentInjector,
    Type,
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

    // These will be set by the Paper configuration
    static appRef: ApplicationRef;
    static injector: EnvironmentInjector;

    override presentationAttributes(): dia.CellView.PresentationAttributes {
        return dia.ElementView.addPresentationAttributes({
            data: dia.ElementView.Flags.UPDATE
        });
    }


    /**
     * Called when the view is rendered.
     * We use a foreignObject to embed HTML content (the Angular component).
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
        super.update();
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
     * Creates and renders the Angular component inside a foreignObject.
     */
    private renderAngularComponent(): void {
        const { model } = this;
        const size = model.size();

        // Create foreignObject to host the Angular component
        const foreignObject = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'foreignObject'
        );
        foreignObject.setAttribute('width', String(size.width));
        foreignObject.setAttribute('height', String(size.height));
        foreignObject.setAttribute('class', 'angular-host');

        // Create a container div for the Angular component
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        foreignObject.appendChild(container);

        // Append foreignObject to the element view
        this.el.appendChild(foreignObject);

        // Create the Angular component using createComponent
        if (AngularElementView.appRef && AngularElementView.injector) {
            this.componentRef = createComponent(NodeComponent, {
                hostElement: container,
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

        const { model } = this;
        const data = model.get('data') as NodeData | undefined;
        const size = model.size();

        // Update foreignObject size
        const foreignObject = this.el.querySelector('foreignObject');
        if (foreignObject) {
            foreignObject.setAttribute('width', String(size.width));
            foreignObject.setAttribute('height', String(size.height));
        }

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
