var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('<div/>').prependTo(document.body).css({ border: '1px solid gray' }),
    width: 1200,
    height: 550,
    gridSize: 40,
    drawGrid: 'dot',
    model: graph
});

var Table = joint.dia.Element.define('basic.Table', {

    table: {
        metadata: {
            numberOfRows: 11,
            numberOfColumns: 11,
            element: '.table',
            cellWidth: 50,
            cellHeight: 30
        },
        fill: [
            { range: undefined, color: '#eeeeee' }, // whole table
            // { range: [0, 5, 5, 0], color: 'red' } // cells indexes - top, right, bottom left
        ],
        border: [
            { range: undefined, grid: true, sides: undefined, color: '#7c7c7c', size: 1 }, // whole table, every side
            { grid: false, color: 'black', size: 2 }, // whole table, every side
            { range: [8, 10, 10, 0], grid: true, size: 2, color: 'green' },
            { range: [0, 10, 0, 0], grid: true, sides: ['bottom'], size: 3, color: 'blue' }
        ],
        columns: {
            '0': { width: 100 },
            '5': { width: 50 },
            '2': { width: 20 },
            '7': { width: 50 },
            '8': { width: 30 },
            '9': { width: 20 },
            '10': { width: 10 }
        },
        rows: {
            '1': { height: 20, text: 'row header text' },
            '5': {
                cells: {
                    '0': { value: 'A' },
                    '1': { value: 'B' },
                    '8': { value: 'X' }
                }
            },
            '10': {
                cells: {
                    '5': { value: 'XXX' }
                }
            }
        }
    }
}, {

    markup: '<g><rect class="main-shape"/><text class="main-shape-text"/><g class="table" shape-rendering="optimizeSpeed"></g></g>',
    borderMarkup: V('<path class="border" stroke-width="1" />'),
    textMarkup: V('<text class="text" />'),
    fillMarkup: V('<rect class="fill" />'),

    initialize: function() {
        joint.dia.Element.prototype.initialize.apply(this, arguments);
        this.on('change:table', function() {
            this._cellCache = {};
        }.bind(this));
    },

    _getTableRow: function(rowIndex) {
        return this.prop('table/rows/' + rowIndex) || {};
    },

    _eachCell: function(action) {

        var rows = this.prop('table/rows') || {};

        var rowKeys = Object.keys(rows);
        for (var i = 0, n = rowKeys.length; i < n; i++) {
            var cells = rows[rowKeys[i]].cells || {};
            var cellKeys = Object.keys(rows[rowKeys[i]].cells || {});
            for (var j = 0, m = cellKeys.length; j < m; j++) {
                action(cells[cellKeys[j]], parseInt(rowKeys[i], 10), parseInt(cellKeys[j], 10));
            }
        }
    },

    /** Getter/setter cell properties.
     *
     * e.g `table.tableCellProp(0, 0, 'xxx')`
     *
     * @param {number} row Row index
     * @param {number} column Column index
     * @param {object=} value
     */
    tableCellProp: function(row, column, value) {

        if (value === undefined) {
            return this.prop(['table', 'rows', row + '', 'cells', column + '', 'value']);
        }
        return this.prop(['table', 'rows', row + '', 'cells', column + '', 'value'], value);
    },

    /** Getter/setter for column properties. Getter if value is `undefined`.
     *
     * e.g. resize 0th column: `table.tableColumnProp(0, { width: 120 })`
     *
     * @param {number} column Column index
     * @param {object=} value
     */
    tableColumnProp: function(column, value) {

        if (value === undefined) {
            return this.prop(['table', 'columns', column + '']);
        }
        return this.prop(['table', 'columns', column + ''], value);
    },

    /** Getter/setter for row properties. Getter if value is undefined.
     *
     * e.g. resize 0th row: `table.tableColumnProp(0, { height: 120 })`
     *
     * @param {number} row Column index
     * @param {object=} value
     */
    tableRowProp: function(row, value) {

        if (value === undefined) {
            return this.prop(['table', 'rows', row + '']);
        }
        return this.prop(['table', 'rows', row + ''], value);
    },

    _getTableColumn: function(columnIndex) {

        return this.prop('table/columns/' + columnIndex) || {};
    },

    _getTableRange: function() {
        var info = this.prop('table/metadata');
        return [0, info.numberOfColumns - 1, info.numberOfRows - 1, 0];
    },

    _getTableBorders: function() {

        return this.prop('table/border') || [];
    },

    _getTableFills: function() {

        return this.prop('table/fill') || [];
    },

    getTableCell: function(rowIndex, columnIndex) {

        var hash = rowIndex + '' + columnIndex + '';
        this._cellCache = this._cellCache || {};
        if (this._cellCache[hash]) {
            return this._cellCache[hash];
        }

        var row = this._getTableRow(rowIndex);
        var column = this._getTableColumn(columnIndex);
        var cells = row.cells || {};

        var cell = cells[columnIndex] || {};

        var info = this.prop('table/metadata');

        cell.width = column.width || info.cellWidth || 50;
        cell.height = row.height || info.cellHeight || 30;

        this._cellCache[hash] = cell;
        return cell;
    },

    _getCellBBox: function(row, column) {

        var bBox = g.Rect();
        var tableRange = this._getTableRange();

        var height = 0;
        for (var rowIndex = tableRange[0], n = tableRange[2]; rowIndex <= n; rowIndex++) {

            var tableCell2 = this.getTableCell(rowIndex, 0);
            if (rowIndex === row) {
                bBox.y = height;
                bBox.height = tableCell2.height;
                break;
            }
            height += tableCell2.height;
        }

        var width = 0;
        for (var columnIndex = tableRange[3], m = tableRange[1]; columnIndex <= m; columnIndex++) {

            var tableCell = this.getTableCell(0, columnIndex);
            if (columnIndex === column) {
                bBox.x = width;
                bBox.width = tableCell.width;
                break;
            }

            width += tableCell.width;
        }

        return bBox;
    },

    _rangeToBBox: function(range) {

        var a = this._getCellBBox(range[0], range[3]);
        var b = this._getCellBBox(range[2], range[1]);

        return g.Rect(a.x, a.y, b.corner().x - a.x, b.corner().y - a.y);
    }
});

joint.shapes.basic.TableView = joint.dia.ElementView.extend({

    initialize: function() {
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);
        this.listenTo(this.model, 'change:table', this.render);
        this._elements = [];
    },

    renderMarkup: function() {
        joint.dia.ElementView.prototype.renderMarkup.apply(this, arguments)

        this._elements = [];
        var info = this.model.prop('table/metadata');
        var tableEl = this.findBySelector(info.element, this.el);
        this.tableVel = tableEl ? V(tableEl[0]) : this.vel;

        this._renderFills();
        this._renderBorders();
        this._renderValues();
    },

    update: function() {

        joint.dia.ElementView.prototype.update.apply(this, arguments);

        for (var i = 0, n = this._elements.length; i < n; i++) {
            var obj = this._elements[i];
            this.updateDOMSubtreeAttributes(obj[0], obj[1], {
                rootBBox: obj[2] || this.model.getBBox()
            });
        }
    },

    _renderValues: function() {

        this.model._eachCell(function(cell, row, column) {

            var element = this.model.textMarkup.clone();
            var bbox = this.model._getCellBBox(row, column);
            element.attr({
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height,
            }).text(cell.value);
            this.tableVel.append(element);

            this._elements.push([element.node, {
                '.': {
                    xAlignment: 'middle',
                    yAlignment: 'middle',
                    refX: 0.5,
                    refY: 0.5
                }
            }, bbox])

        }.bind(this));
    },

    _renderBorders: function() {

        var model = this.model;
        var borders = model._getTableBorders();

        for (var i = 0, n = borders.length; i < n; i++) {
            var border = borders[i];
            if (border.grid) {
                this._renderGrid(border.range || this.model._getTableRange(), {
                    color: border.color, size: border.size
                });
            }

            this._renderBorder(border);
        }
    },

    _renderBorder: function(border) {

        var d = [];

        var range = border.range || this.model._getTableRange();
        var bBox = this.model._rangeToBBox(range);
        var corner = bBox.corner();

        _.each(border.sides || ['top', 'left', 'bottom', 'right'], function(side) {
            switch (side) {
                case 'top':
                    d.push('M', bBox.x, bBox.y, 'H', bBox.topRight().x);
                    break;
                case 'right':
                    var tr = bBox.topRight();
                    d.push('M', tr.x, tr.y, 'V', corner.y);
                    break;
                case 'bottom':
                    d.push('M', bBox.x, corner.y, 'H', corner.x);
                    break;
                case 'left':
                    d.push('M', bBox.x, bBox.y, 'V', corner.y);
                    break;
            }
        });
        var element = this.model.borderMarkup.clone();

        this.tableVel.append(element.attr({
            d: d.join(' '),
            'stroke-width': border.size || 1,
            stroke: border.color
        }));
    },

    _renderGrid: function(range, opt) {

        var rangeBBox = this.model._rangeToBBox(range);

        this._renderVerticalGridLine(range, rangeBBox, opt);
        this._renderHorizontalGridLine(range, rangeBBox, opt);
    },

    _renderHorizontalGridLine: function(range, rangeBBox, opt) {

        var lastColumn = range[3];

        var d = [];
        var height = 0;

        for (var row = range[0], n = range[2]; row < n; row++) {
            var cell = this.model.getTableCell(row, lastColumn);
            height += cell.height;
            d.push('M', rangeBBox.x, rangeBBox.y + height, 'H', rangeBBox.corner().x);
        }

        var element = this.model.borderMarkup.clone().addClass('grid-horizontal');
        this.tableVel.append(element.attr({
            d: d.join(' '),
            stroke: opt.color,
            'stroke-width': opt.size || 1
        }));
    },

    _renderVerticalGridLine: function(range, rangeBBox, opt) {

        var lastRow = range[2];

        var d = [];
        var width = 0;

        for (var column = range[3], n = range[1]; column < n; column++) {
            var cell = this.model.getTableCell(lastRow, column);
            width += cell.width;
            d.push('M', rangeBBox.x + width, rangeBBox.y, 'V', rangeBBox.corner().y);
        }

        var el = this.model.borderMarkup.clone().addClass('grid-vertical');
        this.tableVel.append(el.attr({
            d: d.join(' '),
            stroke: opt.color,
            'stroke-width': opt.size || 1
        }));
    },

    _renderFills: function() {
        var model = this.model;
        var fills = model._getTableFills();

        for (var i = 0, n = fills.length; i < n; i++) {
            var fill = fills[i];
            var el = this.model.fillMarkup.clone();
            var x = this.model._rangeToBBox(fill.range || this.model._getTableRange());

            this.tableVel.append(el.attr({
                fill: fill.color || 'red',
                x: x.x,
                y: x.y,
                width: x.width,
                height: x.height,
            }));
        }
    }
});

var table = new Table({
    position: { x: 40, y: 40 },
    size: { width: 200, height: 90 },
    attrs: {
        text: {
            fontFamily: 'monospace'
        },
        '.main-shape-text': {
            text: 'shape with table',
            refX: .5, refY: .5, xAlignment: 'middle', yAlignment: 'middle'
        },
        '.main-shape': {
            refWidth: '100%',
            refHeight: '100%',
            fill: 'darkGray',
            rx: 10,
            ry: 10
        },
        '.table': {
            refY: '70%',
            refX: 10
        }
    }
});

graph.addCell(table);

// table cell value getter => A
table.tableCellProp(5, 0);

// table cell value setter
table.tableCellProp(5, 2, 'C');
table.tableCellProp(5, 3, 'D');
