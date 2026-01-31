import { shapes, util, dia, anchors } from '@joint/core';
import './styles.css';

const HEADER_HEIGHT = 60;
const SWIMLANE_PADDING = 5;
const SWIMLANE_HEADER_HEIGHT = 45;
const BUTTON_BORDER_OFFSET = 8;
const BUTTON_SIZE = SWIMLANE_HEADER_HEIGHT - BUTTON_BORDER_OFFSET * 2;
const POOL_MARGIN = 50;
const SIGNS = {
    "+": `M ${BUTTON_SIZE / 2} 4 V ${BUTTON_SIZE - 4} M 4 ${BUTTON_SIZE / 2} H ${BUTTON_SIZE - 4
        }`,
    "-": `M 4 ${BUTTON_SIZE / 2} H ${BUTTON_SIZE - 4}`
};
const SWIMLANE_SIZE = {
    width: 450,
    height: 1750,
    collapsedWidth: 50
};
const SWIMLANES = [
    {
        title: "Senate",
        color: "#D33653",
        text: "#FFF",
        mainColor: "#E2798C"
    },
    {
        title: "Committee",
        color: "#433E3F",
        text: "#FFF",
        mainColor: "#7F7677"
    },
    {
        title: "House of Representatives",
        color: "#318787",
        text: "#FFF",
        mainColor: "#78CECE"
    },
    {
        title: "President",
        color: "#997C48",
        text: "#FFF",
        mainColor: "#CBB690"
    }
];

class UMLPool extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: "UMLPool",
            attrs: {
                body: {
                    fill: "transparent",
                    width: "calc(w)",
                    height: "calc(h)"
                },
                header: {
                    stroke: "#333",
                    strokeWidth: 2,
                    fill: "#333",
                    height: HEADER_HEIGHT,
                    width: "calc(w)"
                },
                label: {
                    fill: "#fff",
                    fontSize: HEADER_HEIGHT * 0.7,
                    fontWeight: "bold",
                    textVerticalAnchor: "middle",
                    textAnchor: "middle",
                    fontFamily: "sans-serif",
                    x: "calc(w / 2)",
                    y: HEADER_HEIGHT / 2,
                    textWrap: {
                        ellipsis: true,
                        width: "calc(w - 20)",
                        maxLineCount: 1
                    }
                }
            }
        };
    }

    preinitialize(...args) {
        this.markup = util.svg`
            <rect @selector="body" />
            <rect @selector="header" />
            <text @selector="label" />
        `;
    }

    layoutSwimlanes(swimlanes) {
        let x = 0;
        swimlanes.forEach((swimlane) => {
            swimlane.updateChildrenVisibility();
            swimlane.position(x, HEADER_HEIGHT, { deep: true, parentRelative: true });
            x += swimlane.size().width;
        });
        this.fitEmbeds({ padding: { top: HEADER_HEIGHT } });
    }
}

class UMLSwimlane extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: "UMLSwimlane",
            collapsed: false,
            expandedHeight: null,
            attrs: {
                body: {
                    fill: "transparent",
                    stroke: "#333",
                    strokeWidth: 2,
                    width: "calc(w)",
                    height: "calc(h)"
                },
                header: {
                    stroke: "#333",
                    height: SWIMLANE_HEADER_HEIGHT,
                    width: "calc(w)"
                },
                divider: {
                    stroke: "#333",
                    strokeWidth: 2,
                    d: `M 0 ${SWIMLANE_HEADER_HEIGHT} H calc(w)`
                },
                label: {
                    text: "Swimlane",
                    fill: "#333",
                    fontSize: HEADER_HEIGHT * 0.4,
                    fontWeight: "bold",
                    textVerticalAnchor: "middle",
                    textAnchor: "middle",
                    fontFamily: "sans-serif",
                    x: "calc(w / 2)"
                },
                buttonGroup: {
                    transform: `translate(calc(w - ${BUTTON_SIZE + BUTTON_BORDER_OFFSET
                        }), ${BUTTON_BORDER_OFFSET})`
                },
                button: {
                    fill: "white",
                    stroke: "#333",
                    width: BUTTON_SIZE,
                    height: BUTTON_SIZE,
                    cursor: "pointer",
                    event: "swimlane:collapse"
                },
                buttonSign: {
                    stroke: "#333",
                    strokeWidth: 2,
                    pointerEvents: "none"
                }
            }
        };
    }

    preinitialize(...args) {
        this.markup = util.svg`
            <rect @selector="body" />
            <rect @selector="header" />
            <path @selector="divider" />
            <text @selector="label" />
            <g @selector="buttonGroup">
                <rect @selector="button" />
                <path @selector="buttonSign" />
            </g>
        `;
    }

    constructor(...args) {
        super(...args);
        this.on("change:collapsed", this.onCollapseChange, this);
        this.onCollapseChange();
    }

    toggleCollapse() {
        this.set("collapsed", !this.isCollapsed());
    }

    isCollapsed() {
        return Boolean(this.get("collapsed"));
    }

    onCollapseChange() {
        const collapsed = this.isCollapsed();
        const width = collapsed
            ? SWIMLANE_SIZE.collapsedWidth
            : SWIMLANE_SIZE.width;
        this.resize(width, SWIMLANE_SIZE.height);
        this.attr({
            buttonSign: { d: collapsed ? SIGNS["+"] : SIGNS["-"] },
            label: collapsed
                ? {
                    writingMode: "tb",
                    textAnchor: "start",
                    y: SWIMLANE_HEADER_HEIGHT + SWIMLANE_PADDING
                }
                : {
                    writingMode: "lr",
                    textAnchor: "middle",
                    y: SWIMLANE_HEADER_HEIGHT / 2
                }
        });
    }

    updateChildrenVisibility() {
        const collapsed = this.isCollapsed();
        this.getEmbeddedCells().forEach((child) => child.set("hidden", collapsed));
    }
}

class UMLElement extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            hidden: false
        };
    }

    isHidden() {
        return Boolean(this.get("hidden"));
    }

    static isUMLElement(shape) {
        return shape instanceof UMLElement;
    }
}

class UMLInitialNode extends UMLElement {
    defaults() {
        return {
            ...super.defaults(),
            type: "UMLInitialNode",
            size: { width: 30, height: 30 },
            attrs: {
                body: {
                    fill: "#333",
                    stroke: "black",
                    strokeWidth: 2,
                    cx: "calc(0.5 * w)",
                    cy: "calc(0.5 * h)",
                    r: "calc(0.5 * w)"
                }
            }
        };
    }

    preinitialize() {
        this.markup = util.svg`
            <circle @selector="body" />
        `;
    }
}

class UMLActivity extends UMLElement {
    defaults() {
        return {
            ...super.defaults(),
            type: "UMLActivity",
            size: { width: 200, height: 50 },
            attrs: {
                body: {
                    fill: "white",
                    stroke: "black",
                    strokeWidth: 2,
                    width: "calc(w)",
                    height: "calc(h)",
                    rx: 15,
                    ry: 15
                },
                label: {
                    text: "Activity",
                    fill: "black",
                    fontSize: 16,
                    fontWeight: "bold",
                    textVerticalAnchor: "middle",
                    textAnchor: "middle",
                    fontFamily: "sans-serif",
                    x: "calc(w/2)",
                    y: "calc(h/2)"
                }
            }
        };
    }

    preinitialize() {
        this.markup = util.svg`
            <rect @selector="body" />
            <text @selector="label" />
        `;
    }
}

class UMLDecision extends UMLElement {
    defaults() {
        return {
            ...super.defaults(),
            type: "UMLDecision",
            size: { width: 50, height: 50 },
            attrs: {
                body: {
                    strokeWidth: 2,
                    d:
                        "M calc(0.5 * w) 0 L calc(w) calc(0.5 * h) L calc(0.5 * w) calc(h) L 0 calc(0.5 * h) z"
                }
            }
        };
    }

    preinitialize() {
        this.markup = util.svg`
            <path @selector="body" />
        `;
    }
}

class UMLEndNode extends UMLElement {
    defaults() {
        return {
            ...super.defaults(),
            type: "UMLEndNode",
            size: { width: 30, height: 30 },
            attrs: {
                body: {
                    fill: "transparent",
                    stroke: "#333",
                    strokeWidth: 2,
                    cx: "calc(0.5 * w)",
                    cy: "calc(0.5 * h)",
                    r: "calc(0.5 * w)"
                },
                innerCircle: {
                    fill: "#333",
                    stroke: null,
                    cx: "calc(0.5 * w)",
                    cy: "calc(0.5 * h)",
                    r: "calc(0.33 * w)"
                }
            }
        };
    }

    preinitialize() {
        this.markup = util.svg`
            <circle @selector="body" />
            <circle @selector="innerCircle" />
        `;
    }
}

class UMLVerticalFork extends UMLElement {
    defaults() {
        return {
            ...super.defaults(),
            type: "UMLVerticalFork",
            size: { width: 25, height: 200 },
            attrs: {
                body: {
                    fill: "#333",
                    stroke: "#333",
                    strokeWidth: 2,
                    width: "calc(w)",
                    height: "calc(h)"
                }
            }
        };
    }

    preinitialize() {
        this.markup = util.svg`
            <rect @selector="body" />
        `;
    }
}

const cellNamespace = {
    ...shapes,
    UMLPool,
    UMLSwimlane,
    UMLInitialNode,
    UMLActivity,
    UMLDecision,
    UMLVerticalFork,
    UMLEndNode
};

const graph = new dia.Graph({}, { cellNamespace });
const paper = new dia.Paper({
    gridSize: 5,
    width: "100%",
    height: "100%",
    model: graph,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    defaultRouter: orthogonalRouter,
    defaultConnectionPoint: { name: "anchor" },
    cellViewNamespace: cellNamespace,
    restrictTranslate: (elementView) => {
        const parent = elementView.model.getParentCell();
        if (!parent) return null; // No restriction
        // Activity movement is constrained by the parent area
        const { x, y, width, height } = parent.getBBox();
        return new g.Rect(
            x,
            y + HEADER_HEIGHT,
            width,
            height - HEADER_HEIGHT
        ).inflate(-SWIMLANE_PADDING);
    },
    interactive: (cellView) => {
        const { model } = cellView;
        return {
            linkMove: false,
            // labelMove: false,
            elementMove: UMLElement.isUMLElement(model)
        };
    },
    viewport: (view) => {
        const model = view.model;
        if (model.isLink()) {
            const source = model.getSourceElement();
            const target = model.getTargetElement();
            if (!UMLElement.isUMLElement(source) || !UMLElement.isUMLElement(target))
                return true;
            // Links are not visible if both ends are hidden.
            return !source.isHidden() || !target.isHidden();
        }
        if (!UMLElement.isUMLElement(model)) return true;
        return !model.isHidden();
    },
    // A custom element view that reconnects links to the parent swimlane
    // if the element is hidden.
    elementView: dia.ElementView.extend({
        presentationAttributes: dia.ElementView.addPresentationAttributes({
            hidden: ["UPDATE"]
        }),

        getMagnetFromLinkEnd(end) {
            const { model, paper } = this;
            if (!UMLElement.isUMLElement(model) || !model.isHidden()) {
                // Use the default implementation for non-UML elements and visible elements.
                return dia.ElementView.prototype.getMagnetFromLinkEnd.call(this, end);
            }
            const parent = model.getParentCell();
            if (!parent) return null;
            // Use the first visible ancestor's magnet. For this demo it's always the direct
            // parent - the swimlane.
            return parent.findView(paper).getMagnetFromLinkEnd({ id: parent.id });
        }
    }),

    anchorNamespace: {
        ...anchors,
        left: useParentAnchor("left"),
        right: useParentAnchor("right"),
        top: useParentAnchor("top"),
        bottom: useParentAnchor("bottom")
    }
});

document.getElementById("paper-container").appendChild(paper.el);

function useParentAnchor(childAnchorName) {
    return function (view, end, ref, args, endType, linkView) {
        const { model } = view;
        // Use the default implementation for non-UML elements and visible elements.
        if (!UMLElement.isUMLElement(model) || !model.isHidden()) {
            return anchors[childAnchorName].call(
                this,
                view,
                end,
                ref,
                args,
                endType,
                linkView
            );
        }
        const parent = model.getParentCell();
        const parentBBox = parent.getBBox();
        const bbox = model.getBBox();
        // y-coordinate
        let y = bbox.y;
        switch (childAnchorName) {
            case "left":
            case "right":
                y += bbox.height / 2;
                break;
            case "bottom":
                y += bbox.height;
                break;
            case "top":
            default:
                y += bbox.height / 2;
        }
        y += args.dy || 0;
        // x-coordinate
        const xOffset = 1;
        let x = parentBBox.x;
        const { model: oppositeModel } = linkView.getEndView(
            endType === "source" ? "target" : "source"
        );
        if (oppositeModel.position().x > parentBBox.x) {
            // The opposite end is on the right side of the collapsed swimlane.
            x += parentBBox.width - xOffset;
        } else {
            // The opposite end is on the left side of the collapsed swimlane.
            x += xOffset;
        }
        // Return the anchor point (in graph coordinates)
        return new g.Point(x, y);
    };
}

// Helper functions

function createInitialNode(x, y, swimlane) {
    const initialNode = new UMLInitialNode();
    swimlane.embed(initialNode);
    initialNode.addTo(graph);
    initialNode.position(x, y + HEADER_HEIGHT, { parentRelative: true });
    return initialNode;
}

function createActivity(title, x, y, swimlane) {
    const activity = new UMLActivity({
        attrs: {
            label: {
                fill: swimlane.attr("label/fill"),
                text: title
            },
            body: {
                fill: swimlane.attr("header/fill"),
                stroke: swimlane.attr("label/fill")
            }
        }
    });
    swimlane.embed(activity);
    activity.addTo(graph);
    activity.position(x, y + HEADER_HEIGHT, { parentRelative: true });
    return activity;
}

function createDecision(x, y, swimlane) {
    const decision = new UMLDecision({
        attrs: {
            body: {
                fill: swimlane.attr("header/fill"),
                stroke: swimlane.attr("label/fill")
            }
        }
    });

    swimlane.embed(decision);
    decision.addTo(graph);
    decision.position(x, y + HEADER_HEIGHT, { parentRelative: true });
    return decision;
}

function createEndNode(x, y, swimlane) {
    const endNode = new UMLEndNode();
    swimlane.embed(endNode);
    endNode.addTo(graph);
    endNode.position(x, y + HEADER_HEIGHT, { parentRelative: true });
    return endNode;
}

function createVerticalFork(x, y, swimlane) {
    const fork = new UMLVerticalFork({
        attrs: {
            body: {
                fill: swimlane.attr("header/fill"),
                stroke: swimlane.attr("label/fill")
            }
        }
    });
    swimlane.embed(fork);
    fork.addTo(graph);
    fork.position(x, y + HEADER_HEIGHT, { parentRelative: true });
    return fork;
}

function createLink(
    source,
    target,
    { sourceSide, dx: sourceDx = 0, dy: sourceDy = 0 },
    { targetSide, dx: targetDx = 0, dy: targetDy = 0 },
    label = ""
) {
    const link = new shapes.standard.Link({
        source: {
            id: source.id,
            anchor: { name: sourceSide, args: { dx: sourceDx, dy: sourceDy } }
        },
        target: {
            id: target.id,
            anchor: { name: targetSide, args: { dx: targetDx, dy: targetDy } }
        },
        defaultLabel: {
            markup: util.svg`
                  <rect @selector="labelBody" />
                  <text @selector="labelText" />
              `,
            attrs: {
                labelText: {
                    fill: "#333",
                    fontSize: 12,
                    fontFamily: "sans-serif",
                    fontWeight: "bold",
                    textAnchor: "middle",
                    textVerticalAnchor: "middle"
                },
                labelBody: {
                    rx: 2,
                    ry: 2,
                    ref: "labelText",
                    x: "calc(x - 3)",
                    y: "calc(y - 3)",
                    width: "calc(w + 6)",
                    height: "calc(h + 6)",
                    fill: "#fff"
                }
            }
        }
    });
    if (label) {
        const isSourceDecision = source instanceof UMLDecision;
        let textAnchor = "middle";
        // Make label always stay near the source/target side
        if (isSourceDecision) {
            switch (sourceSide) {
                case "left":
                    textAnchor = "end";
                    break;
                case "right":
                    textAnchor = "start";
                    break;
            }
        } else {
            switch (targetSide) {
                case "left":
                    textAnchor = "end";
                    break;
                case "right":
                    textAnchor = "start";
                    break;
            }
        }
        const labelPosition = {
            distance: isSourceDecision ? 25 : -25
        };
        link.labels([
            {
                attrs: {
                    labelText: {
                        text: label,
                        textAnchor
                    }
                },
                position: labelPosition
            }
        ]);
    }

    link.addTo(graph);
    return link;
}

const pool = new UMLPool({
    attrs: {
        label: {
            text: "How a Bill Becomes a Law (Senate Introduced Bill)"
        }
    }
});
pool.addTo(graph);

// Create swimlanes

const swimlanes = SWIMLANES.map((swimlane, index) => {
    const swimlaneEl = new UMLSwimlane({
        attrs: {
            label: {
                text: swimlane.title,
                fill: swimlane.text || "#333"
            },
            header: {
                fill: swimlane.color
            },
            body: {
                fill: swimlane.mainColor
            },
            button: {
                fill: swimlane.mainColor
            },
            buttonSign: {
                stroke: swimlane.text || "#333"
            }
        }
    });
    pool.embed(swimlaneEl);
    swimlaneEl.addTo(graph);
    return swimlaneEl;
});

const [senate, committee, house, president] = swimlanes;

// Collapse one of the swimlanes to show the collapsed state
// president.toggleCollapse();

// Create elements and links
const initialNode = createInitialNode(25, 25, senate);
const billIntroduced = createActivity("Bill Introduced", 125, 100, senate);
createLink(
    initialNode,
    billIntroduced,
    { sourceSide: "right" },
    { targetSide: "top" }
);
const billReferred = createActivity("Bill Referred", 25, 100, committee);
createLink(
    billIntroduced,
    billReferred,
    { sourceSide: "right" },
    { targetSide: "left" }
);
const studyTheBill = createActivity("Study the Bill", 25, 225, committee);
createLink(
    billReferred,
    studyTheBill,
    { sourceSide: "bottom" },
    { targetSide: "top" }
);
const changesDecision = createDecision(100, 350, committee);
createLink(
    studyTheBill,
    changesDecision,
    { sourceSide: "bottom" },
    { targetSide: "top" },
    "Requires changes?"
);
const makeChanges = createActivity("Make Changes", 225, 350, committee);
createLink(
    changesDecision,
    makeChanges,
    { sourceSide: "right" },
    { targetSide: "left" },
    "Yes"
);
const changesMerger = createDecision(100, 475, committee);
createLink(
    changesDecision,
    changesMerger,
    { sourceSide: "bottom" },
    { targetSide: "top" },
    "No"
);
createLink(
    makeChanges,
    changesMerger,
    { sourceSide: "bottom" },
    { targetSide: "right" }
);
const markUp = createActivity("Mark Up", 25, 600, committee);
createLink(
    changesMerger,
    markUp,
    { sourceSide: "bottom" },
    { targetSide: "top" }
);
const voteOnTheBill = createActivity("Vote on the Bill", 125, 600, senate);
createLink(
    markUp,
    voteOnTheBill,
    { sourceSide: "left" },
    { targetSide: "right" }
);
const voteDecision = createDecision(200, 725, senate);
createLink(
    voteOnTheBill,
    voteDecision,
    { sourceSide: "bottom" },
    { targetSide: "top" },
    "Passed?"
);
const billDies = createActivity("Bill Dies", 125, 850, senate);
createLink(
    voteDecision,
    billDies,
    { sourceSide: "bottom" },
    { targetSide: "top" },
    "No"
);
const billMerger = createDecision(25, 725, house);
createLink(
    voteDecision,
    billMerger,
    { sourceSide: "right" },
    { targetSide: "left" },
    "Yes"
);
const billReferredToHouse = createActivity("Bill Referred", 125, 500, house);
createLink(
    billMerger,
    billReferredToHouse,
    { sourceSide: "top" },
    { targetSide: "left" }
);
const senateEndNode = createEndNode(50, 860, senate);
createLink(
    billDies,
    senateEndNode,
    { sourceSide: "left" },
    { targetSide: "right" }
);
const houseDecision = createDecision(200, 650, house);
createLink(
    billReferredToHouse,
    houseDecision,
    { sourceSide: "bottom" },
    { targetSide: "top" },
    "How did the house react?"
);
const billDiesInHouse = createActivity("Bill Dies", 125, 800, house);
createLink(
    houseDecision,
    billDiesInHouse,
    { sourceSide: "bottom" },
    { targetSide: "top" },
    "Rejected or ignored"
);
const billDiesInHouseEndNode = createEndNode(210, 900, house);
createLink(
    billDiesInHouse,
    billDiesInHouseEndNode,
    { sourceSide: "bottom" },
    { targetSide: "top" }
);
const billReturned = createActivity("Bill Returned", 125, 925, senate);
createLink(
    houseDecision,
    billReturned,
    { sourceSide: "left" },
    { targetSide: "right" },
    "Changed it"
);
const afterBillReturnedDecision = createDecision(200, 1025, senate);
createLink(
    billReturned,
    afterBillReturnedDecision,
    { sourceSide: "bottom" },
    { targetSide: "top" },
    "How did the senate react?"
);
createLink(
    afterBillReturnedDecision,
    billMerger,
    { sourceSide: "right" },
    { targetSide: "bottom" },
    "Disagree with the changes"
);
const beforePresidentMerger = createDecision(350, 900, house);
createLink(
    houseDecision,
    beforePresidentMerger,
    { sourceSide: "right" },
    { targetSide: "top" },
    "Accept the bill"
);
createLink(
    afterBillReturnedDecision,
    beforePresidentMerger,
    { sourceSide: "bottom" },
    { targetSide: "bottom" },
    "Agree with the changes"
).prop(["labels", 0, "position", "distance"], 110);
const billSubmittedToPresident = createActivity(
    "Bill Submitted",
    225,
    600,
    president
);
createLink(
    beforePresidentMerger,
    billSubmittedToPresident,
    { sourceSide: "right" },
    { targetSide: "left" }
);
const presidentDecision = createDecision(300, 800, president);
const presidentMerger = createDecision(300, 1200, president);
createLink(
    billSubmittedToPresident,
    presidentDecision,
    { sourceSide: "bottom" },
    { targetSide: "top" },
    "How did the president react?"
);
const billBecomesTheLaw = createActivity(
    "Bill Becomes the Law",
    225,
    1450,
    president
);
createLink(
    presidentDecision,
    presidentMerger,
    { sourceSide: "bottom" },
    { targetSide: "top" },
    "Signed the bill"
);
createLink(
    presidentMerger,
    billBecomesTheLaw,
    { sourceSide: "bottom" },
    { targetSide: "top" }
);
const billBecomesTheLawEndNode = createEndNode(310, 1550, president);
createLink(
    billBecomesTheLaw,
    billBecomesTheLawEndNode,
    { sourceSide: "bottom" },
    { targetSide: "top" }
);
const vetoSplit = createVerticalFork(25, 1100, president);
createLink(
    presidentDecision,
    vetoSplit,
    { sourceSide: "left" },
    { targetSide: "right" },
    "Vetoed the bill"
);
const senateVotesToOverride = createActivity(
    "Senate Votes to Override",
    125,
    1325,
    senate
);
createLink(
    vetoSplit,
    senateVotesToOverride,
    { sourceSide: "left", dy: -75 },
    { targetSide: "top" }
);
const houseVotesToOverride = createActivity(
    "House Votes to Override",
    125,
    1325,
    house
);
createLink(
    vetoSplit,
    houseVotesToOverride,
    { sourceSide: "left", dy: 75 },
    { targetSide: "top" }
);
const overrideMerger = createVerticalFork(25, 1400, president);
createLink(
    senateVotesToOverride,
    overrideMerger,
    { sourceSide: "bottom" },
    { targetSide: "left", dy: 75 }
);
createLink(
    houseVotesToOverride,
    overrideMerger,
    { sourceSide: "bottom" },
    { targetSide: "left", dy: -75 }
);
const afterVetoDecision = createDecision(150, 1350, president);
createLink(
    overrideMerger,
    afterVetoDecision,
    { sourceSide: "right" },
    { targetSide: "left" },
    "Override the veto?"
);
createLink(
    afterVetoDecision,
    presidentMerger,
    { sourceSide: "top" },
    { targetSide: "left" },
    "More than 2/3 of both chambers"
);
const billDiesVeto = createActivity("Bill Dies", 75, 1625, president);
createLink(
    afterVetoDecision,
    billDiesVeto,
    { sourceSide: "bottom" },
    { targetSide: "top" },
    "Bill did not pass"
);
const billDiesAfterVeto = createEndNode(310, 1635, president);
createLink(
    billDiesVeto,
    billDiesAfterVeto,
    { sourceSide: "right" },
    { targetSide: "left" }
);

// Setup collapse/expand of swimlanes.

paper.on("swimlane:collapse", ({ model: swimlane }, evt) => {
    evt.stopPropagation();
    swimlane.toggleCollapse();
    pool.layoutSwimlanes(swimlanes);
});

pool.layoutSwimlanes(swimlanes);

// Fit the pool on the screen.

paper.scaleContentToFit({
    contentArea: new g.Rect(
        0,
        0,
        POOL_MARGIN * 2 + swimlanes.length * SWIMLANE_SIZE.width,
        // When scaling the content, do not take the height of the pool
        // into account. This way, the pool will match the width of the
        // screen and the height will overflow the screen.
        1
    )
});

paper.fitToContent({
    contentArea: new g.Rect(
        -POOL_MARGIN,
        -POOL_MARGIN,
        POOL_MARGIN * 2 + swimlanes.length * SWIMLANE_SIZE.width - /* scrollbar */ 20,
        POOL_MARGIN * 3 + SWIMLANE_SIZE.height + HEADER_HEIGHT
    ),
    allowNewOrigin: 'any'
});

// Add custom highlighter to all links to emphasize the link end when the link
// connects a swimlane.
const LinkEndHighlighter = dia.HighlighterView.extend({
    MOUNTABLE: true,
    tagName: "rect",
    attributes: {
        width: 20,
        height: 20,
        y: -10,
        rx: 2,
        ry: 2,
        fill: "#fff",
        stroke: "#fff",
        "stroke-width": 2,
        "fill-opacity": 0.3
    },
    highlight: function (linkView) {
        const link = linkView.model;
        const source = link.getSourceElement();
        const target = link.getTargetElement();
        let anchor, offset;
        if (source.isHidden()) {
            anchor = linkView.sourceAnchor;
            offset = anchor.x > target.position().x ? 0 : -this.attributes.width;
        } else if (target.isHidden()) {
            anchor = linkView.targetAnchor;
            offset = anchor.x > source.position().x ? 0 : -this.attributes.width;
        } else {
            this.el.setAttribute("display", "none");
            return;
        }
        this.el.removeAttribute("display");
        // Position the rectangle at the end of the link over the swimlane
        // (the parent of the hidden element)
        this.el.setAttribute(
            "transform",
            `translate(${anchor.x + offset},${anchor.y})`
        );
    }
});

graph.getLinks().forEach((link) => {
    LinkEndHighlighter.add(link.findView(paper), "root", "end-marker");
});

// A custom orthogonal router (It will be available in version 3.7).

function orthogonalRouter(vertices, opt, linkView) {
    const sourceBBox = linkView.sourceBBox;
    const targetBBox = linkView.targetBBox;
    const sourcePoint = linkView.sourceAnchor;
    const targetPoint = linkView.targetAnchor;
    const { x: tx0, y: ty0 } = targetBBox;
    const { x: sx0, y: sy0 } = sourceBBox;
    const sourceOutsidePoint = sourcePoint.clone();
    const spacing = opt.spacing || 28;
    const sourceSide = sourceBBox.sideNearestToPoint(sourcePoint);
    switch (sourceSide) {
        case "left":
            sourceOutsidePoint.x = sx0 - spacing;
            break;
        case "right":
            sourceOutsidePoint.x = sx0 + sourceBBox.width + spacing;
            break;
        case "top":
            sourceOutsidePoint.y = sy0 - spacing;
            break;
        case "bottom":
            sourceOutsidePoint.y = sy0 + sourceBBox.height + spacing;
            break;
    }
    const targetOutsidePoint = targetPoint.clone();
    const targetSide = targetBBox.sideNearestToPoint(targetPoint);
    switch (targetSide) {
        case "left":
            targetOutsidePoint.x = targetBBox.x - spacing;
            break;
        case "right":
            targetOutsidePoint.x = targetBBox.x + targetBBox.width + spacing;
            break;
        case "top":
            targetOutsidePoint.y = targetBBox.y - spacing;
            break;
        case "bottom":
            targetOutsidePoint.y = targetBBox.y + targetBBox.height + spacing;
            break;
    }

    const { x: sox, y: soy } = sourceOutsidePoint;
    const { x: tox, y: toy } = targetOutsidePoint;
    const tx1 = tx0 + targetBBox.width;
    const ty1 = ty0 + targetBBox.height;
    const tcx = (tx0 + tx1) / 2;
    const tcy = (ty0 + ty1) / 2;
    const sx1 = sx0 + sourceBBox.width;
    const sy1 = sy0 + sourceBBox.height;
    const scx = (sx0 + sx1) / 2;
    const scy = (sy0 + sy1) / 2;
    const middleOfVerticalSides = (scx < tcx ? sx1 + tx0 : tx1 + sx0) / 2;
    const middleOfHorizontalSides = (scy < tcy ? sy1 + ty0 : ty1 + sy0) / 2;
    const ssx0 = sx0 - spacing;
    const ssx1 = sx1 + spacing;
    const tsx0 = tx0 - spacing;
    const tsx1 = tx1 + spacing;
    const ssy0 = sy0 - spacing;
    const ssy1 = sy1 + spacing;

    if (sourceSide === "left" && targetSide === "right") {
        if (sx0 < tx1) {
            let y = middleOfHorizontalSides;
            if (sox < tx0) {
                if (ty1 >= ssy0 && tcy < scy) {
                    y = Math.min(ty0 - spacing, ssy0);
                } else if (ty0 <= ssy1 && tcy >= scy) {
                    y = Math.max(ty1 + spacing, ssy1);
                }
            }
            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y },
                { x: tox, y: toy }
            ];
        }

        const x = (sox + tox) / 2;
        return [
            { x, y: soy },
            { x, y: toy }
        ];
    } else if (sourceSide === "right" && targetSide === "left") {
        if (sx0 > tx1) {
            let y = middleOfHorizontalSides;
            if (sox > tx1) {
                if (ty1 >= ssy0 && tcy < scy) {
                    y = Math.min(ty0 - spacing, ssy0);
                } else if (ty0 <= ssy1 && tcy >= scy) {
                    y = Math.max(ty1 + spacing, ssy1);
                }
            }

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y },
                { x: tox, y: toy }
            ];
        }

        const x = (sox + tox) / 2;
        return [
            { x, y: soy },
            { x, y: toy }
        ];
    } else if (sourceSide === "top" && targetSide === "bottom") {
        if (soy < toy) {
            let x = middleOfVerticalSides;
            let y = soy;

            if (soy < ty0) {
                if (tx1 >= ssx0 && tcx < scx) {
                    x = Math.min(tx0 - spacing, ssx0);
                } else if (tx0 <= ssx1 && tcx >= scx) {
                    x = Math.max(tx1 + spacing, ssx1);
                }
            }

            return [
                { x: sox, y },
                { x, y },
                { x, y: toy },
                { x: tox, y: toy }
            ];
        }
        const y = (soy + toy) / 2;
        return [
            { x: sox, y },
            { x: tox, y }
        ];
    } else if (sourceSide === "bottom" && targetSide === "top") {
        if (soy - spacing > toy) {
            let x = middleOfVerticalSides;
            let y = soy;

            if (soy > ty1) {
                if (tx1 >= ssx0 && tcx < scx) {
                    x = Math.min(tx0 - spacing, ssx0);
                } else if (tx0 <= ssx1 && tcx >= scx) {
                    x = Math.max(tx1 + spacing, ssx1);
                }
            }

            return [
                { x: sox, y },
                { x, y },
                { x, y: toy },
                { x: tox, y: toy }
            ];
        }
        const y = (soy + toy) / 2;
        return [
            { x: sox, y },
            { x: tox, y }
        ];
    } else if (sourceSide === "top" && targetSide === "top") {
        let x;
        let y1 = Math.min((sy1 + ty0) / 2, toy);
        let y2 = Math.min((sy0 + ty1) / 2, soy);

        if (toy < soy) {
            if (sox >= tsx1 || sox <= tsx0) {
                return [
                    { x: sox, y: Math.min(soy, toy) },
                    { x: tox, y: Math.min(soy, toy) }
                ];
            } else if (tox > sox) {
                x = Math.min(sox, tsx0);
            } else {
                x = Math.max(sox, tsx1);
            }
        } else {
            if (tox >= ssx1 || tox <= ssx0) {
                return [
                    { x: sox, y: Math.min(soy, toy) },
                    { x: tox, y: Math.min(soy, toy) }
                ];
            } else if (tcx >= scx) {
                x = Math.max(tox, ssx1);
            } else {
                x = Math.min(tox, ssx0);
            }
        }

        return [
            { x: sox, y: y2 },
            { x: x, y: y2 },
            { x: x, y: y1 },
            { x: tox, y: y1 }
        ];
    } else if (sourceSide === "bottom" && targetSide === "bottom") {
        if (tx0 >= ssx1 || tx1 <= ssx0) {
            return [
                { x: sox, y: Math.max(soy, toy) },
                { x: tox, y: Math.max(soy, toy) }
            ];
        }

        let x;
        let y1;
        let y2;

        if (toy > soy) {
            y1 = Math.max((sy1 + ty0) / 2, toy);
            y2 = Math.max((sy1 + ty0) / 2, soy);

            if (tox > sox) {
                x = Math.min(sox, tsx0);
            } else {
                x = Math.max(sox, tsx1);
            }
        } else {
            y1 = Math.max((sy0 + ty1) / 2, toy);
            y2 = Math.max((sy0 + ty1) / 2, soy);

            if (tcx >= scx) {
                x = Math.max(tox, ssx1);
            } else {
                x = Math.min(tox, ssx0);
            }
        }

        return [
            { x: sox, y: y2 },
            { x: x, y: y2 },
            { x: x, y: y1 },
            { x: tox, y: y1 }
        ];
    } else if (sourceSide === "left" && targetSide === "left") {
        let y;
        let x1 = Math.min((sx1 + tx0) / 2, tox);
        let x2 = Math.min((sx0 + tx1) / 2, sox);

        const ssy0 = sy0 - spacing;
        const ssy1 = sy1 + spacing;
        const tsy0 = ty0 - spacing;
        const tsy1 = ty1 + spacing;

        if (tox > sox) {
            if (toy <= soy) {
                y = Math.min(ssy0, toy);
            } else {
                y = Math.max(ssy1, toy);
            }
        } else {
            if (toy >= soy) {
                y = Math.min(tsy0, soy);
            } else {
                y = Math.max(tsy1, soy);
            }
        }

        return [
            { x: x2, y: soy },
            { x: x2, y: y },
            { x: x1, y: y },
            { x: x1, y: toy }
        ];
    } else if (sourceSide === "right" && targetSide === "right") {
        let y;
        let x1 = Math.max((sx0 + tx1) / 2, tox);
        let x2 = Math.max((sx1 + tx0) / 2, sox);

        const ssy0 = sy0 - spacing;
        const ssy1 = sy1 + spacing;
        const tsy0 = ty0 - spacing;
        const tsy1 = ty1 + spacing;

        if (tox < sox) {
            if (toy <= soy) {
                y = Math.min(ssy0, toy);
            } else {
                y = Math.max(ssy1, toy);
            }
        } else {
            if (toy >= soy) {
                y = Math.min(tsy0, soy);
            } else {
                y = Math.max(tsy1, soy);
            }
        }

        return [
            { x: x2, y: soy },
            { x: x2, y: y },
            { x: x1, y: y },
            { x: x1, y: toy }
        ];
    } else if (sourceSide === "top" && targetSide === "right") {
        if (soy > toy) {
            if (sox < tox) {
                let y = (sy0 + ty1) / 2;
                if (y > tcy && y < ty1 + spacing && sox < tx0 - spacing) {
                    y = ty0 - spacing;
                }
                return [
                    { x: sox, y },
                    { x: tox, y },
                    { x: tox, y: toy }
                ];
            }
            return [{ x: sox, y: toy }];
        }

        const x = middleOfVerticalSides;

        if (sox > tox && sy1 >= toy) {
            return [
                { x: sox, y: soy },
                { x, y: soy },
                { x, y: toy }
            ];
        }

        if (x > ssx0 && soy < ty1) {
            const y = Math.min(sy0, ty0) - spacing;
            const x = Math.max(sx1, tx1) + spacing;
            return [
                { x: sox, y },
                { x, y },
                { x, y: toy }
            ];
        }
        return [
            { x: sox, y: soy },
            { x, y: soy },
            { x, y: toy }
        ];
    } else if (sourceSide === "top" && targetSide === "left") {
        if (soy > toy) {
            if (sox > tox) {
                let y = (sy0 + ty1) / 2;
                if (y > tcy && y < ty1 + spacing && sox > tx1 + spacing) {
                    y = ty0 - spacing;
                }
                return [
                    { x: sox, y },
                    { x: tox, y },
                    { x: tox, y: toy }
                ];
            }
            return [{ x: sox, y: toy }];
        }

        const x = middleOfVerticalSides;

        if (sox < tox && sy1 >= toy) {
            return [
                { x: sox, y: soy },
                { x, y: soy },
                { x, y: toy }
            ];
        }

        if (x < ssx1 && soy < ty1) {
            const y = Math.min(sy0, ty0) - spacing;
            const x = Math.min(sx0, tx0) - spacing;
            return [
                { x: sox, y },
                { x, y },
                { x, y: toy }
            ];
        }
        return [
            { x: sox, y: soy },
            { x, y: soy },
            { x, y: toy }
        ];
    } else if (sourceSide === "bottom" && targetSide === "right") {
        if (soy < toy) {
            if (sox < tox) {
                let y = (sy1 + ty0) / 2;
                if (y < tcy && y > ty0 - spacing && sox < tx0 - spacing) {
                    y = ty1 + spacing;
                }
                return [
                    { x: sox, y },
                    { x: tox, y },
                    { x: tox, y: toy }
                ];
            }
            return [{ x: sox, y: toy }];
        } else {
            if (sx0 < tox) {
                const y = Math.max(sy1, ty1) + spacing;
                const x = Math.max(sx1, tx1) + spacing;
                return [
                    { x: sox, y },
                    { x, y },
                    { x, y: toy }
                ];
            }
        }

        const x = middleOfVerticalSides;

        return [
            { x: sox, y: soy },
            { x, y: soy },
            { x, y: toy }
        ];
    } else if (sourceSide === "bottom" && targetSide === "left") {
        if (soy < toy) {
            if (sox > tox) {
                let y = (sy1 + ty0) / 2;
                if (y < tcy && y > ty0 - spacing && sox > tx1 + spacing) {
                    y = ty1 + spacing;
                }
                return [
                    { x: sox, y },
                    { x: tox, y },
                    { x: tox, y: toy }
                ];
            }
            return [{ x: sox, y: toy }];
        } else {
            if (sx1 > tox) {
                const y = Math.max(sy1, ty1) + spacing;
                const x = Math.min(sx0, tx0) - spacing;
                return [
                    { x: sox, y },
                    { x, y },
                    { x, y: toy }
                ];
            }
        }

        const x = middleOfVerticalSides;

        return [
            { x: sox, y: soy },
            { x, y: soy },
            { x, y: toy }
        ];
    } else if (sourceSide === "left" && targetSide === "bottom") {
        if (sox > tox && soy >= toy) {
            return [{ x: tox, y: soy }];
        }

        if (sox > tx1) {
            if (soy < toy) {
                const x = middleOfVerticalSides;
                return [
                    { x, y: soy },
                    { x, y: toy },
                    { x: tox, y: toy }
                ];
            }
        }

        const x = Math.min(sx0, tx0) - spacing;
        let y = Math.max(sy1, ty1) + spacing;

        if (tox <= sx1 && toy < soy) {
            y = (ty1 + sy0) / 2;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y }
            ];
        }

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
    } else if (sourceSide === "left" && targetSide === "top") {
        if (sox > tox && soy <= toy) {
            return [{ x: tox, y: soy }];
        }

        if (sox > tx1) {
            if (soy > toy) {
                const x = (sx0 + tx1) / 2;
                return [
                    { x, y: soy },
                    { x, y: toy },
                    { x: tox, y: toy }
                ];
            }
        }

        const x = Math.min(sx0, tx0) - spacing;
        let y = Math.min(sy0, ty0) - spacing;

        if (tox <= sx1 && toy > soy) {
            y = (ty0 + sy1) / 2;

            return [
                { x: sox, y: soy },
                { x: sox, y },
                { x: tox, y }
            ];
        }

        return [
            { x, y: soy },
            { x, y },
            { x: tox, y }
        ];
    } else if (sourceSide === "right" && targetSide === "top") {
        if (sox < tox && soy <= toy) {
            return [{ x: tox, y: soy }];
        }

        let x = (sx1 + tx0) / 2;

        if (sx1 < tx0) {
            if (soy > toy) {
                return [
                    { x, y: soy },
                    { x, y: toy },
                    { x: tox, y: toy }
                ];
            }
        }

        if (x < sx1 + spacing && sy1 > ty0) {
            x = Math.max(tx1 + spacing, sox);
            const y = Math.min(sy0, ty0) - spacing;

            return [
                { x, y: soy },
                { x, y: y },
                { x: tox, y: y }
            ];
        }

        const y = (sy1 + ty0) / 2;
        if (y <= sy1 && tox < sx0) {
            const x = Math.max(sx1, tx1) + spacing;
            const y = Math.min(sy0, ty0) - spacing;
            return [
                { x, y: soy },
                { x, y },
                { x: tox, y }
            ];
        }

        return [
            { x: sox, y: soy },
            { x: sox, y: y },
            { x: tox, y: y }
        ];
    } else if (sourceSide === "right" && targetSide === "bottom") {
        let x = (sx1 + tx0) / 2;
        if (sx1 < x) {
            if (soy < toy) {
                return [
                    { x, y: soy },
                    { x, y: toy },
                    { x: tox, y: toy }
                ];
            }
            return [{ x: tox, y: soy }];
        }

        if (x < sx1 + spacing && sy0 < ty1) {
            x = Math.max(tx1 + spacing, sox);
            const y = Math.max(sy1, ty1) + spacing;

            return [
                { x, y: soy },
                { x, y: y },
                { x: tox, y: y }
            ];
        }

        const y = (sy0 + ty1) / 2;
        if (y >= sy0 && tox < sx0) {
            const x = Math.max(sx1, tx1) + spacing;
            const y = Math.max(sy1, ty1) + spacing;
            return [
                { x, y: soy },
                { x, y },
                { x: tox, y }
            ];
        }

        return [
            { x: sox, y: soy },
            { x: sox, y: y },
            { x: tox, y: y }
        ];
    }
}
