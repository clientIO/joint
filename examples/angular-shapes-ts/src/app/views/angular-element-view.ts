import {
    ApplicationRef,
    ComponentRef,
    createComponent,
    EnvironmentInjector,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { dia } from '@joint/core';
import { AngularElement } from '../models/angular-element';
import { NodeComponent } from '../components/node.component';

/**
 * Custom JointJS ElementView that renders an Angular component inside a foreignObject.
 *
 * This demonstrates how to use Angular's createComponent() API to dynamically
 * render Angular components within JointJS element views. The foreignObject is
 * defined in the element's markup, keeping the default SVG group as the root
 * to support ports, highlighters, and other JointJS features.
 */
export class AngularElementView extends dia.ElementView<AngularElement> {
    private componentRef: ComponentRef<NodeComponent> | null = null;
    private container: HTMLDivElement | null = null;
    private subscription: Subscription | null = null;

    // These will be set by the Paper configuration via createAngularElementView()
    static appRef?: ApplicationRef;
    static injector?: EnvironmentInjector;

    // Define the presentation attributes to include the 'data' property for change detection
    override presentationAttributes(): dia.CellView.PresentationAttributes {
        return dia.ElementView.addPresentationAttributes({
            data: dia.ElementView.Flags.UPDATE
        });
    }

    /**
     * Called when the view is rendered.
     * Creates the Angular component inside the foreignObject's container.
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
     * Creates and renders the Angular component inside the foreignObject root.
     */
    private renderAngularComponent(): void {
        const { model } = this;

        // Find the container div for the Angular component
        this.container = this.findNode('container') as HTMLDivElement;

        // Create the Angular component using createComponent
        if (AngularElementView.appRef && AngularElementView.injector) {
            this.componentRef = createComponent(NodeComponent, {
                hostElement: this.container,
                environmentInjector: AngularElementView.injector,
            });

            // Set initial inputs and trigger change detection
            this.updateAngularComponent();
            this.componentRef.changeDetectorRef.detectChanges();

            // Subscribe to outputs
            this.subscription = this.componentRef.instance.descriptionChanged.subscribe(
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

        const data = this.model.get('data');

        // Update component inputs using setInput() for proper OnPush change detection
        if (data) {
            this.componentRef.setInput('id', data.id);
            this.componentRef.setInput('label', data.label);
            this.componentRef.setInput('description', data.description);
            this.componentRef.setInput('type', data.type);
        }
    }

    /**
     * Destroys the Angular component and cleans up.
     */
    private destroyAngularComponent(): void {
        this.subscription?.unsubscribe();
        this.subscription = null;
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
