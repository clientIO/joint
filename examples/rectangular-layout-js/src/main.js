const { dia, shapes, util } = joint;

const width = 100;
const height = 80;

const graph = new dia.Graph(
    {},
    {
        cellNamespace: shapes
    }
);

const paper = new dia.Paper({
    el: document.getElementById("paper"),
    model: graph,
    cellViewNamespace: shapes,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    interactive: false,
    defaultConnectionPoint: {
        name: "rectangle"
    },
    background: { color: "#F3F7F6" }
});

function squareLayout(elements, options = {}) {
    const count = elements.length;
    if (count < 2) return null;

    const { x = 0, y = 0, gap = 10 } = options;
    const { width, height } = elements[0].size();

    let firstRowElementCount = Math.ceil(count / 4) + 1;
    let middleRowsCount = Math.ceil(count / 4) - 1;
    let lastRowElementCount = count - firstRowElementCount - 2 * middleRowsCount;
    let lastRowElementGap = gap;

    switch (firstRowElementCount - lastRowElementCount) {
        case 0:
            // nothing to do
            break;
        case 1: {
            lastRowElementGap += (width + gap) / (lastRowElementCount - 1);
            break;
        }
        case 2: {
            middleRowsCount -= 1;
            lastRowElementCount += 2;
            break;
        }
        case 3: {
            middleRowsCount -= 1;
            lastRowElementCount += 2;
            lastRowElementGap += (width + gap) / (lastRowElementCount - 1);
            break;
        }
    }

    const totalWidth =
        firstRowElementCount * width + (firstRowElementCount - 1) * gap;
    const totalHeight = (middleRowsCount + 2) * height + middleRowsCount * gap;

    for (let i = 0; i < firstRowElementCount; i++) {
        elements[i].position(x + i * (width + gap), y);
    }
    for (let i = 0; i < middleRowsCount; i++) {
        elements[firstRowElementCount + 2 * i].position(
            x,
            y + (1 + i) * (height + gap)
        );
        elements[firstRowElementCount + 2 * i + 1].position(
            x + (firstRowElementCount - 1) * (width + gap),
            y + (1 + i) * (height + gap)
        );
    }
    for (let i = 0; i < lastRowElementCount; i++) {
        elements[firstRowElementCount + 2 * middleRowsCount + i].position(
            x + i * (width + lastRowElementGap),
            y + (middleRowsCount + 1) * (height + gap)
        );
    }

    return new g.Rect(x, y, totalWidth, totalHeight);
}

const templateElement = new shapes.standard.Rectangle({
    size: {
        width,
        height
    },
    attrs: {
        body: {
            strokeWidth: 2
        },
        label: {
            fontFamily: "sans-serif",
            fontSize: 17
        }
    }
});

function generate(count, options) {
    const root = templateElement.clone().prop({
        attrs: {
            body: {
                fill: "#ff9580"
            },
            label: {
                text: "Rectangular\nLayout"
            }
        }
    });

    const colorFn = util.interpolate.hexColor("#00879b", "#80eaff");
    const els = Array.from({ length: count }).map((_, index) => {
        return templateElement.clone().prop({
            attrs: {
                body: {
                    fill: colorFn(index / count)
                },
                label: {
                    text: `${index + 1}`
                }
            }
        });
    });

    const links = els.map((el) => {
        return new shapes.standard.Link({
            source: {
                id: root.id
            },
            target: {
                id: el.id
            }
        });
    });

    graph.resetCells([root, ...els, ...links]);
    const bbox = squareLayout(els, options);

    if (bbox) {
        const center = bbox.center();
        root.position(center.x - width / 2, center.y - height / 2);
    }

    paper.fitToContent({
        useModelGeometry: true,
        padding: 20,
        allowNewOrigin: "any"
    });
}

function readInputs() {
    const count = Number(document.getElementById("count").value);
    const gap = Number(document.getElementById("gap").value);
    generate(count, { gap });
}

const debouncedReadInputs = util.debounce(readInputs, 10);

document.getElementById("count").addEventListener("input", debouncedReadInputs);
document.getElementById("gap").addEventListener("input", debouncedReadInputs);

generate(20);
