const { shapes: defaultShapes, dia, util, linkTools } = joint;

const paperContainer = document.getElementById("paper-container");

const COLORS = [
    "#3f84e5",
    "#49306B",
    "#fe7f2d",
    "#ad343e",
    "#899e8b",
    "#ede9e9",
    "#b2a29f",
    "#392F2D"
];

const logo = /* xml */ `
    <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 280" fill="#DA3D40">
        <path d="m130.71 225.71l-27.28-27.27q0-0.01 0-0.01h76.41v-103.68h27.28c0 0 0 59.4 0 98.19l-32.77 32.77zm330.37-116.97c10.68 10.41 17.29 25.87 17.29 46.13 0 20.26-6.61 35.71-17.29 46.13-10.69 10.41-25.47 15.79-41.91 15.79-16.44 0-31.22-5.38-41.91-15.79-10.68-10.42-17.29-25.87-17.29-46.13 0-20.26 6.61-35.72 17.29-46.13 10.69-10.41 25.47-15.79 41.91-15.79 16.44 0 31.22 5.38 41.91 15.79zm401.41-18.61q-8.23-7.14-22.76-7.15-11.77 0.01-18.3 5.07-6.59 5.11-6.59 14.42 0 6.67 3.47 10.89 3.42 4.18 10.27 7.59 6.77 3.37 20.96 8.6h0.01q14.98 5.85 23.95 10.62 8.92 4.74 15.31 13.26 6.38 8.48 6.38 21.16 0 12.48-6.28 22.05-6.29 9.58-18.03 14.86-11.78 5.29-27.76 5.29-15.99 0-28.09-5.4-12.05-5.39-18.55-15.18-6.49-9.79-6.49-22.71v-7.66h23.37v6.36q-0.01 10.17 8.71 16.92 8.64 6.7 22.95 6.7 13.05-0.01 19.69-5.74 6.69-5.76 6.69-14.84-0.01-6.23-3.69-10.56-3.63-4.29-10.37-7.81-6.67-3.48-20.01-8.7 0 0-0.01 0-14.98-5.64-24.27-10.63-9.23-4.95-15.42-13.46-6.16-8.49-6.16-21.17 0-18.93 13.39-29.9 13.45-11 35.93-10.99 15.77 0 27.86 5.61 12.07 5.6 18.78 15.62 6.7 10.01 6.7 23.13v5.92h-23.37v-4.61q0-10.38-8.27-17.56zm-318.54 18.35h1.52c7.2-9.6 18.63-15.53 34.94-15.53 14.12 0 25.51 4.23 33.38 12.18 7.88 7.95 12.27 19.65 12.27 34.71v74.96h-21.74v-71.71c0-9.84-2.46-17.37-7.24-22.42-4.78-5.03-11.84-7.55-20.88-7.55-10.09 0-18.19 3.05-23.74 9.4-5.05 5.79-7.99 14.26-8.51 25.47v66.53h-21.83v-119.76h21.83zm-194.95-13.73c0 0 0 63.58 0 98.2l-21.85 21.85c-10.29 0-22.53 0-32.81 0l-21.83-21.83q0 0 0 0h54.66v-98.22zm353.46 98.22l-21.83 21.83c0 0-10.89 0-21.8 0l-21.85-21.85v-130.94h21.83v32.74h32.74v21.83h-32.74v76.39h98.31v-130.96h21.83c0 0 0 88.7 0 130.94l-21.85 21.85c-10.29 0-22.53 0-32.81 0 0 0-21.83-21.83-21.83-21.83zm-213.17-98.22h21.83v119.77h-21.83zm-96.8 29.36c-6.6 7.05-10.44 17.44-10.44 30.75 0 13.3 3.84 23.69 10.44 30.74 6.57 7.02 15.86 10.69 26.68 10.69 10.82 0 20.11-3.67 26.68-10.69 6.61-7.05 10.45-17.44 10.45-30.74 0-13.31-3.84-23.7-10.45-30.75-6.57-7.01-15.86-10.69-26.68-10.69-10.82 0-20.11 3.68-26.68 10.69zm-299.99 63.38l-27.28-27.28q0 0 0 0h76.4v-103.69h27.29c0 0 0 59.4 0 98.2l-32.77 32.77zm396.79-125.48h21.82v21.82h-21.82zm-162.11 0h21.82v21.83h-21.82z" />
    </svg>
`;

const shapes = { ...defaultShapes };
const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    el: document.getElementById("paper"),
    width: "100%",
    height: "100%",
    model: graph,
    async: true,
    multiLinks: false,
    linkPinning: false,
    cellViewNamespace: shapes,
    sorting: dia.Paper.sorting.APPROX,
    defaultConnectionPoint: {
        name: "boundary",
        args: {
            offset: 5
        }
    },
    defaultConnector: {
        name: "jumpover"
    },
    background: {
        color: "#f6f4f4"
    },
    highlighting: {
        connecting: {
            name: "mask",
            options: {
                attrs: {
                    stroke: "#0A100D",
                    "stroke-width": 3
                }
            }
        }
    },
    restrictTranslate: function (elementView) {
        const parent = elementView.model.getParentCell();
        if (parent) {
            // use cases movement is constrained by the parent area
            return parent.getBBox().inflate(-6);
        }
        return null;
    },
    validateConnection: function (cellViewS, _, cellViewT) {
        if (cellViewT.model instanceof UseCase) return true;
        return false;
    }
});

paperContainer.appendChild(paper.el);

class Boundary extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: "Boundary",
            attrs: {
                body: {
                    width: "calc(w)",
                    height: "calc(h)",
                    fill: COLORS[5],
                    stroke: COLORS[6],
                    strokeWidth: 1,
                    rx: 20,
                    ry: 20
                },
                label: {
                    y: 10,
                    x: "calc(w / 2)",
                    textAnchor: "middle",
                    textVerticalAnchor: "top",
                    fontSize: 18,
                    fontFamily: "sans-serif",
                    fontWeight: "bold",
                    fill: COLORS[7]
                },
                logo: {
                    width: 200,
                    height: 100,
                    x: "calc(w - 200)",
                    y: "calc(h - 100)",
                    xlinkHref: `data:image/svg+xml;utf8,${encodeURIComponent(logo)}`
                }
            }
        };
    }

    preinitialize(...args) {
        super.preinitialize(...args);
        this.markup = util.svg`
            <rect @selector="body" />
            <text @selector="label" />
            <image @selector="logo" />
        `;
    }
}

const legsY = 0.7;
const bodyY = 0.3;
const headY = 0.15;

class Actor extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: "Actor",
            attrs: {
                background: {
                    width: "calc(w)",
                    height: "calc(h)",
                    fill: "transparent"
                },
                body: {
                    d: `M 0 calc(0.4 * h) h calc(w) M 0 calc(h) calc(0.5 * w) calc(${legsY} * h) calc(w) calc(h) M calc(0.5 * w) calc(${legsY} * h) V calc(${bodyY} * h)`,
                    fill: "none",
                    stroke: COLORS[7],
                    strokeWidth: 2
                },
                head: {
                    cx: "calc(0.5 * w)",
                    cy: `calc(${headY} * h)`,
                    r: `calc(${headY} * h)`,
                    stroke: COLORS[7],
                    strokeWidth: 2,
                    fill: "#ffffff"
                },
                label: {
                    y: "calc(h + 10)",
                    x: "calc(0.5 * w)",
                    textAnchor: "middle",
                    textVerticalAnchor: "top",
                    fontSize: 14,
                    fontFamily: "sans-serif",
                    fill: COLORS[7],
                    textWrap: {
                        width: "calc(3 * w)",
                        height: null
                    }
                }
            }
        };
    }

    preinitialize(...args) {
        super.preinitialize(...args);
        this.markup = util.svg`
            <rect @selector="background" />
            <path @selector="body" />
            <circle @selector="head" />
            <text @selector="label" />
        `;
    }
}

class UseCase extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: "UseCase",
            attrs: {
                root: {
                    highlighterSelector: "body"
                },
                body: {
                    cx: "calc(0.5 * w)",
                    cy: "calc(0.5 * h)",
                    rx: "calc(0.5 * w)",
                    ry: "calc(0.5 * h)",
                    stroke: COLORS[7],
                    strokeWidth: 2
                },
                label: {
                    x: "calc(0.5 * w)",
                    y: "calc(0.5 * h)",
                    textVerticalAnchor: "middle",
                    textAnchor: "middle",
                    fontSize: 14,
                    fontFamily: "sans-serif",
                    fill: "#ffffff",
                    textWrap: {
                        width: "calc(w - 30)",
                        height: "calc(h - 10)",
                        ellipsis: true
                    }
                }
            }
        };
    }

    preinitialize(...args) {
        super.preinitialize(...args);
        this.markup = util.svg`
            <ellipse @selector="body" />
            <text @selector="label" />
        `;
    }
}

class Use extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep(
            {
                type: "Use",
                attrs: {
                    line: {
                        stroke: COLORS[7],
                        strokeWidth: 2,
                        targetMarker: null
                    }
                }
            },
            super.defaults
        );
    }
}

const lineAttrs = {
    stroke: COLORS[7],
    strokeWidth: 2,
    strokeDasharray: "6,2",
    targetMarker: {
        type: "path",
        fill: "none",
        stroke: COLORS[7],
        "stroke-width": 2,
        d: "M 10 -5 0 0 10 5"
    }
};

const defaultLabel = {
    position: 0.5,
    markup: util.svg`
        <rect @selector="labelBody" />
        <text @selector="labelText" />
    `,
    attrs: {
        labelText: {
            fill: COLORS[7],
            fontSize: 12,
            fontFamily: "sans-serif",
            fontWeight: "bold",
            textAnchor: "middle",
            textVerticalAnchor: "middle"
        },
        labelBody: {
            ref: "labelText",
            x: "calc(x - 2)",
            y: "calc(y - 2)",
            width: "calc(w + 4)",
            height: "calc(h + 4)",
            fill: COLORS[5]
        }
    }
};

class Include extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep(
            {
                type: "Include",
                attrs: {
                    line: lineAttrs
                },
                defaultLabel,
                labels: [
                    {
                        attrs: {
                            labelText: {
                                text: "<<include>>",
                                annotations: [
                                    {
                                        start: 0,
                                        end: 2,
                                        attrs: {
                                            fill: COLORS[6]
                                        }
                                    },
                                    {
                                        start: 9,
                                        end: 11,
                                        attrs: {
                                            fill: COLORS[6]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                ]
            },
            super.defaults
        );
    }
}

class Extend extends shapes.standard.Link {
    defaults() {
        return util.defaultsDeep(
            {
                type: "Extend",
                attrs: {
                    line: lineAttrs
                },
                defaultLabel,
                labels: [
                    {
                        attrs: {
                            labelText: {
                                text: "<<extend>>",
                                annotations: [
                                    {
                                        start: 0,
                                        end: 2,
                                        attrs: {
                                            fill: COLORS[6]
                                        }
                                    },
                                    {
                                        start: 8,
                                        end: 10,
                                        attrs: {
                                            fill: COLORS[6]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                ]
            },
            super.defaults
        );
    }
}

Object.assign(shapes, {
    Boundary,
    Actor,
    UseCase,
    Use,
    Include,
    Extend
});

function createActor(name, x, y, color) {
    return new Actor({
        size: {
            width: 40,
            height: 80
        },
        position: {
            x,
            y
        },
        attrs: {
            head: {
                fill: color
            },
            label: {
                text: name
            }
        }
    });
}

function createUseCase(useCase, x, y) {
    return new UseCase({
        size: {
            width: 125,
            height: 75
        },
        position: {
            x,
            y
        },
        attrs: {
            label: {
                text: useCase
            }
        }
    });
}

function createUse(source, target) {
    return new Use({
        source: {
            id: source.id,
            connectionPoint: {
                name: "rectangle",
                args: {
                    offset: 5
                }
            }
        },
        target: { id: target.id }
    });
}

function createInclude(source, target) {
    return new Include({
        source: { id: source.id },
        target: { id: target.id }
    });
}

function createExtend(source, target) {
    return new Extend({
        source: { id: source.id },
        target: { id: target.id }
    });
}

const boundary = new Boundary({
    size: {
        width: 800,
        height: 1000
    },
    position: {
        x: 200,
        y: 100
    },
    attrs: {
        label: {
            text: "JointJS Support System"
        }
    }
});

const packageHolder = createActor(
    "JointJS+ Support Package Subscriber",
    100,
    400,
    COLORS[0]
);
const jointJSPlusUser = createActor(
    "JointJS+ User\n(Commercial)",
    100,
    700,
    COLORS[1]
);
const jointJSUser = createActor(
    "JointJS User\n(Open Source)",
    100,
    930,
    COLORS[2]
);
const techSupport = createActor(
    "JointJS Technical Support",
    1075,
    550,
    COLORS[3]
);
const community = createActor("Community", 1075, 930, COLORS[4]);

const requestCodeReview = createUseCase("Request Code Review", 400, 150);
const reviewCode = createUseCase("Review Code", 700, 150);
const giveFeedback = createUseCase("Give Feedback", 700, 290);
const proposeChanges = createUseCase("Propose Changes", 700, 425);
const requestConferenceCall = createUseCase(
    "Request Conference Call",
    400,
    350
);
const proposeTimeAndDateOfCall = createUseCase(
    "Propose Time and Date of Call",
    400,
    525
);
const attendConferenceCall = createUseCase("Attend Conference Call", 400, 700);
const contactViaTicketingSystem = createUseCase(
    "Contact via Ticketing System",
    400,
    825
);
const respondToTicket = createUseCase("Respond to Ticket", 700, 825);
const askGithubDiscussion = createUseCase("Ask on GitHub Discussion", 400, 950);
const respondToDiscussion = createUseCase("Respond to Discussion", 700, 950);

boundary.embed([
    requestCodeReview,
    reviewCode,
    giveFeedback,
    proposeChanges,
    requestConferenceCall,
    proposeTimeAndDateOfCall,
    attendConferenceCall,
    contactViaTicketingSystem,
    respondToTicket,
    askGithubDiscussion,
    respondToDiscussion
]);

graph.addCells([
    boundary,
    packageHolder,
    jointJSPlusUser,
    jointJSUser,
    techSupport,
    community,
    requestCodeReview,
    reviewCode,
    giveFeedback,
    proposeChanges,
    requestConferenceCall,
    proposeTimeAndDateOfCall,
    attendConferenceCall,
    contactViaTicketingSystem,
    respondToTicket,
    askGithubDiscussion,
    respondToDiscussion,
    createUse(packageHolder, requestCodeReview),
    createUse(packageHolder, requestConferenceCall),
    createUse(packageHolder, attendConferenceCall),
    createUse(packageHolder, contactViaTicketingSystem),
    createUse(packageHolder, askGithubDiscussion),
    createUse(jointJSPlusUser, contactViaTicketingSystem),
    createUse(jointJSPlusUser, askGithubDiscussion),
    createUse(jointJSUser, askGithubDiscussion),
    createUse(techSupport, reviewCode),
    createUse(techSupport, giveFeedback),
    createUse(techSupport, proposeChanges),
    createUse(techSupport, proposeTimeAndDateOfCall),
    createUse(techSupport, attendConferenceCall),
    createUse(techSupport, respondToTicket),
    createUse(techSupport, respondToDiscussion),
    createUse(community, respondToDiscussion),
    createExtend(proposeChanges, giveFeedback),
    createInclude(reviewCode, requestCodeReview),
    createInclude(giveFeedback, reviewCode),
    createInclude(proposeTimeAndDateOfCall, requestConferenceCall),
    createInclude(attendConferenceCall, proposeTimeAndDateOfCall),
    createInclude(respondToTicket, contactViaTicketingSystem),
    createInclude(respondToDiscussion, askGithubDiscussion)
]);

function getFillColor(colors) {
    if (colors.length === 0) return COLORS[7];
    if (colors.length === 1) return colors[0];

    let step = 1 / colors.length;

    const stops = colors.reduce((acc, color, index) => {
        const offset = index * step;
        acc.push({ color, offset });
        acc.push({ color, offset: offset + step });
        return acc;
    }, []);

    return {
        type: "linearGradient",
        stops,
        attrs: {
            x1: 0.15,
            gradientTransform: "rotate(10)"
        }
    };
}

function fillUseCaseColors() {
    graph.getElements().forEach((element) => {
        if (!(element instanceof UseCase)) return;
        const useCaseActors = graph
            .getNeighbors(element, { inbound: true })
            .filter((el) => el instanceof Actor);
        const colors = useCaseActors.map((actor) => actor.attr("head/fill"));
        element.attr("body/fill", getFillColor(colors), { rewrite: true });
    });
}

fillUseCaseColors();

paper.on("link:connect", () => fillUseCaseColors());
graph.on("remove", () => fillUseCaseColors());

paper.on("link:mouseenter", (linkView) => {
    if (!(linkView.model instanceof Use)) return;
    const toolsView = new dia.ToolsView({
        tools: [
            new linkTools.TargetArrowhead({ scale: 1.2 }),
            new linkTools.Remove({ scale: 1.2 })
        ]
    });
    linkView.addTools(toolsView);
});

paper.on("link:mouseleave", (linkView) => {
    linkView.removeTools();
});

function scaleToFit() {
    const graphBBox = graph.getBBox();
    paper.scaleContentToFit({
        padding: 50,
        contentArea: graphBBox
    });
    const { sy } = paper.scale();
    const area = paper.getArea();
    const yTop = area.height / 2 - graphBBox.y - graphBBox.height / 2;
    const xLeft = area.width / 2 - graphBBox.x - graphBBox.width / 2;
    paper.translate(xLeft * sy, yTop * sy);
}

window.addEventListener("resize", () => scaleToFit());
scaleToFit();
