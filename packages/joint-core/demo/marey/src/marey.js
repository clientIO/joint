const { dia, shapes, linkTools, mvc } = joint;
const { tsvParse } = d3;

const BG_COLOR = '#F3F7F6';
const ZOOM_SPEED = 1.1;

const timeRegex = /(\d+):(\d+)(\w+)/;

function timeToNumber(time) {
    const match = timeRegex.exec(time.toLowerCase());
    if (!match) return null;
    const [,h,m,ap] = match;
    return Number(h) * 60 + Number (m) + (ap === 'pm'
        ? (h === '12') ? 0 : 60 * 12
        : (h === '12') ? -60 * 12 : 0);
}

function numberToTime(number) {
    let hours = Math.floor(number / 60);
    let minutes = number % 60;
    const ap = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    hours = hours || 12;
    return `${hours}:${String(minutes).padStart(2, '0')} ${ap}`;
}

function readTrain(stations, train) {
    return {
        number: train.number,
        type: train.type,
        direction: train.direction,
        stops: stations
            .map((s) => ({
                station: s,
                time: timeToNumber(train[s.key]) || null,
            }))
    };
}

function readStations(parsed) {
    const stations = [];
    const [d] = parsed;
    for (let k of Object.keys(d)) {
        if (/^stop\|/.test(k)) {
            const p = k.split('|');
            stations.push({ key: k, name: p[1], distance: +p[2], zone: +p[3] });
        }
    }
    return stations;
}

async function fetchTSV(filename) {
    const response = await fetch(filename);
    const tsvString = await response.text();
    const parsedTSV = tsvParse(tsvString);
    const stations = readStations(parsedTSV);
    return {
        trains: parsedTSV.map((train) => readTrain(stations, train)),
        stations
    };
}

function drawStations({ stations, X0, X1, Y0, HEIGHT, Y1, WIDTH, SCALE_Y }) {
    const stationsVEl = V('g');
    V('rect')
        .attr({
            fill: BG_COLOR,
            x: 0,
            y: 0,
            width: X0,
            height: Y0 + HEIGHT + Y1,
            opacity: 0.9
        })
        .appendTo(stationsVEl);

    V('rect')
        .attr({
            fill: BG_COLOR,
            x: X0 + WIDTH,
            y: 0,
            width: X1,
            height: Y0 + HEIGHT + Y1,
            opacity: 0.9
        })
        .appendTo(stationsVEl);

    stations.forEach(station => {
        const y = Y0 + station.distance * SCALE_Y;
        V('text')
            .attr({
                'x': X0 - 10,
                'y': y,
                'text-anchor': 'end',
                'font-family': 'sans-serif',
                'font-size': 12
            })
            .text(station.name, { textVerticalAnchor: 'middle' })
            .appendTo(stationsVEl);
    });

    return stationsVEl.node;
}

function drawLines({ stations, X0, Y0, SCALE_Y, WIDTH }) {
    const linesVEl = V('g');
    stations.forEach(station => {
        const y = Y0 + station.distance * SCALE_Y;
        V('path', {
            'stroke': 'lightgray',
            'd': `M ${X0} ${y} h ${WIDTH}`
        }).appendTo(linesVEl);
    });
    return linesVEl.node;
}

function calcStep(span) {
    let count = Math.ceil(span / 60);
    if (count === 0) return null;
    let f = 1;
    if (count < 5) {
        while (count < 5) {
            const m = (60 % (f * 2)) ? 3 : 2;
            count *= m;
            f *= m;
        }
    } else {
        while (count > 12) {
            count /= 2;
            f /= 2;
        }
    }
    return 60 / f;
}

function drawTimes(min, max, width) {
    const vel = V('g');
    const step = calcStep(max - min);
    const offset = step - (min % step);
    let t = min + offset;
    while (t <= max) {
        const x = g.scale.linear([min, max], [0, width], t);
        vel.append([
            V('path', {
                'd': `M ${x} 0 v -5`,
                'stroke': '#333',
                'fill': 'none'
            }),
            V('text', {
                'x': x,
                'y': -10,
                'fill': '#333',
                'text-anchor': 'middle',
                'font-family': 'sans-serif',
                'font-size': 10
            }).text(numberToTime(t), {
                textVerticalAnchor: 'bottom'
            })
        ]);
        t += step;
    }
    return vel;
}

class TimeAxisView extends mvc.View {

    DETACHABLE = false;

    preinitialize() {
        this.tagName = 'g';
        this.svgElement = true;
    }

    constructor(options) {
        super(options);
        this.options = options;
    }

    update( min, max, width) {
        const { options } = this;
        Object.assign(options, { min, max, width });
        options.paper.requestViewUpdate(this, 1, 1);
    }

    confirmUpdate() {
        const { min, max, width } = this.options;
        this.vel.empty().append(drawTimes(min, max, width).children());
        return 0;
    }

}

const markerSVGAttributes = {
    'type': 'circle',
    'stroke': BG_COLOR,
    'stroke-width': 1,
    'r': 4
};

const TrainLinkType = 'Train';

class Train extends dia.Link {

    defaults() {
        return {
            type: TrainLinkType,
            z: 0,
            attrs: {
                line: {
                    connection: true,
                    stroke: '#333333',
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    sourceMarker: {
                        ...markerSVGAttributes
                    },
                    vertexMarker: {
                        ...markerSVGAttributes
                    },
                    targetMarker: {
                        ...markerSVGAttributes
                    }
                },
                wrapper: {
                    connection: true,
                    strokeWidth: 15,
                    strokeLinejoin: 'round'
                }
            }
        };
    }

    markup = [{
        tagName: 'path',
        selector: 'wrapper',
        attributes: {
            'fill': 'none',
            'cursor': 'pointer',
            'stroke': 'transparent',
            'stroke-linecap': 'round'
        }
    }, {
        tagName: 'path',
        selector: 'line',
        attributes: {
            'fill': 'none',
            'pointer-events': 'none'
        }
    }];

    get direction() {
        return this.get('direction');
    }

    get points() {
        return this.get('points');
    }

    set points(points) {
        this.set('points', points);
    }

    isWithinTimeRange(from, to) {
        const [xs, xt] = this.getTimeRange();
        if (xt > xs) {
            if (xs > to || xt < from) return false;
        } else {
            if (xs > to && xt < from) return false;
        }
        return true;
    }

    getTimeRange() {
        const { direction } = this;
        const times = this.getStopsTimes();
        const xs = times[0];
        const xt =  times[times.length - 1];
        if (direction === 'S') {
            return [xs, xt];
        } else {
            return [xt, xs];
        }
    }

    getPointIndex(stopIndex) {
        const time = this.getStopsTimes()[stopIndex];
        return this.points.findIndex(p => p && p.x === time);
    }

    getStopsTimes() {
        return this.points.filter(p => p !== null).map(p => p.x);
    }

    changeStopTime(stopIndex, time) {
        const { points, direction } = this;
        const index = this.getPointIndex(stopIndex);
        const { x: prevTime } = points[index];
        let changedPoints;
        let timeDiff = time - prevTime;
        if (direction === 'S') {
            changedPoints = points.slice(index);
            const { x: minTime } = points.slice(0, index).filter(p => p !== null).reverse()[0] || { x: 0 };
            if (time <= minTime) {
                time = minTime + 1;
            }
            timeDiff = time - prevTime;
        } else {
            changedPoints = points.slice(0, index + 1);
            const { x: minTime } = points.slice(index + 1).filter(p => p !== null)[0] || { x: 0 };
            if (time <= minTime) {
                time = minTime + 1;
            }
            timeDiff = time - prevTime;
        }
        if (timeDiff === 0) return;
        changedPoints.forEach(point => {
            if (point) point.x = (point.x + timeDiff + 24 * 60) % (24 * 60);
        });
    }

    usePoints(points) {
        const source = points[0];
        const target = points[points.length - 1];
        this.set({
            source,
            target,
            vertices: points
        });
    }

    transformPoints(matrix) {
        this.usePoints(
            this.points
                .filter(p => p !== null)
                .map(p =>  V.transformPoint(p, matrix).toJSON())
        );
    }

    static randomColor() {
        return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    }

    static create(
        id,
        points,
        direction,
        color = this.randomColor()
    ) {
        if (points.length < 2) throw Error('Not enough stations to create a train.');
        return new this({
            id,
            direction,
            points,
            attrs: {
                root: {
                    title: `Train no. ${id} (${direction}).`
                },
                line: {
                    stroke: color
                }
            }
        });
    }
}

Object.assign(shapes, { [TrainLinkType]: Train });

const graph = new dia.Graph({}, { cellNamespace: shapes });

const paper = new dia.Paper({
    cellViewNamespace: shapes,
    el: document.getElementById('paper'),
    model: graph,
    frozen: true,
    async: true,
    width: 'calc(100% - 20px)',
    height: 'calc(100% - 70px)',
    interactive: { linkMove: false },
    background: {
        color: BG_COLOR
    },
    defaultConnector: function() {
        const linkView = this;
        const { direction, attributes } = linkView.model;
        const path = new g.Path();
        const [firstPoint, ...points] = attributes.vertices;
        let p0 = new g.Point(firstPoint);
        path.appendSegment(g.Path.createSegment('M', p0));
        for (let i = 0, n = points.length; i < n; i++) {
            const p1 = new g.Point(points[i]);
            if (direction === 'S' ? p0.x <= p1.x : p0.x >= p1.x) {
                path.appendSegment(g.Path.createSegment('L', p1));
            } else {
                path.appendSegment(g.Path.createSegment('M', p1));
            }
            p0 = p1;
        }
        return path;
    },
    viewport: (view) => {
        const train = view.model;
        return train.isWithinTimeRange(MIN, MAX);
    }
});

paper.el.style.border = '1px solid #e2e2e2';

const styles = V.createSVGStyle(`
    .joint-link:hover [joint-selector="line"] {
        stroke-width: 5;
    }
    .joint-link [joint-selector="line"] {
        transition: 0.2s d;
    }
`);

const X0 = 140;
const X1 = 50;
const Y0 = 50;
const Y1 = 50;
const { width, height } = paper.getComputedSize();
const WIDTH = width - X0 - X1;
const HEIGHT = height - Y0 - Y1;

const HOUR = 60;
const MIN_TIME = 0;
const MAX_TIME = 24 * HOUR;
const MIN_SPAN = 15;

let TIME = 12 * 60;
let SPAN = 2 * 60;
let MIN, MAX, SCALE_X;

function updateRange() {
    MIN = TIME - SPAN / 2;
    MAX = TIME + SPAN / 2;
    if (MIN < 0) {
        TIME = SPAN / 2;
        updateRange();
        return;
    }
    if (MAX > 24 * 60) {
        TIME = 24 * 60 - SPAN / 2;
        updateRange();
        return;
    }
    SCALE_X = WIDTH / (MAX - MIN);
}

function zoomByDelta(delta) {
    const f = ZOOM_SPEED;
    if (delta > 0) {
        SPAN = Math.round(Math.max(SPAN / f, MIN_SPAN));
    } else {
        SPAN = Math.round(Math.min(SPAN * f, MAX_TIME));
    }
}

function zoomByRange(range, ctm = V.createSVGMatrix({})) {
    let min = V.transformPoint({ x: range[0], y: 0 }, ctm).x;
    let max = V.transformPoint({ x: range[1], y: 0 }, ctm).x;
    if (min > max) {
        // Trains are going through midnight
        min = MIN_TIME;
        max = MAX_TIME;
    }
    TIME = (min + max) / 2;
    SPAN = Math.max(max - min, MIN_SPAN);
}

(async function() {

    const { trains, stations } = await fetchTSV('https://assets.codepen.io/7589991/data.tsv');

    const SCALE_Y = HEIGHT / stations.reduce((max, stop) => Math.max(stop.distance, max), 0);

    const trainsCells = trains.reduce((cells, train) => {
        const { direction, stops, number } = train;
        const points = stops.map(({ time, station }) => {
            if (time !== null) {
                return { x: time, y: station.distance };
            } else {
                return null;
            }
        });
        cells.push(Train.create(number, points, direction));
        return cells;
    }, []);

    const back = paper.getLayerNode(dia.Paper.Layers.BACK);
    const front = paper.getLayerNode(dia.Paper.Layers.FRONT);
    // move the front layer above tools
    front.parentNode.append(front);

    back.append(drawLines({
        stations,
        X0,
        Y0,
        WIDTH,
        SCALE_Y
    }));

    paper.svg.append(drawStations({
        stations,
        X0,
        X1,
        Y0,
        Y1,
        WIDTH,
        HEIGHT,
        SCALE_Y
    }));

    const timeAxis = new TimeAxisView({ paper });
    timeAxis.el.setAttribute('transform', `translate(${X0}, ${Y0})`);
    front.append(timeAxis.el);

    function getCTM() {
        return V.createSVGMatrix({}).translate(X0 - MIN * SCALE_X, Y0).scaleNonUniform(SCALE_X, SCALE_Y);
    }

    function update() {
        updateRange();
        const matrix = getCTM();
        trainsCells.forEach((train) => train.transformPoints(matrix));
        timeAxis.update(MIN, MAX, WIDTH);
    }

    update();
    graph.addCells(trainsCells);
    paper.unfreeze({ batchSize: 100 });

    paper.on('blank:mousewheel', (evt, x, y, delta) => {
        evt.preventDefault();
        zoomByDelta(delta);
        update();
    });

    paper.on('cell:mousewheel', (cellView, evt, x, y, delta) => {
        evt.preventDefault();
        zoomByDelta(delta);
        update();
    });

    paper.on('blank:pointerdown', (evt) => {
        evt.data = { pan: true, x0: evt.clientX, t0: TIME };
    });

    paper.on('blank:pointermove', (evt) => {
        const { pan, x0, t0 } = evt.data;
        if (!pan) return;
        TIME = t0 - (evt.clientX - x0) / SCALE_X;
        update();
    });

    paper.on('link:pointerdblclick', (linkView) => {
        const train = linkView.model;
        zoomByRange(train.getTimeRange());
        update();
    });

    class StopsTool extends linkTools.Vertices {

        onHandleChanging(handle, evt) {
            const { relatedView: linkView } = this;
            const train = linkView.model;
            const index = Array.from(handle.el.parentNode.childNodes).indexOf(handle.el);
            const { x } = linkView.paper.clientToLocalPoint(evt.clientX, 0);
            const { x: time } = V.transformPoint({ x, y: 0 }, getCTM().inverse());
            train.changeStopTime(index, Math.round(time));
            train.transformPoints(getCTM());
        }

        onHandleChanged() {
            this.render();
        }
    }

    paper.on('link:contextmenu', (linkView) => {
        toggleEditMode(true);
        const tools = new dia.ToolsView({
            tools: [new StopsTool({
                vertexAdding: false,
                snapRadius: 0
            })]
        });
        linkView.addTools(tools);
    });

    paper.on('blank:contextmenu', (evt) => {
        evt.preventDefault();
        toggleEditMode(false);
    });

    function toggleEditMode(active) {
        paper.removeTools();
        if (active) {
            styles.remove();
        } else {
            paper.svg.prepend(styles);
        }
    }

    toggleEditMode(false);

})();
