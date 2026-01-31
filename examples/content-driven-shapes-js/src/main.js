import { dia, shapes, util } from '@joint/core';
import './styles.css';

// Paper

const paperContainer = document.getElementById("paper-container");

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: "100%",
    height: "100%",
    gridSize: 20,
    drawGrid: { name: "mesh" },
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: "#F3F7F6" }
});

paperContainer.appendChild(paper.el);

const svg = paper.svg;

function measureText(svgDocument, text, attrs) {
    const vText = V("text").attr(attrs).text(text);
    vText.appendTo(svgDocument);
    const bbox = vText.getBBox();
    vText.remove();
    return bbox;
}

class Shape extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: "custom.Shape",
            fillColor: "#FCFCFC",
            outlineColor: "#A3A5A5",
            label: "",
            image: ""
        };
    }

    preinitialize() {
        this.spacing = 10;
        this.labelAttributes = {
            "font-size": 14,
            "font-family": "sans-serif"
        };
        this.imageAttributes = {
            width: 50,
            height: 50,
            preserveAspectRatio: "none"
        };
        this.cache = {};
    }

    initialize() {
        super.initialize();
        this.on("change", this.onAttributeChange);
        this.setSizeFromContent();
    }

    /* Attributes that affects the size of the model. */
    onAttributeChange() {
        const { changed, cache } = this;
        if ("label" in changed) {
            // invalidate the cache only if the text of the `label` has changed
            delete cache.label;
        }
        if ("label" in changed || "image" in changed) {
            this.setSizeFromContent();
        }
    }

    setSizeFromContent() {
        delete this.cache.layout;
        const { width, height } = this.layout();
        this.resize(width, height);
    }

    layout() {
        const { cache } = this;
        let { layout } = cache;
        if (layout) {
            return layout;
        } else {
            const layout = this.calcLayout();
            cache.layout = layout;
            return layout;
        }
    }

    calcLayout() {
        const {
            attributes,
            labelAttributes,
            imageAttributes,
            spacing,
            cache
        } = this;
        let width = spacing * 2;
        let height = spacing * 2;
        let x = spacing;
        let y = spacing;
        // image metrics
        let $image;
        if (attributes.image) {
            const { width: w, height: h } = imageAttributes;
            $image = {
                x,
                y,
                width: w,
                height: h
            };
            height += spacing + h;
            y += spacing + h;
            width += w;
        } else {
            $image = null;
        }
        // label metrics
        let $label;
        {
            let w, h;
            if ("label" in cache) {
                w = cache.label.width;
                h = cache.label.height;
            } else {
                const { width, height } = measureText(
                    svg,
                    attributes.label,
                    labelAttributes
                );
                w = width;
                h = height;
                cache.label = {
                    width,
                    height
                };
            }
            width = Math.max(width, spacing + w + spacing);
            height += h;
            if (!h) {
                // no text
                height -= spacing;
            }
            $label = {
                x,
                y,
                width: w,
                height: h
            };
        }
        // root metrics
        return {
            x: 0,
            y: 0,
            width,
            height,
            $image,
            $label
        };
    }
}

const ElementView = dia.ElementView;

const ShapeView = ElementView.extend({
    presentationAttributes: ElementView.addPresentationAttributes({
        // attributes that changes the position and size of the DOM elements
        label: [ElementView.Flags.UPDATE],
        image: [ElementView.Flags.UPDATE],
        // attributes that do not affect the size
        outlineColor: ["@color"],
        fillColor: ["@color"]
    }),

    confirmUpdate: function (...args) {
        let flags = ElementView.prototype.confirmUpdate.call(this, ...args);
        if (this.hasFlag(flags, "@color")) {
            // if only a color is changed, no need to resize the DOM elements
            this.updateColors();
            flags = this.removeFlag(flags, "@color");
        }
        // must return 0
        return flags;
    },

    /* Runs only once while initializing */
    render: function () {
        const { vel, model } = this;
        const body = (this.vBody = V("rect")
            .addClass("body")
            .attr("stroke-width", 2));
        const label = (this.vLabel = V("text")
            .addClass("label")
            .attr(model.labelAttributes));
        this.vImage = V("image").addClass("image").attr(model.imageAttributes);
        vel.empty().append([body, label]);
        this.update();
        this.updateColors();
        this.translate(); // default element translate method
    },

    update: function () {
        const layout = this.model.layout();
        this.updateBody(layout);
        this.updateImage(layout.$image);
        this.updateLabel(layout.$label);
    },

    updateColors: function () {
        const { model, vBody } = this;
        vBody.attr({
            fill: model.get("fillColor"),
            stroke: model.get("outlineColor")
        });
    },

    updateBody: function () {
        const { model, vBody } = this;
        const { width, height } = model.size();
        const bodyAttributes = {
            width,
            height
        };
        vBody.attr(bodyAttributes);
    },

    updateImage: function ($image) {
        const { model, vImage, vel } = this;
        const image = model.get("image");
        if (image) {
            if (!vImage.parent()) {
                vel.append(vImage);
            }
            vImage.attr({
                "xlink:href": image,
                x: $image.x,
                y: $image.y
            });
        } else {
            vImage.remove();
        }
    },

    updateLabel: function ($label) {
        const { model, vLabel } = this;
        vLabel.attr({
            "text-anchor": "middle",
            x: $label.x + $label.width / 2,
            y: $label.y + $label.height / 2
        });
        vLabel.text(model.get("label"), {
            textVerticalAnchor: "middle"
        });
    }
});

shapes.custom = {
    Shape,
    ShapeView
};

// Example

const customShape1 = new Shape({
    label: "The simplest shape"
});
customShape1.position(60, 40).addTo(graph);

const customShape2 = new Shape();
customShape2
    .set("label", "A multiline\n text with no image.")
    .position(60, 100)
    .prop("fillColor", "#EBACCF")
    .prop("outlineColor", "#d80073")
    .addTo(graph);

const customShape3 = new Shape();
customShape3
    .set("image", "https://via.placeholder.com/50/DDDDDD")
    .position(220, 40)
    .prop("fillColor", "#B9DBBB")
    .prop("outlineColor", "#339933")
    .prop(
        "label",
        "Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit.\nInteger vehicula."
    )
    .addTo(graph);

const customShape4 = new Shape();
customShape4
    .set("image", "https://via.placeholder.com/50/DDDDDD")
    .set("label", "")
    .prop("fillColor", "#93B8C7")
    .prop("outlineColor", "#1ba1e2")
    .position(60, 180)
    .addTo(graph);

customShape4.transition(
    "label",
    "Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit.\nInteger vehicula.",
    {
        delay: 200,
        duration: 3000,
        valueFunction: function (start, end) {
            return function (time) {
                return end.substr(0, Math.ceil(end.length * time));
            };
        }
    }
);
