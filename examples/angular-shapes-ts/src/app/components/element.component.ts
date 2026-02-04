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

/**
 * Angular component rendered inside a JointJS element view.
 * This component is dynamically created using createComponent() and
 * attached to the element view's DOM.
 */
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
