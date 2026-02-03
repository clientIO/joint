import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    HostBinding,
} from '@angular/core';
import { FormsModule } from '@angular/forms';


export interface NodeData {
    id: string;
    label: string;
    description: string;
    type: 'default' | 'process' | 'decision';
}

/**
 * Angular component rendered inside a JointJS element view.
 * This component is dynamically created using createComponent() and
 * attached to the element view's DOM.
 */
@Component({
    selector: 'app-node',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: /* html */ `
        <div class="node-header">{{ label }}</div>
        <div class="node-body">
            <span class="node-badge">{{ type }}</span>
            <input
                class="node-input"
                type="text"
                [ngModel]="description"
                (ngModelChange)="onDescriptionChange($event)"
                placeholder="Enter description..."
            />
        </div>
    `,
    styles: [
        /* css */ `
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }
        `,
    ],
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
