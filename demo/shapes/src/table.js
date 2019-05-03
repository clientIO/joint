var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('<div/>').prependTo(document.body),
    width: '100%',
    height: 450,
    gridSize: 40,
    drawGrid: 'dot',
    model: graph,
});

(function() {

    const storage = function() {

        const rowColumnHash = function(row, col) {
            return `${row}:${col}`;
        };

        const hashToRowColumn = function(hash) {
            var parts = hash.split(':');
            return {
                row: parseInt(parts[0]),
                column: parseInt(parts[1])
            };
        };

        let _storage = {};
        return {
            getAllValues() {
                return Object.keys(_storage).map(function(key) {
                    var res = hashToRowColumn(key);
                    res.value = _storage[key].value ? _storage[key].value() : null;
                    return res;
                });
            },
            add(row, column, value) {
                _storage[rowColumnHash(row, column)] = value;
            },
            get(row, column) {
                const hash = rowColumnHash(row, column);
                return _storage[hash];
            },
            clear() {
                _storage = {};
            }
        };
    };

    var cellRenderererText = function() {

        var element, _value;

        return {

            value: function(value) {
                if (value !== undefined) {
                    _value = value;
                    return element.text(_value);
                }

                return _value;
            },

            render: function(cell, bbox, row, column) {

                _value = cell.value;
                element = V('<text class="text" />');

                element.attr({
                    x: bbox.x,
                    y: bbox.y,
                    width: bbox.width,
                    height: bbox.height
                });

                element.text(_value);

                var attrs = {
                    '.': {
                        xAlignment: 'middle',
                        yAlignment: 'middle',
                        refX: 0.5,
                        refY: 0.5
                    }
                };

                return {
                    element: element,
                    attrs: attrs
                };
            },
        }
    };

    joint.dia.Element.define('basic.Table', {
        table: {
            widgets: {},
            element: '.table',
            cellWidth: 70,
            cellHeight: 40,
        }
    }, {

        markup: '<g><rect class="main-shape"/><text class="main-shape-text"/><g class="table" shape-rendering="optimizeSpeed"></g></g>',
        borderMarkup: V('<path class="border" stroke-width="1" />'),
        fillMarkup: V('<rect class="fill" />'),

        initialize: function() {
            joint.dia.Element.prototype.initialize.apply(this, arguments);
            this._cellStorage = storage();
            this._cellCache = storage();

            let dimensions = this._resolveDimensions();
            this.setDimensions(dimensions.numberOfRows, dimensions.numberOfColumns);

            this.on('change:table', this._cellCache.clear.bind(this._cellCache));
        },

        toJSON: function() {

            var values = this._cellStorage.getAllValues();

            values.forEach(function(item) {
                this._exportCellValue(item.row, item.column, item.value, { silent: true });
            }.bind(this));

            return joint.dia.Element.prototype.toJSON.call(this);
        },

        addRow: function(row) {
            this.addRows([row]);
        },

        addColumn: function(column) {
            this.addColumns([column]);
        },

        addRows: function(rowsData) {

            var rows = this.prop('table/numberOfRows') || 0;
            var columns = this.prop('table/numberOfColumns') || 0;

            var newRows = rowsData || [];

            newRows.forEach(function(row, index) {

                var cellIndex = this._findMaxNumericKey(row.cells);
                if (cellIndex >= columns) {
                    columns = cellIndex + 1;
                }

                this.prop(['table', 'rows', rows + index + ''], row);
            }.bind(this));

            this.setDimensions(rows + newRows.length, columns)
        },

        addColumns: function(columnsData) {

            var rows = this.prop('table/numberOfRows') || 0;
            var columns = this.prop('table/numberOfColumns') || 0;

            var newColumns = columnsData || [];

            newColumns.forEach(function(column, index) {
                this.prop(['table', 'columns', columns + index + ''], column);
            }.bind(this));

            this.setDimensions(rows, columns + newColumns.length)
        },

        setDimensions: function(rows, columns) {

            var dimensions = this.prop('table');
            dimensions.numberOfRows = rows;
            dimensions.numberOfColumns = columns;

            this.trigger('change:dimension', rows, columns)
        },

        /** Getter/setter cell properties.
         *
         * e.g `table.tableCellProp(0, 0, 'xxx')`
         *
         * @param {number} row Row index
         * @param {number} column Column index
         * @param {object=} value
         */
        tableCellValue: function(row, column, value) {

            const cellObj = this._cellStorage.get(row, column);

            if (cellObj) {
                return cellObj.value(value);
            }

            if (value === undefined) {
                return this.prop(['table', 'rows', row + '', 'cells', column + '', 'value']);
            }

            this._exportCellValue(row, column, value);
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

        tableCellProp: function(rowIndex, columnIndex) {

            let cached = this._cellCache.get(rowIndex, columnIndex);
            if (cached) {
                return cached;
            }

            var row = this._getTableRow(rowIndex);
            var column = this._getTableColumn(columnIndex);
            var cells = row.cells || {};

            var cell = cells[columnIndex] || {};

            var info = this.prop('table');

            cell.width = column.width || info.cellWidth || 50;
            cell.height = row.height || info.cellHeight || 30;

            this._cellCache.add(rowIndex, columnIndex, cell);
            return cell;
        },

        _getTableColumn: function(columnIndex) {

            return this.prop('table/columns/' + columnIndex) || {};
        },

        _getTableRange: function() {
            var info = this.prop('table');
            return [0, info.numberOfColumns - 1, info.numberOfRows - 1, 0];
        },

        _getTableBorders: function() {

            return this.prop('table/border') || [];
        },

        _getTableFills: function() {

            return this.prop('table/fill') || [];
        },

        _getCellBBox: function(row, column) {

            var bBox = g.Rect();
            var tableRange = this._getTableRange();

            var height = 0;
            for (var rowIndex = tableRange[0], n = tableRange[2]; rowIndex <= n; rowIndex++) {

                var tableCell2 = this.tableCellProp(rowIndex, 0);
                if (rowIndex === row) {
                    bBox.y = height;
                    bBox.height = tableCell2.height;
                    break;
                }
                height += tableCell2.height;
            }

            var width = 0;
            for (var columnIndex = tableRange[3], m = tableRange[1]; columnIndex <= m; columnIndex++) {

                var tableCell = this.tableCellProp(0, columnIndex);
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

        _findMaxNumericKey: function(object) {
            return Object.keys(object || {}).reduce(function(res, item) {
                let numericVal = parseInt(item);
                if (numericVal > res) res = numericVal;
                return res;
            }, 0);
        },

        _resolveDimensions: function() {

            var prop = this.prop('table');

            var columns = prop.numberOfRows;
            if (columns === undefined) {
                let columnsProp = this.prop(['table', 'columns']);
                if (columnsProp) {
                    columns = 1 + this._findMaxNumericKey(columnsProp);
                } else {
                    columns = 0;
                }
            }

            var rows = prop.numberOfRows;
            if (rows === undefined) {
                let rowsProp = this.prop(['table', 'rows']);
                if (rowsProp) {
                    rows = 1 + this._findMaxNumericKey(rowsProp);
                } else {
                    rows = 0;
                }

            }
            return {
                numberOfRows: rows,
                numberOfColumns: columns,
            };
        },

        _exportCellValue: function(row, column, value, opt) {
            return this.prop(['table', 'rows', row + '', 'cells', column + '', 'value'], value, opt);
        },

    }, {
        prepareForeign: function(bbox) {

            var element = V('<foreignObject />');

            element.attr({
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height
            });

            return element;
        }

    });

    joint.shapes.basic.TableView = joint.dia.ElementView.extend({

        initialize: function() {
            joint.dia.ElementView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'change:table', this.render);
            this.listenTo(this.model, 'change:dimension', this.render);

            this._elements = [];
        },

        renderMarkup: function() {
            joint.dia.ElementView.prototype.renderMarkup.apply(this, arguments)

            this._elements = [];
            this.model._cellStorage.clear();

            var info = this.model.prop('table');
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

            var rows = this.model.prop('table/numberOfRows');
            var columns = this.model.prop('table/numberOfColumns');

            this.model._eachCell(function(cell, row, column) {

                var shouldRender = row <= rows - 1 && column <= columns - 1;
                if (shouldRender) {

                    var bbox = this.model._getCellBBox(row, column);
                    var type = cell.type || 'text';

                    var cellWidgetsNamespace = this.model.prop('table/widgets');
                    var contentCell = (cellWidgetsNamespace[type] || cellRenderererText)();

                    var renderResult = contentCell.render(cell, bbox, row, column);

                    this.model._cellStorage.add(row, column, contentCell);

                    this.tableVel.append(renderResult.element);
                    this._elements.push([renderResult.element.node, renderResult.attrs, bbox])
                }

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
                var cell = this.model.tableCellProp(row, lastColumn);
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
                var cell = this.model.tableCellProp(lastRow, column);
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

}());

var Table = joint.shapes.basic.Table;

function createSimpleTable() {
    graph.clear();

    var table = new Table({
        position: { x: 40, y: 40 },
        table: {
            numberOfRows: 2,
            numberOfColumns: 2,
            fill: [
                { color: '#fbfbfb' },
            ],
            border: [
                { grid: true, color: '#aaaaaa', size: 1 },
                { grid: false, color: '#2d2d2d', size: 1 },
            ]
        },
        size: { width: 200, height: 90 },
    });
    graph.addCell(table);
}

function createSimpleTableA() {
    graph.clear();

    var table = new Table({
        position: { x: 40, y: 40 },
        table: {
            fill: [
                { color: '#fbfbfb' },
            ],
            border: [
                { grid: true, sides: undefined, color: '#aaaaaa', size: 1 },
                { grid: false, color: '#2d2d2d', size: 1 },
            ],
            columns: {
                '0': { width: 100 },
                '1': { width: 40 },
                '2': { width: 100 }
            },
            rows: {
                '0': {
                    height: 50,
                    cells: {
                        '0': { value: 'text value 1' },
                        '2': { value: 'text value 2' }
                    }
                },
                '2': {
                    height: 20,
                    cells: {
                        '0': { value: 'text value 1' },
                        '2': { value: 'text value 2' }
                    }
                },

            },
            size: { width: 200, height: 90 }
        }
    });
    graph.addCell(table);
    console.assert(table.prop('table/numberOfRows') === 3, 'should have 3 rows');
    console.assert(table.prop('table/numberOfColumns') === 3, 'should have 3 cols');
    return table;
}


function tableApi() {
    var table = createSimpleTableA();

    // add a single row
    table.addRow({
        cells: {
            '1': { value: 'A' },
            '2': { value: 'A' }
        }
    });

    console.assert(table.prop('table/numberOfColumns') === 3, 'should have 3 cols');

    // add 2 rows
    table.addRows([{
        cells: {
            '1': { value: 'B' },
            '2': { value: 'B' }
        }
    }, {
        cells: {
            '5': { value: 'C' },
            '4': { value: 'C' }
        }
    }, {}]);

    console.assert(table.prop('table/numberOfColumns') === 6, 'should have 6 cols');

    // add single table column
    table.addColumn({ width: 200 });

    // add table columns
    table.addColumns([
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 }
    ]);

    // set row height
    table.tableRowProp(0, { height: 90 });

    // set column width
    table.tableColumnProp(3, { width: 220 });

    // read cell value
    var cellValue = table.tableCellValue(4, 1);
    console.assert(cellValue === 'B', 'get table cell value should be "B"', cellValue);

    // update cell value
    table.tableCellValue(4, 2, 'BBB');
}

createSimpleTable();
createSimpleTableA();
tableApi();

