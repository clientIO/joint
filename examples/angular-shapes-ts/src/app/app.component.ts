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
import { dia, highlighters, shapes } from '@joint/core';
import { createAngularElementView } from './views/angular-element-view';
import { AngularElement } from './models/angular-element';
import type { NodeData } from './components/node.component';

// Define the cell namespace
const cellNamespace = {
    ...shapes,
    AngularElement,
};

@Component({
    selector: 'app-root',
    standalone: true,
    template: /* html */`
        <div class="app-container">
            <div class="toolbar">
                <h1>JointJS + Angular</h1>
                <div class="toolbar-actions">
                    <button (click)="addNode('default')">Add Node</button>
                    <button (click)="addNode('process')">Add Process</button>
                    <button (click)="addNode('decision')">Add Decision</button>
                    <button (click)="deleteSelected()" [disabled]="selection.length === 0">
                        Delete Selected
                    </button>
                </div>
            </div>
            <div #paperContainer id="paper-container"></div>
        </div>
    `,
    styles: [
        /* css */`
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
                transition: background-color 0.2s;
            }

            .toolbar button:hover:not(:disabled) {
                background-color: #2563eb;
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

    selection: dia.Cell.ID[] = [];
    private nodeCounter = 0;

    private static readonly SELECTION_HIGHLIGHTER_ID = 'selection';

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
            background: { color: '#f8fafc' },
            clickThreshold: 5,
            cellViewNamespace: {
                ...cellNamespace,
                // Use the custom Angular element view for 'AngularElement' type
                AngularElementView: CustomElementView,
            },
            interactive: {
                elementMove: true,
                linkMove: false,
            },
            defaultRouter: { name: 'rightAngle' },
            defaultConnector: { name: 'rounded' },
            defaultAnchor: {
                name: 'midSide',
                args: {
                    mode: 'horizontal',
                }
            },
        });

        // Handle element selection
        this.paper.on('element:pointerclick', (elementView: dia.ElementView) => {
            this.setSelection([elementView.model.id]);
        });

        this.paper.on('blank:pointerclick', () => {
            this.setSelection([]);
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
     * Updates the selection and applies highlighters.
     */
    setSelection(cellIds: dia.Cell.ID[]): void {
        const { paper } = this;
        const highlighterId = AppComponent.SELECTION_HIGHLIGHTER_ID;

        // Remove highlighters from previously selected cells
        for (const id of this.selection) {
            const cellView = paper.findViewByModel(id);
            if (cellView) {
                highlighters.addClass.remove(cellView, highlighterId);
            }
        }

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
        this.setSelection([node.id]);
    }

    /**
     * Deletes the currently selected elements.
     */
    deleteSelected(): void {
        for (const id of this.selection) {
            const cell = this.graph.getCell(id);
            cell?.remove();
        }
        this.selection = [];
    }
}
