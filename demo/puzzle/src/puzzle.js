joint.dia.Element.define('jigsaw.Piece', {
    markup: '<g class="rotatable"><polygon/></g>',
    attrs: {
        polygon: {
            tabs: [0, 0, 0, 0],
            image: ['', 0, 0],
            stroke: '#ddd'
        }
    }
}, null , {
    attributes: {
        tabs: { /* [topTab, rightTab, bottomTab, leftTab] */
            qualify: _.isArray,
            set: function(tabs, refBBox) {
                var tabSize = this.model.prop('tabSize');
                var points = [];
                var refCenter = refBBox.center();
                var refPoints = [
                    refBBox.origin(),
                    refBBox.topRight(),
                    refBBox.corner(),
                    refBBox.bottomLeft()
                ];
                for (var i = 0; i < 4; i++) {
                    var a = refPoints[i];
                    var b = refPoints[i + 1] || refPoints[0];
                    points.push(a);
                    if (tabs[i]) {
                        var mid = g.Line(a, b).midpoint();
                        points.push(
                            mid.clone().move(b, tabSize),
                            mid.clone().move(refCenter, tabs[i] * tabSize),
                            mid.clone().move(a, tabSize)
                        );
                    }
                }
                return {
                    points: points.join(' ').replace(/@/g,' ')
                };
            }
        },
        image: { /* [imageId, rowIndex, columnIndex] */
            qualify: _.isArray,
            set: function(image) {
                var paper = this.paper;
                var model = this.model;
                var width = model.prop('size/width');
                var height = model.prop('size/height');
                var id = 'image-pattern-' + width + '-' + height + '-' + image.join('-');
                if (!paper.isDefined(id)) {
                    var tabSize = model.get('tabSize');
                    V('pattern', {
                        id: id,
                        x: - tabSize,
                        y: - tabSize,
                        width: width + 2 * tabSize,
                        height: height + 2 * tabSize,
                        patternUnits: 'userSpaceOnUse'
                    }, [
                        V('use', {
                            'xlink:href': '#' + image[0],
                            x: - (image[1] * width + tabSize),
                            y: - (image[2] * height + tabSize)
                        })
                    ]).appendTo(paper.defs);
                }
                return {
                    fill: 'url(#' + id + ')'
                };
            }
        }
    }
});

var Jigsaw = {

    GRID: 10,
    PADDING: 200,
    TAB_RATIO: .15,
    IMAGE_ID: 'puzzle-image',

    createPuzzle: function(sizeArray, imageHref) {

        var graph = this.graph = new joint.dia.Graph;
        var paper = this.paper = new joint.dia.Paper({
            el: document.getElementById('paper'),
            gridSize: this.GRID,
            model: graph
        }).on({
            'cell:pointerdown': function(pieceView, evt) {
                pieceView.model.toFront();
                pieceView.highlight('polygon');
                evt.data = { pointerMoveCount: 0 };
            },
            'cell:pointermove': function(cellView, evt) {
                evt.data.pointerMoveCount++;
            },
            'cell:pointerup': function(pieceView, evt) {
                pieceView.unhighlight('polygon');
                if (evt.data.pointerMoveCount < this.GRID) {
                    // Workaround for an unresolved chrome issue
                    // https://bugs.chromium.org/p/chromium/issues/detail?id=716694
                    pieceView.model.rotate(90);
                }
            }
        }, this);

        this.vImage = V('image', {
            id: this.IMAGE_ID,
            preserveAspectRatio: 'none'
        }).appendTo(paper.defs);

        this._setImageHref(imageHref);
        this.resizePuzzle(sizeArray);
    },

    resizePuzzle: function(sizeArray) {
        this._setSize.apply(this, sizeArray);
        this.playPuzzle();
    },

    changePuzzleImage: function(imageHref) {
        this._setImageHref(imageHref);
        this.playPuzzle();
    },

    playPuzzle: function() {
        this.generatePuzzle();
        this.shufflePuzzle(3000);
    },

    shufflePuzzle: function(delay) {

        var pieces = this.graph.getElements();

        for (var i = 0, n = pieces.length; i < n; i++) {
            var piece = pieces[i];
            piece.transition('position', g.Point({
                x: this.PADDING + (Math.random() * this.width) - this.pieceSize / 2,
                y: this.PADDING + (Math.random() * this.height) - this.pieceSize / 2
            }).snapToGrid(this.GRID).toJSON(), {
                valueFunction: joint.util.interpolate.object,
                delay: delay || 0,
                duration: 1000
            });
            piece.transition('angle', _.sample([0, 90, 180, 270]), {
                delay: delay || 0,
                duration: 1000
            });
        }
    },

    generatePuzzle: function() {

        var rows = this.rows;
        var columns = this.columns;
        var pieceSize = this.pieceSize;

        this.graph.clear();

        var pieces = [];
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < columns; c++) {
                var tabs = [0, 0, 0, 0];

                if (c < (columns - 1)) {
                    tabs[1] = _.sample([1, -1]);
                }
                if (r < (rows - 1)) {
                    tabs[2] = _.sample([1, -1]);
                }
                if (r > 0) {
                    tabs[0] -= pieces[(r - 1) * columns + c].attr('polygon/tabs/2');
                }
                if (c > 0) {
                    tabs[3] -= pieces[r * columns + c - 1].attr('polygon/tabs/1');
                }

                pieces.push(new joint.shapes.jigsaw.Piece({
                    position: {
                        x: this.PADDING + c * pieceSize,
                        y: this.PADDING + r * pieceSize
                    },
                    size: {
                        width: pieceSize,
                        height: pieceSize
                    },
                    tabSize: this.TAB_RATIO * pieceSize,
                    attrs: {
                        polygon: {
                            tabs: tabs,
                            image: [this.IMAGE_ID, c, r]
                        }
                    }
                }).addTo(this.graph));
            }
        }
    },

    _setImageHref: function(imageHref) {
        this.vImage.attr('xlink:href', imageHref);
    },

    _setImageSize: function(width, height, pieceSize) {
        this.vImage.attr({
            x: 2 * this.TAB_RATIO * pieceSize,
            y: 2 * this.TAB_RATIO * pieceSize,
            width: width,
            height: height
        });
    },

    _setSize: function(rows, columns, pieceSize) {
        this.rows = rows;
        this.columns = columns;
        this.pieceSize = pieceSize;
        var width = this.width = columns * pieceSize;
        var height = this.height = rows * pieceSize;
        this._setImageSize(width, height, pieceSize);
        this.paper.setDimensions(
            2 * this.PADDING + width,
            2 * this.PADDING + height
        );
    }

};

// Initialization

var imagePicker = document.getElementById('image-picker');
var sizePicker = document.getElementById('size-picker');

imagePicker.addEventListener('change', function() {
    Jigsaw.changePuzzleImage(this.value);
});

sizePicker.addEventListener('change', function() {
    Jigsaw.resizePuzzle(JSON.parse(this.value));
});

Jigsaw.createPuzzle(JSON.parse(sizePicker.value), imagePicker.value);
