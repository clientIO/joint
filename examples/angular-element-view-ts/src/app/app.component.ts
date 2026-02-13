import type {
    ElementRef,
    AfterViewInit,
    OnDestroy } from '@angular/core';
import {
    Component,
    ViewChild,
    ApplicationRef,
    EnvironmentInjector,
    inject,
} from '@angular/core';
import { dia, elementTools, highlighters, shapes } from '@joint/core';
import { createAngularElementView } from './views/angular-element-view';
import { AngularElement } from './models/angular-element';
import { Link } from './models/link';

// Define the cell namespace
const cellNamespace = {
    ...shapes,
    AngularElement,
    Link,
};

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
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
        const AngularElementView = createAngularElementView(
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
                AngularElementView,
            },
            interactive: {
                elementMove: true,
                linkMove: false,
            },
            linkPinning: false,
            multiLinks: false,
            // Allow default browser behavior (e.g. blur inputs) when clicking
            // on the paper's blank area or on element/link views
            preventDefaultBlankAction: false,
            preventDefaultViewAction: false,
            defaultLink: () => new Link(),
            defaultRouter: { name: 'rightAngle' },
            defaultConnector: { name: 'rounded' },
            defaultAnchor: {
                name: 'midSide',
                args: {
                    useModelGeometry: true,
                    mode: 'horizontal',
                }
            },
            highlighting: {
                connecting: {
                    name: 'addClass',
                    options: {
                        className: 'link-target',
                    },
                }
            }
        });

        // Handle element selection
        this.paper.on('cell:pointerclick', (cellView: dia.CellView) => {
            this.setSelection([cellView.model.id]);
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
                id: 'element-1',
                label: 'Start',
                description: 'Beginning of the flow',
                type: 'default',
            },
        });

        const node2 = new AngularElement({
            position: { x: 300, y: 50 },
            data: {
                id: 'element-2',
                label: 'Process Data',
                description: 'Transform and validate',
                type: 'process',
            },
        });

        const node3 = new AngularElement({
            position: { x: 550, y: 50 },
            data: {
                id: 'element-3',
                label: 'Decision',
                description: 'Check conditions',
                type: 'decision',
            },
        });

        const node4 = new AngularElement({
            position: { x: 300, y: 220 },
            data: {
                id: 'element-4',
                label: 'End',
                description: 'Flow completed',
                type: 'default',
            },
        });

        this.nodeCounter = 4;

        // Create links
        const link1 = new Link({
            source: { id: node1.id },
            target: { id: node2.id },
        });

        const link2 = new Link({
            source: { id: node2.id },
            target: { id: node3.id },
        });

        const link3 = new Link({
            source: { id: node3.id },
            target: { id: node4.id },
        });

        this.graph.addCells([node1, node2, node3, node4, link1, link2, link3]);
    }

    /**
     * Updates the selection and applies highlighters.
     */
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
                            x: 'calc(w + 15)',
                            y: 'calc(h / 2)',
                        }),
                    ],
                });
                (cellView as dia.ElementView).addTools(toolsView);
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
                id: `element-${this.nodeCounter}`,
                label: `${labels[type]} ${this.nodeCounter}`,
                description: '',
                type,
            },
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
