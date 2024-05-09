import { PaperLayer } from '../PaperLayer.mjs';
import {
    isFunction,
    isString,
    defaults,
    omit,
    assign,
    merge,
} from '../../util/index.mjs';
import V from '../../V/index.mjs';

export const GridLayer = PaperLayer.extend({

    style: {
        'pointer-events': 'none'
    },

    _gridCache: null,
    _gridSettings: null,

    init() {
        PaperLayer.prototype.init.apply(this, arguments);
        const { options: { paper }} = this;
        this._gridCache = null;
        this._gridSettings = [];
        this.listenTo(paper, 'transform resize', this.updateGrid);
    },

    setGrid(drawGrid) {
        this._gridSettings = this.getGridSettings(drawGrid);
        this.renderGrid();
    },

    getGridSettings(drawGrid) {
        const gridSettings = [];
        if (drawGrid) {
            const optionsList = Array.isArray(drawGrid) ? drawGrid : [drawGrid || {}];
            optionsList.forEach((item) => {
                gridSettings.push(...this._resolveDrawGridOption(item));
            });
        }
        return gridSettings;
    },

    removeGrid() {
        const { _gridCache: grid } = this;
        if (!grid) return;
        grid.root.remove();
        this._gridCache = null;
    },

    renderGrid() {

        const { options: { paper }} = this;
        const { _gridSettings: gridSettings } = this;

        this.removeGrid();

        if (gridSettings.length === 0) return;

        const gridSize = paper.options.drawGridSize || paper.options.gridSize;
        if (gridSize <= 1) {
            return;
        }

        const refs = this._getGridRefs();

        gridSettings.forEach((gridLayerSetting, index) => {

            const id = this._getPatternId(index);
            const options = merge({}, gridLayerSetting);
            const { scaleFactor = 1 } = options;
            options.width = gridSize * scaleFactor || 1;
            options.height = gridSize * scaleFactor || 1;

            let vPattern;
            if (!refs.exist(id)) {
                vPattern = V('pattern', { id: id, patternUnits: 'userSpaceOnUse' }, V(options.markup));
                refs.add(id, vPattern);
            } else {
                vPattern = refs.get(id);
            }

            if (isFunction(options.render)) {
                options.render(vPattern.node.firstChild, options, paper);
            }
            vPattern.attr({
                width: options.width,
                height: options.height
            });
        });

        refs.root.appendTo(this.el);
        this.updateGrid();
    },

    updateGrid() {

        const { _gridCache: grid, _gridSettings: gridSettings, options: { paper }} = this;
        if (!grid) return;
        const { root: vSvg, patterns } = grid;
        const { x, y, width, height } = paper.getArea();
        vSvg.attr({ x, y, width, height });
        for (const patternId in patterns) {
            const vPattern = patterns[patternId];
            vPattern.attr({ x: -x, y: -y });
        }
        gridSettings.forEach((options, index) => {
            if (isFunction(options.update)) {
                const vPattern = patterns[this._getPatternId(index)];
                options.update(vPattern.node.firstChild, options, paper);
            }
        });
    },

    _getPatternId(index) {
        return `pattern_${this.options.paper.cid}_${index}`;
    },

    _getGridRefs() {
        let { _gridCache: grid } = this;
        if (grid) return grid;
        const defsVEl = V('defs');
        const svgVEl = V('svg', { width: '100%', height: '100%' }, [defsVEl]);
        grid = this._gridCache = {
            root: svgVEl,
            patterns: {},
            add: function(id, patternVEl) {
                const rectVEl = V('rect', { width: '100%', height: '100%', fill: `url(#${id})` });
                defsVEl.append(patternVEl);
                svgVEl.append(rectVEl);
                this.patterns[id] = patternVEl;
            },
            get: function(id) {
                return this.patterns[id];
            },
            exist: function(id) {
                return this.patterns[id] !== undefined;
            }
        };
        return grid;
    },

    _resolveDrawGridOption(opt) {

        var namespace = this.options.patterns;
        if (isString(opt) && Array.isArray(namespace[opt])) {
            return namespace[opt].map(function(item) {
                return assign({}, item);
            });
        }

        var options = opt || { args: [{}] };
        var isArray = Array.isArray(options);
        var name = options.name;

        if (!isArray && !name && !options.markup) {
            name = 'dot';
        }

        if (name && Array.isArray(namespace[name])) {
            var pattern = namespace[name].map(function(item) {
                return assign({}, item);
            });

            var args = Array.isArray(options.args) ? options.args : [options.args || {}];

            defaults(args[0], omit(opt, 'args'));
            for (var i = 0; i < args.length; i++) {
                if (pattern[i]) {
                    assign(pattern[i], args[i]);
                }
            }
            return pattern;
        }

        return isArray ? options : [options];
    },

});
