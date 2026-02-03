import {
    Component,
    ElementRef,
    ViewChild,
    AfterViewInit,
    OnDestroy,
    ApplicationRef,
    EnvironmentInjector,
    inject,
} from '@angular/core';
import { dia, shapes } from '@joint/core';
import {
    AngularElementView,
    createAngularElementView,
} from './views/angular-element-view';
import { NodeData } from './components/node.component';

/**
 * Custom JointJS Element shape for Angular-rendered nodes.
 */
class AngularElement extends dia.Element {
    override defaults() {
        return {
            ...super.defaults,
            type: 'angular.Element',
            size: { width: 200, height: 120 },
            markup: [],
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

// Define the cell namespace
const cellNamespace = {
    ...shapes,
    angular: {
        Element: AngularElement,
    },
};

@Component({
    selector: 'app-root',
    standalone: true,
    template: `
        <div class="app-container">
            <div class="toolbar">
                <h1>JointJS + Angular</h1>
                <div class="toolbar-actions">
                    <button (click)="addNode('default')">Add Node</button>
                    <button (click)="addNode('process')">Add Process</button>
                    <button (click)="addNode('decision')">Add Decision</button>
                    <button (click)="deleteSelected()" [disabled]="!selectedElement">
                        Delete Selected
                    </button>
                </div>
            </div>
            <div #paperContainer id="paper-container"></div>
        </div>
    `,
    styles: [
        `
            .app-container {
                display: flex;
                flex-direction: column;
                height: 100vh;
            }

            .toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 20px;
                background: #1e293b;
                color: white;
            }

            .toolbar h1 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }

            .toolbar-actions {
                display: flex;
                gap: 8px;
            }

            .toolbar button {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                background: #3b82f6;
                color: white;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s;
            }

            .toolbar button:hover:not(:disabled) {
                background: #2563eb;
            }

            .toolbar button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            #paper-container {
                flex: 1;
                overflow: hidden;
            }
        `,
    ],
})
export class AppComponent implements AfterViewInit, OnDestroy {
    @ViewChild('paperContainer') paperContainer!: ElementRef<HTMLDivElement>;

    private graph!: dia.Graph;
    private paper!: dia.Paper;
    private appRef = inject(ApplicationRef);
    private injector = inject(EnvironmentInjector);

    selectedElement: dia.Element | null = null;
    private nodeCounter = 0;

    ngAfterViewInit(): void {
        this.initializeJointJS();
        this.createInitialDiagram();
    }

    ngOnDestroy(): void {
        this.paper?.remove();
        this.graph?.clear();
    }

    /**
     * Initializes JointJS graph and paper with custom Angular element view.
     */
    private initializeJointJS(): void {
        // Create the graph
        this.graph = new dia.Graph({}, { cellNamespace });

        // Create the custom view class with Angular DI
        const CustomElementView = createAngularElementView(
            this.appRef,
            this.injector
        );

        // Create the paper with custom element view
        this.paper = new dia.Paper({
            el: this.paperContainer.nativeElement,
            model: this.graph,
            width: '100%',
            height: '100%',
            gridSize: 10,
            drawGrid: true,
            background: { color: '#f8fafc' },
            cellViewNamespace: {
                ...cellNamespace,
                // Register the custom view for our Angular element type
            },
            // Use the custom Angular element view for 'angular.Element' type
            elementView: (element: dia.Element) => {
                if (element.get('type') === 'angular.Element') {
                    return CustomElementView;
                }
                return dia.ElementView;
            },
            interactive: {
                elementMove: true,
                linkMove: false,
            },
            defaultRouter: { name: 'orthogonal' },
            defaultConnector: { name: 'rounded' },
        });

        // Handle element selection
        this.paper.on('element:pointerclick', (elementView: dia.ElementView) => {
            this.selectElement(elementView.model);
        });

        this.paper.on('blank:pointerclick', () => {
            this.selectElement(null);
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.paper.setDimensions('100%', '100%');
        });
    }

    /**
     * Creates the initial diagram with sample nodes.
     */
    private createInitialDiagram(): void {
        const node1 = new AngularElement({
            position: { x: 50, y: 50 },
            data: {
                id: 'node-1',
                label: 'Start',
                description: 'Beginning of the flow',
                type: 'default',
            } as NodeData,
        });

        const node2 = new AngularElement({
            position: { x: 300, y: 50 },
            data: {
                id: 'node-2',
                label: 'Process Data',
                description: 'Transform and validate',
                type: 'process',
            } as NodeData,
        });

        const node3 = new AngularElement({
            position: { x: 550, y: 50 },
            data: {
                id: 'node-3',
                label: 'Decision',
                description: 'Check conditions',
                type: 'decision',
            } as NodeData,
        });

        const node4 = new AngularElement({
            position: { x: 300, y: 220 },
            data: {
                id: 'node-4',
                label: 'End',
                description: 'Flow completed',
                type: 'default',
            } as NodeData,
        });

        this.nodeCounter = 4;

        // Create links
        const link1 = new shapes.standard.Link({
            source: { id: node1.id },
            target: { id: node2.id },
            attrs: {
                line: {
                    stroke: '#64748b',
                    strokeWidth: 2,
                    targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 z' },
                },
            },
        });

        const link2 = new shapes.standard.Link({
            source: { id: node2.id },
            target: { id: node3.id },
            attrs: {
                line: {
                    stroke: '#64748b',
                    strokeWidth: 2,
                    targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 z' },
                },
            },
        });

        const link3 = new shapes.standard.Link({
            source: { id: node3.id },
            target: { id: node4.id },
            attrs: {
                line: {
                    stroke: '#64748b',
                    strokeWidth: 2,
                    targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 z' },
                },
            },
        });

        this.graph.addCells([node1, node2, node3, node4, link1, link2, link3]);
    }

    /**
     * Selects an element and updates its visual state.
     */
    selectElement(element: dia.Element | null): void {
        // Deselect previous
        if (this.selectedElement) {
            const prevData = this.selectedElement.get('data') as NodeData;
            this.selectedElement.set('data', { ...prevData, isSelected: false });
        }

        this.selectedElement = element;

        // Select new
        if (element) {
            const data = element.get('data') as NodeData;
            element.set('data', { ...data, isSelected: true });
        }
    }

    /**
     * Adds a new node of the specified type.
     */
    addNode(type: 'default' | 'process' | 'decision'): void {
        this.nodeCounter++;
        const labels: Record<string, string> = {
            default: 'Node',
            process: 'Process',
            decision: 'Decision',
        };

        const node = new AngularElement({
            position: {
                x: 50 + Math.random() * 300,
                y: 50 + Math.random() * 200,
            },
            data: {
                id: `node-${this.nodeCounter}`,
                label: `${labels[type]} ${this.nodeCounter}`,
                description: '',
                type,
            } as NodeData,
        });

        this.graph.addCell(node);
        this.selectElement(node);
    }

    /**
     * Deletes the currently selected element.
     */
    deleteSelected(): void {
        if (this.selectedElement) {
            this.selectedElement.remove();
            this.selectedElement = null;
        }
    }
}
