import { dia, highlighters, elementTools, util, shapes } from '@joint/core';
import './styles.scss';

const DEFAULT_PREFERRED_WIDTH = 300;
const DEFAULT_HEIGHT = 40;

// Utilities
// =========

const canvas = document.createElement("canvas");
const canvasCtx = canvas.getContext("2d");

function measureTextSize(text, fontSize, fontFamily) {
    canvasCtx.font = `${fontSize}px ${fontFamily}`;
    const lines = text.split("\n");
    const maxWidth = Math.max(
        ...lines.map((line) => canvasCtx.measureText(line).width)
    );
    const lineHeight = lines.length * (fontSize * 1.2); // 1.2 is a common line height multiplier
    return {
        width: maxWidth,
        height: lineHeight
    };
}

// A custom rectangle element
// ==========================
class Rectangle extends dia.Element {
    preinitialize() {
        this.markup = [
            {
                tagName: "rect",
                selector: "shadow"
            },
            {
                tagName: "rect",
                selector: "body"
            },
            {
                tagName: "text",
                selector: "label"
            }
        ];
    }

    defaults() {
        return {
            ...super.defaults,
            type: "Rectangle",
            attrs: {
                root: {
                    magnetSelector: "body",
                    cursor: 'move'
                },
                shadow: {
                    x: 4,
                    y: 4,
                    width: "calc(w)",
                    height: "calc(h)",
                    fill: "#000000",
                    fillOpacity: 0.15,
                    rx: 5,
                    ry: 5
                },
                body: {
                    width: "calc(w)",
                    height: "calc(h)",
                    strokeWidth: 1,
                    stroke: "#131E29",
                    fill: "#F5F5F5",
                    rx: 4,
                    ry: 4
                },
                label: {
                    fontWeight: "bold",
                    textVerticalAnchor: "middle",
                    textAnchor: "middle",
                    x: "calc(w/2)",
                    y: DEFAULT_HEIGHT / 2,
                    fontSize: 14,
                    fill: "#333333",
                    fontFamily: "sans-serif",
                    textWrap: {
                        width: "calc(w - 20)",
                        maxLineCount: 2,
                        ellipsis: true
                    }
                }
            }
        };
    }

    initialize() {
        super.initialize();
        this.on("change", (el, opt) => {
            if ("tags" in el.changed || "preferredWidth" in el.changed) {
                this.resetLayout();
            }
        });
        this.resetLayout();
    }

    getLayout() {
        if (!this._layout) {
            this.runLayout();
        }
        return this._layout;
    }

    resetLayout(opt) {
        const layout = this.runLayout();
        this._layout = layout;
        this.size({ width: layout.width, height: layout.height }, opt);
    }

    runLayout(options = {}) {
        const fontSize = 12;
        const fontFamily = "sans-serif";
        const gap = 10;
        const padding = 10;
        const tagPadding = 5;
        const tagHeight = fontSize + tagPadding * 2;
        const tags = this.getTags();
        const preferredWidth =
            this.get("preferredWidth") ?? DEFAULT_PREFERRED_WIDTH;
        const x0 = padding; // x position for the tags
        const y0 = DEFAULT_HEIGHT; // y position for the tags

        if (tags.length === 0) {
            return {
                tags: [],
                width: preferredWidth,
                height: y0
            };
        }

        const { width } = this.size();
        if (typeof width !== "number" || width <= 0) {
            throw new Error("Rectangle: width must be a positive number");
        }
        const maxWidth = Math.max(width, preferredWidth) - padding * 2;

        let x = padding;
        let y = y0;
        const tagLayouts = tags.map((tag) => {
            // TODO: a caching should be implemented here
            // especially if there is a limited set of tags
            const size = measureTextSize(tag, fontSize, fontFamily);
            size.width += tagPadding * 2; // padding around the text
            size.height += tagPadding * 2; // padding around the text
            if (x + size.width > maxWidth && x !== x0) {
                x = x0; // reset x to padding if it exceeds max width
                y += tagHeight + gap; // move to next line
            }
            const tagLayout = {
                x,
                y,
                rightX: x + size.width,
                bottomY: y + size.height,
                text: tag,
                width: size.width,
                height: size.height
            };
            x += size.width + gap;
            return tagLayout;
        });

        const tagsWidth =
            tagLayouts.reduce((acc, tag) => Math.max(acc, tag.rightX), 0) - x0;
        const tagsHeight =
            tagLayouts.reduce((acc, tag) => Math.max(acc, tag.bottomY), y0) - y0;

        const elWidth = Math.max(preferredWidth, tagsWidth + padding * 2);
        const elHeight = tagsHeight + y0 + padding;

        return {
            tags: tagLayouts,
            width: elWidth,
            height: elHeight
        };
    }

    getTags() {
        return this.get("tags") || [];
    }

    addTag(tag) {
        this.set("tags", [...this.getTags(), tag]);
    }

    removeTag(index) {
        const tags = this.getTags();
        if (index !== -1) {
            this.set("tags", tags.slice(0, index).concat(tags.slice(index + 1)));
        }
    }
}

// Tags
// ====

class Tags extends dia.HighlighterView {
    preinitialize() {
        this.UPDATE_ATTRIBUTES = ["tags", "preferredWidth"];
    }

    highlight(elementView, options = {}) {
        this.vel.empty();
        const layout = elementView.model.getLayout();
        layout.tags.forEach((tag, index) => {
            const x = tag.x;
            const y = tag.y;
            V(
                "g",
                {
                    class: "tag",
                    dataIndex: index,
                    transform: `translate(${x}, ${y})`,
                    cursor: 'pointer',
                    event: 'element:tag:pointerdown',
                    dataName: tag.text
                },
                [
                    // shadow
                    V("rect", {
                        x: 3,
                        y: 3,
                        width: tag.width,
                        height: tag.height,
                        stroke: "none",
                        fill: "#000000",
                        fillOpacity: 0.3,
                        rx: 3,
                        ry: 3
                    }),
                    // body
                    V("rect", {
                        width: tag.width,
                        height: tag.height,
                        fill: "#067BC2",
                        stroke: "#131E29",
                        strokeWidth: 1,
                        rx: 2,
                        ry: 2
                    }),
                    // label
                    V("text", {
                        x: tag.width / 2,
                        y: tag.height / 2,
                        text: tag.text,
                        fill: "#FFFFFF",
                        fontSize: 12,
                        fontFamily: "sans-serif",
                        textAnchor: "middle",
                        dominantBaseline: "middle"
                    }).text(tag.text)
                ]
            ).appendTo(this.el);
        });
    }
}

function addRemoveTagTools(elementView) {
    const tools = elementView.model.getLayout().tags.map((tag, index) => {
        return new elementTools.Remove({
            markup: util.svg`
                <circle @selector="button" r="7" fill="#131E29" cursor="pointer" opacity="0.5" />
                <path @selector="icon" d="M -3 -3 3 3 M -3 3 3 -3" fill="none" stroke="#FFFFFF" stroke-width="1.5" pointer-events="none" />
            `,
            x: tag.x + tag.width - 10,
            y: tag.y + tag.height / 2,
            useModelGeometry: true,
            action: (evt, view) => {
                elementView.model.removeTag(index);
                addRemoveTagTools(elementView);
            }
        });
    });
    const toolsView = new dia.ToolsView({
        tools
    });
    elementView.addTools(toolsView);
}

// Badges
// ======

const BADGE_COLOR = "#FED766";

const badgeIcons = {
    // https://lucide.dev/icons/shield-plus
    user: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${BADGE_COLOR}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-user-icon lucide-shield-user"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M6.376 18.91a6 6 0 0 1 11.249.003"/><circle cx="12" cy="11" r="4"/></svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${BADGE_COLOR}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-alert-icon lucide-shield-alert"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
    ban: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${BADGE_COLOR}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-ban-icon lucide-shield-ban"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m4.243 5.21 14.39 12.472"/></svg>`,
    minus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${BADGE_COLOR}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-minus-icon lucide-shield-minus"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M9 12h6"/></svg>`,
    off: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${BADGE_COLOR}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-off-icon lucide-shield-off"><path d="m2 2 20 20"/><path d="M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71"/><path d="M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264"/></svg>`,
    "question-mark": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${BADGE_COLOR}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-question-mark-icon lucide-shield-question-mark"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${BADGE_COLOR}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-x-icon lucide-shield-x"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${BADGE_COLOR}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check-icon lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
    ellipsis: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${BADGE_COLOR}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-ellipsis-icon lucide-shield-ellipsis"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/></svg>`,
    half: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${BADGE_COLOR}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-half-icon lucide-shield-half"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 22V2"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${BADGE_COLOR}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-plus-icon lucide-shield-plus"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M9 12h6"/><path d="M12 9v6"/></svg>`
};

class Badges extends highlighters.list {
    createListItem(badgeName, { width, height }, currentItemNode) {
        let itemNode = currentItemNode;
        if (!itemNode) {
            // The item node has not been created yet
            itemNode = V("image", {
                event: "element:badge:pointerdown",
                cursor: "pointer",
                width,
                height,
                dataName: badgeName
            }).node;
        }
        // Update the item node
        itemNode.setAttribute(
            "href",
            `data:image/svg+xml;utf8,${encodeURIComponent(badgeIcons[badgeName])}`
        );
        return itemNode;
    }
}

// Example
// =======

const cellNamespace = {
    ...shapes,
    Rectangle
};

const graph = new dia.Graph({}, { cellNamespace });
const paper = new dia.Paper({
    el: document.getElementById("paper"),
    width: 600,
    height: 600,
    model: graph,
    cellViewNamespace: cellNamespace,
    async: true
});

paper.on({
    "element:mouseenter": (elementView) => {
        addRemoveTagTools(elementView);
    },
    "element:mouseleave": (elementView) => {
        elementView.removeTools();
    },
    "element:badge:pointerdown": (elementView, evt) => {
        elementView.preventDefaultInteraction(evt);
        console.log(`Badge clicked: ${evt.currentTarget.dataset.name}`);
    },
    "element:tag:pointerdown": (elementView, evt) => {
        elementView.preventDefaultInteraction(evt);
        console.log(`Tag clicked: ${evt.currentTarget.dataset.name}`);
    }
});

const rectangle = new Rectangle({
    position: { x: 100, y: 300 },
    attrs: {
        label: {
            text: "Rectangle with tags and badges"
        }
    }
});

rectangle.addTo(graph);

document.getElementById("add-tag").addEventListener("click", () => {
    const words = Object.keys(window);
    const randomWord = words[Math.floor(Math.random() * words.length)];
    rectangle.addTag(randomWord);
});

document.getElementById("remove-all-tags").addEventListener("click", () => {
    rectangle.set("tags", []);
    addRemoveTagTools(rectangle.findView(paper));
});

document.getElementById("preferred-width").value = DEFAULT_PREFERRED_WIDTH;
document
    .getElementById("preferred-width")
    .addEventListener("input", (event) => {
        const preferredWidth = parseInt(event.target.value, 10);
        if (!isNaN(preferredWidth) && preferredWidth > 0) {
            rectangle.set("preferredWidth", preferredWidth);
            rectangle.resetLayout();
        }
    });

const initialBadges = [];
Object.keys(badgeIcons).forEach((badgeIcon, badgeName) => {
    const checkbox = document.getElementById(`badge-${badgeIcon}`);
    if (checkbox.checked) {
        initialBadges.push(badgeIcon);
    }
    checkbox.addEventListener("change", (event) => {
        const badges = (rectangle.get("badges") || []).filter(
            (b) => b !== badgeIcon
        );
        if (event.target.checked) {
            badges.push(badgeIcon);
        }
        rectangle.set("badges", badges);
    });
});

rectangle.set("tags", [
    "Tag 1",
    "Tag Two",
    "3rd Tag",
    "Another Tag",
    "Last Tag"
]);
rectangle.set("badges", initialBadges);

Tags.add(rectangle.findView(paper), "root", "tags");

Badges.add(rectangle.findView(paper), "root", "badges", {
    attribute: "badges",
    position: "top-right",
    size: 24,
    gap: 0,
    margin: { top: -18, right: 10 }
});

const link = new shapes.standard.Link({
    source: { x: 100, y: 100 },
    target: { id: rectangle.id },
    z: -1,
    attrs: {
        line: {
            stroke: "#AA4465",
            strokeWidth: 1,
            sourceMarker: {
                type: "circle",
                r: 4
            }
        }
    }
});
link.addTo(graph);
