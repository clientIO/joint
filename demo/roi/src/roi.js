const { shapes: defaultShapes, dia, util } = joint;

const MAIN_COLOR = '#D4D9D7';
const SECONDARY_COLOR = '#EAECEA';
const BTC_COLOR = '#9C9EC8';
const GOLD_COLOR = '#F7E3AE';
const SP500_COLOR = '#FFCCD6';

const currentYear = 2023;

const data = {
    '2013': {
        gold: 1685.50,
        bitcoin: 13.51,
        sp500: 1480.40
    },
    '2014': {
        gold: 1219.75,
        bitcoin: 771.40,
        sp500: 1822.36
    },
    '2015': {
        gold: 1184.25,
        bitcoin: 314.25,
        sp500: 2028.18
    },
    '2016': {
        gold: 1060.20,
        bitcoin: 434.33,
        sp500: 1918.60
    },
    '2017': {
        gold: 1162.00,
        bitcoin: 998.33,
        sp500: 2275.12
    },
    '2018': {
        gold: 1312.80,
        bitcoin: 13657.20,
        sp500: 2789.80
    },
    '2019': {
        gold: 1287.20,
        bitcoin: 3800,
        sp500: 2607.39
    },
    '2020': {
        gold: 1520.55,
        bitcoin: 7197.92,
        sp500: 3278.20
    },
    '2021': {
        gold: 1947.60,
        bitcoin: 29624.63,
        sp500: 3793.75
    },
    '2022': {
        gold: 1800.10,
        bitcoin: 47434.29,
        sp500: 4573.82
    },
    '2023': {
        gold: 1824.16,
        bitcoin: 16610.44,
        sp500: 3960.66
    }
};

// TODO: fixed in other PR
joint.dia.attributes.value = {
    set: function(value, _, node) {
        node.value = value;
    }
};

const shapes = { ...defaultShapes };
const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: '100%',
    height: '100%',
    model: graph,
    async: true,
    cellViewNamespace: shapes,
    sorting: dia.Paper.sorting.APPROX,
    defaultConnector: {
        name: 'curve'
    },
    defaultConnectionPoint: {
        name: 'anchor',
    },
    background: {
        color: '#f6f4f4',
    },
    preventDefaultViewAction: false,
    interactive: {
        stopDelegation: false
    },
    elementView: dia.ElementView.extend({

        events: {
            'change input,select': 'onInputChange',
        },

        onInputChange: function(evt) {
            const input = evt.target;
            if (!input.validity.valid) return;
            const valuePath = input.getAttribute('joint-selector') + '/value';
            const currentValue = this.model.attr(valuePath);
            this.model.attr(valuePath, input.value, { previousValue: currentValue, calc: true });
        }
    })
});

// Define various shapes for the demo.

class ForeignObjectElement extends dia.Element {

    defaults() {
        return {
            ...super.defaults,
            attrs: {
                body: {
                    rx: 10,
                    ry: 10,
                    width: 'calc(w)',
                    height: 'calc(h)',
                    stroke: '#333333',
                    fill: MAIN_COLOR,
                    strokeWidth: 2
                },
                foreignObject: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                }
            }
        };
    }
}

class Investment extends ForeignObjectElement {
    defaults() {
        return {
            ...super.defaults(),
            type: 'Investment',
            size: {
                width: 140,
                height: 225
            },
        };
    }

    preinitialize() {
        this.markup = util.svg/* xml */`
            <rect @selector="body" />
            <foreignObject @selector="foreignObject" overflow="hidden">
                <div @selector="content"
                    class="jj-form"
                    xmlns="http://www.w3.org/1999/xhtml"
                >
                    <h2>Investment</h2>
                    <p id="test">How much did you invest?</p>
                    <input @selector="funds" class="jj-input" type="number"/>
                    <p>What year it was?</p>
                    <select @selector="year" class="jj-input" type="number">
                        <option value="2013">2013</option>
                        <option value="2014">2014</option>
                        <option value="2015">2015</option>
                        <option value="2016">2016</option>
                        <option value="2017">2017</option>
                        <option value="2018">2018</option>
                        <option value="2019">2019</option>
                        <option value="2020">2020</option>
                        <option value="2021">2021</option>
                        <option value="2022">2022</option>
                        <option value="2023">2023</option>
                    </select>

                </div>
            </foreignObject>
        `;
    }

    getFunds() {
        return Number(this.attr('funds/value'));
    }

    getYear() {
        return Number(this.attr('year/value'));
    }
}

class Product extends ForeignObjectElement {

    defaults() {
        return {
            ...super.defaults(),
            type: 'Product',
            size: {
                width: 140,
                height: 120
            },
        };
    }

    preinitialize() {
        this.markup = util.svg/* xml */`
            <rect @selector="body" />
            <foreignObject @selector="foreignObject" overflow="hidden">
                <div @selector="content"
                    class="jj-form"
                    xmlns="http://www.w3.org/1999/xhtml"
                >
                    <p>What percentage did you invest in <b @selector="label"></b>?</p>
                    <div class="jj-field">
                        <input @selector="percentage"
                            class="jj-input"
                            type="number"
                            style="width: 100%;"
                            min="0"
                            max="100"
                            step="1"
                        />
                        <label style="margin-left: 4px;">%</label>
                    </div>
                </div>
            </foreignObject>
        `;
    }

    getPercentage() {
        return Number(this.attr('percentage/value'));
    }

    setPercentage(value) {
        this.attr('percentage/value', value);
    }

    getValue() {
        return Number(this.attr('value/value'));
    }

    getName() {
        return this.get('name');
    }
}

class ProductPerformance extends ForeignObjectElement {

    defaults() {
        return {
            ...super.defaults(),
            type: 'ProductPerformance',
            size: {
                width: 200,
                height: 100
            },
        };
    }

    preinitialize() {
        this.markup = util.svg/* xml */`
            <rect @selector="body" />
            <foreignObject @selector="foreignObject" overflow="hidden">
                <div @selector="content"
                    class="jj-form"
                    xmlns="http://www.w3.org/1999/xhtml"
                >
                    <b @selector="label"></b>
                    <div class="jj-field">
                        <label for="value">Value</label>
                        <input @selector="value"
                            class="jj-input"
                            name="value"
                            type="number"
                            readonly="true"
                            style="width: 100px;"
                        />
                    </div>
                    <div class="jj-field">
                        <label for="roi">ROI</label>
                        <input @selector="roi"
                            class="jj-input"
                            name="roi"
                            type="number"
                            readonly="true"
                            style="width: 100px;"
                        />
                    </div>
                </div>
            </foreignObject>
        `;
    }

    setValue(value) {
        this.attr('value/value', value);
    }

    getValue() {
        return Number(this.attr('value/value'));
    }

    setROI(roi) {
        this.attr('roi/value', roi);
    }
}


class OverallPerformance extends ForeignObjectElement {

    defaults() {
        return {
            ...super.defaults(),
            type: 'OverallPerformance',
        };
    }

    preinitialize() {
        this.markup = util.svg/* xml */`
            <rect @selector="body" />
            <foreignObject @selector="foreignObject" overflow="hidden">
                <div @selector="content"
                    class="jj-form"
                    xmlns="http://www.w3.org/1999/xhtml"
                    style="justify-content: space-between;"
                >
                    <p>This is your portfolio now in <b>${currentYear}</b>.</p>
                    <div style="width: 100%">
                        <p>Your overall performance of investment is:</p>
                        <div class="jj-field">
                            <label for="value">Value</label>
                            <input @selector="value"
                                class="jj-input"
                                name="value"
                                type="number"
                                readonly="true"
                                style="width: 150px;"
                            />
                        </div>
                        <div class="jj-field">
                            <label for="roi">ROI</label>
                            <input @selector="roi"
                                class="jj-input"
                                name="roi"
                                type="number"
                                readonly="true"
                                style="width: 150px;"
                            />
                        </div>
                    </div>
                </div>
            </foreignObject>
        `;
    }

    setValue(value) {
        this.attr('value/value', value);
    }

    setROI(roi) {
        this.attr('roi/value', roi);
    }
}

class Link extends shapes.standard.DoubleLink {

    defaults() {
        return util.defaultsDeep({
            type: 'Link',
            attrs: {
                line: {
                    stroke: '#333333',
                    targetMarker: {
                        'stroke-width': 2,
                    }
                },
                outline: {
                    strokeWidth: 8
                }
            }
        }, super.defaults);
    }
}

// Create shapes and populate the graph.

const investment = new Investment({
    position: { x: 100, y: 280 },
    z: 1,
    attrs: {
        funds: {
            value: 100,
            tabindex: 1,
        },
        year: {
            value: 2018,
            tabindex: 2,
        }
    }

});

const gold = new Product({
    position: { x: 300, y: 100 },
    name: 'gold',
    z: 3,
    attrs: {
        body: {
            fill: GOLD_COLOR
        },
        label: {
            html: 'Gold'
        },
        percentage: {
            value: 25,
            tabindex: 3,
        }
    }
});

const bitcoin = new Product({
    position: { x: 300, y: 330 },
    name: 'bitcoin',
    z: 5,
    attrs: {
        body: {
            fill: BTC_COLOR
        },
        label: {
            html: 'Bitcoin'
        },
        percentage: {
            value: 25,
            tabindex: 4,
        }
    }
});

const sp500 = new Product({
    position: { x: 300, y: 560 },
    name: 'sp500',
    z: 7,
    attrs: {
        body: {
            fill: SP500_COLOR
        },
        label: {
            html: 'S&P 500'
        },
        percentage: {
            value: 50,
            tabindex: 5,
        }
    }
});

const goldPerformance = new ProductPerformance({
    position: { x: 600, y: 200 },
    z: 0,
    attrs: {
        label: {
            html: 'Gold'
        },
        value: {
            tabindex: 6,
        },
        roi: {
            tabindex: 7,
        }
    }
});

const bitcoinPerformance = new ProductPerformance({
    position: { x: 600, y: 320 },
    z: 0,
    attrs: {
        label: {
            html: 'Bitcoin'
        },
        value: {
            tabindex: 8,
        },
        roi: {
            tabindex: 9,
        }
    }
});

const sp500Performance = new ProductPerformance({
    position: { x: 600, y: 440 },
    z: 0,
    attrs: {
        label: {
            html: 'S&P 500'
        },
        value: {
            tabindex: 10,
        },
        roi: {
            tabindex: 11,
        }
    }
});

const performance = new OverallPerformance({
    position: { x: 500, y: 300 },
    z: -1,
    attrs: {
        body: {
            fill: SECONDARY_COLOR
        },
        value: {
            tabindex: 12,
        },
        roi: {
            tabindex: 13,
        }
    }
});

const link1 = new Link({
    source: { id: investment.id, anchor: { name: 'top', args: { dy: 1 }}},
    target: { id: gold.id, anchor: { name: 'left', args: { dx: -5 }}},
    z: 2,
    attrs: {
        line: {
            stroke: MAIN_COLOR,
        }
    }
});

const link2 = new Link({
    source: { id: investment.id, anchor: { name: 'right', args: { dx: -1 }}},
    target: { id: bitcoin.id, anchor: { name: 'left', args: { dx: -5 }}},
    z: 2,
    attrs: {
        line: {
            stroke: MAIN_COLOR,
        }
    }
});

const link3 = new Link({
    source: { id: investment.id, anchor: { name: 'bottom', args: { dy: -1 }}},
    target: { id: sp500.id, anchor: { name: 'left', args: { dx: -5 }}},
    z: 2,
    attrs: {
        line: {
            stroke: MAIN_COLOR,
        }
    }
});

const link4 = new Link({
    source: { id: gold.id, anchor: { name: 'right', args: { dx: -1 }}},
    target: { id: goldPerformance.id, anchor: { name: 'left', args: { dx: -5 }}},
    z: 4,
    attrs: {
        line: {
            stroke: GOLD_COLOR,
        }
    }
});

const link5 = new Link({
    source: { id: bitcoin.id, anchor: { name: 'right', args: { dx: -1 }}},
    target: { id: bitcoinPerformance.id, anchor: { name: 'left', args: { dx: -5 }}},
    z: 5,
    attrs: {
        line: {
            stroke: BTC_COLOR,
        }
    }

});

const link6 = new Link({
    source: { id: sp500.id, anchor: { name: 'right', args: { dx: -1 }}},
    target: { id: sp500Performance.id, anchor: { name: 'left', args: { dx: -5 }}},
    z: 7,
    attrs: {
        line: {
            stroke: SP500_COLOR,
        }
    }
});

const products  = [gold, bitcoin, sp500];
const productPerformances = [goldPerformance, bitcoinPerformance, sp500Performance];
const links = [link1, link2, link3, link4, link5, link6];
graph.resetCells([investment, ...products, performance, ...productPerformances, ...links]);
performance.embed(productPerformances);
performance.fitEmbeds({ padding: { horizontal: 30, top: 50, bottom: 130 }});

// Setup automatic calculation of performance

graph.on('change:attrs', (cell, attrs, { calc, previousValue, propertyValue }) => {
    if (!calc) return;
    if (cell instanceof Product) {
        let diff = previousValue - propertyValue;
        const productIndex = products.findIndex(p => p.id === cell.id);
        // sort products so the first product to modify is
        // below the one that was changed
        const sortedProducts = [
            ...products.slice(productIndex + 1, products.length),
            ...products.slice(0, productIndex)
        ];
        sortedProducts.forEach((product, index) => {
            const percentage = product.getPercentage() + diff;
            product.setPercentage(Math.max(percentage, 0));
            diff = (percentage < 0) ? percentage: 0;
        });
    }
    calculatePerformance();
});

function calculatePerformance() {
    productPerformances.forEach(productPerf => {
        const [product] = graph.getNeighbors(productPerf, { inbound: true });
        const value = calculateProductValue(product);
        const roi = calculateProductROI(product.getPercentage(), value);
        productPerf.setValue(value.toFixed(2));
        productPerf.setROI(roi.toFixed(2));
    });
    const overallValue = productPerformances.reduce((total, productPerf) => total + productPerf.getValue(), 0);
    const overallRoi = calculateProductROI(100, overallValue);
    performance.setValue(overallValue.toFixed(2));
    performance.setROI(overallRoi.toFixed(2));
}

function calculateProductValue(product) {
    const year = investment.getYear();
    const funds = investment.getFunds();
    const productName = product.getName();
    const buyUnitPrice = data[year][productName];
    const sellUnitPrice = data[currentYear][productName];
    return funds * product.getPercentage() / 100 * (sellUnitPrice / buyUnitPrice) ;
}

function calculateProductROI(percentage, value) {
    const funds = investment.getFunds();
    const cost = funds * percentage / 100;
    return (value - cost) / cost * 100;
}

calculatePerformance();

