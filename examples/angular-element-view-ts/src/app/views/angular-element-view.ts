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

/**
 * Custom JointJS ElementView that renders an Angular component inside a foreignObject.
 *
 * This demonstrates how to use Angular's createComponent() API to dynamically
 * render Angular components within JointJS element views. The foreignObject is
 * defined in the element's markup, keeping the default SVG group as the root
 * to support ports, highlighters, and other JointJS features.
 */
export class AngularElementView extends dia.ElementView<AngularElement> {
    private componentRef: ComponentRef<ElementComponent> | null = null;
    private container: HTMLDivElement | null = null;
    private subscription: Subscription | null = null;

    // Custom flag for data changes to avoid full update() overhead on every keystroke
    static DATA_FLAG: string = 'DATA';

    // These are set on subclasses created by createAngularElementView()
    // to avoid global mutable state when multiple papers/apps are created
    static appRef?: ApplicationRef;
    static injector?: EnvironmentInjector;

    // Get the static properties from the actual class (subclass)
    protected get appRef(): ApplicationRef | undefined {
        return (this.constructor as typeof AngularElementView).appRef;
    }

    protected get injector(): EnvironmentInjector | undefined {
        return (this.constructor as typeof AngularElementView).injector;
    }

    // Map 'data' changes to a custom flag to avoid full update() on every keystroke
    override presentationAttributes(): dia.CellView.PresentationAttributes {
        return dia.ElementView.addPresentationAttributes({
            data: AngularElementView.DATA_FLAG
        });
    }

    // Handle the custom DATA flag separately from the standard UPDATE flag
    override confirmUpdate(flag: number, options: { [key: string]: unknown }): number {
        let flags = super.confirmUpdate(flag, options);
        if (this.hasFlag(flags, AngularElementView.DATA_FLAG)) {
            this.updateAngularComponent();
            flags = this.removeFlag(flags, AngularElementView.DATA_FLAG);
        }
        return flags;
    }

    /**
     * Called when the view is rendered.
     * Creates the Angular component inside the foreignObject's container.
     */
    override render(): this {
        // Clean up any existing Angular component before re-rendering
        // to prevent memory leaks if render() is called multiple times
        this.destroyAngularComponent();
        super.render();
        this.renderAngularComponent();
        return this;
    }

    /**
     * Called when the model attrs/size changes.
     * We also update the Angular component's inputs.
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
        this.container = this.findNode('container') as HTMLDivElement | null;
        if (!this.container) {
            throw new Error('AngularElementView: "container" node not found in markup');
        }

        // Create the Angular component using createComponent
        const { appRef, injector } = this;
        if (appRef && injector) {
            this.componentRef = createComponent(ElementComponent, {
                hostElement: this.container,
                environmentInjector: injector,
            });

            // Attach to Angular's change detection tree first
            appRef.attachView(this.componentRef.hostView);

            // Set initial inputs and trigger change detection
            this.updateAngularComponent();
            this.componentRef.changeDetectorRef.detectChanges();

            // Subscribe to outputs
            this.subscription = this.componentRef.instance.descriptionChanged.subscribe(
                (description: string) => {
                    model.set('data', { ...model.get('data'), description });
                }
            );
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
            this.appRef?.detachView(this.componentRef.hostView);
            this.componentRef.destroy();
            this.componentRef = null;
        }
    }
}

/**
 * Factory function to create a custom element view class with Angular DI context.
 * Returns a new subclass to avoid global mutable state when multiple papers are created.
 */
export function createAngularElementView(
    appRef: ApplicationRef,
    injector: EnvironmentInjector
): typeof AngularElementView {
    return class extends AngularElementView {
        static override appRef = appRef;
        static override injector = injector;
    };
}
