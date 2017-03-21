var Board = joint.dia.Paper.extend({

    options: _.extend(joint.dia.Paper.prototype.options, {

        letters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],

        namespace: joint.shapes.chess,

        startup: {
            'a1': 'RookWhite',   'a2': 'PawnWhite', 'a7': 'PawnBlack', 'a8': 'RookBlack',
            'b1': 'KnightWhite', 'b2': 'PawnWhite', 'b7': 'PawnBlack', 'b8': 'KnightBlack',
            'c1': 'BishopWhite', 'c2': 'PawnWhite', 'c7': 'PawnBlack', 'c8': 'BishopBlack',
            'd1': 'QueenWhite',  'd2': 'PawnWhite', 'd7': 'PawnBlack', 'd8': 'QueenBlack',
            'e1': 'KingWhite',   'e2': 'PawnWhite', 'e7': 'PawnBlack', 'e8': 'KingBlack',
            'f1': 'BishopWhite', 'f2': 'PawnWhite', 'f7': 'PawnBlack', 'f8': 'BishopBlack',
            'g1': 'KnightWhite', 'g2': 'PawnWhite', 'g7': 'PawnBlack', 'g8': 'KnightBlack',
            'h1': 'RookWhite',   'h2': 'PawnWhite', 'h7': 'PawnBlack', 'h8': 'RookBlack'
        },

        width: 8 * 50,

        height: 8 * 50,

        gridSize: 1

    }),

    initialize: function() {

        this.model = new joint.dia.Graph;

        joint.dia.Paper.prototype.initialize.apply(this, arguments);

        this.on('cell:pointerdown', function(cellView) {

            cellView.model.toFront();

            this._p0 = cellView.model.get('position');

            this.trigger('piece:touch', cellView.model, this._p2n(this._p0));
        });

        this.on('cell:pointerup', function(cellView) {

            var pos = cellView.model.get('position');
            var p0 = this._p0;
            var p1 = { x: g.snapToGrid(pos.x, 50), y: g.snapToGrid(pos.y, 50) };

            cellView.model.set('position', p1);

            this.trigger('piece:drop', cellView.model, this._p2n(p0), this._p2n(p1), function() {
                cellView.model.set('position', p0);
            });
        });

        this.reset();
    },

    reset: function() {

        this.model.resetCells();

        _.each(this.options.startup, this.addPiece, this);
    },

    at: function(square) {

        return _.pluck(this.findViewsFromPoint(this._mid(this._n2p(square))), 'model');
    },

    addPiece: function(piece, square) {

        this.model.addCell(new this.options.namespace[piece]({ position: this._n2p(square) }));
    },

    movePiece: function(from, to, opts) {

        opts = opts || {};

        var pc = this.at(from);

        if (!this.options.animation || opts.animation === false) {

            _.invoke(pc, 'set', 'position', this._n2p(to));

        } else {

            _.invoke(pc, 'transition', 'position', this._n2p(to), {
                valueFunction: joint.util.interpolate.object
            });
        }
    },

    addPointer: function(from, to) {

        this.model.addCell(new joint.dia.Link({
            source: this._mid(this._n2p(from)),
            target: this._mid(this._n2p(to)),
            z: -1,
            attrs: {
                '.': {
                    opacity: .2,
                    stroke: 'black'
                },
                '.marker-target': {
                    d: "m 0, -10 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0",
                    fill: 'black'
                },
                '.connection': {
                    'stroke-width': '4px'
                }
            }
        }));
    },

    addPointers: function(from, toArray) {

        var p1 =  this._n2p(from);

        _.chain(toArray)
            .map(this._n2p, this)
            .groupBy(function(p0) {
                return g.point(p0).theta(p1);
            })
            .map(function(group) {
                return _.max(group, function(p0) {
                    return g.point(p1).distance(p0);
                });
            })
            .each(_.compose(_.partial(this.addPointer, from), this._p2n), this);
    },
    
    removePointers: function() {

        _.invoke(this.model.getLinks(), 'remove');
    },

    _p2n: function(p) {

        return this.options.letters[p.x / 50] + (8 - p.y / 50);
    },

    _n2p: function(n) {

        return {
            x: this.options.letters.indexOf(n[0]) * 50,
            y: (8 - n[1]) * 50
        };
    },

    _mid: function(p) {

        return { x: p.x + 25, y: p.y + 25 };
    }
    
});

// Garbochess integration

var Chessboard = Board.extend({

    playMove: function(transition, mv) {

        var from = FormatSquare(mv & 0xFF);
        var to = FormatSquare((mv >> 8) & 0xFF);
        var opts = { animation: transition };

        _.invoke(this.at(to), 'remove');

        board.movePiece(from, to, opts);

        if (mv & moveflagPromotion) {

            var promote = _.bind(function(color) {

                _.invoke(this.at(to), 'remove');
                this.addPiece('Queen' + color, to);

            }, this, (g_toMove ? 'White' : 'Black'));

            if (transition) {
                this.listenToOnce(this.model, 'transition:end', promote);
            } else {
                promote();
            }

        } else if (mv & moveflagCastleQueen) {

            this.movePiece('a'+ to[1], 'd' + to[1], opts);

        } else if (mv & moveflagCastleKing) {

            this.movePiece('h'+ to[1], 'f' + to[1], opts);

        } else if (mv & moveflagEPC) {

            _.invoke(this.at(to[0] + from[1]), 'remove');
	}

        var msg = ['message', g_moveCount, GetMoveSAN(mv), ''];

        MakeMove(mv);

        if (GenerateValidMoves().length == 0) {

            msg[3] = g_inCheck ? !g_toMove ? '1 : 0' : '0 : 1' : '½ : ½';

            this.isGameOver = true;
        }

        this.trigger.apply(this, msg);
    },

    getMove: function(from, to) {

        var s = from + to;
        return _.find(GenerateValidMoves(), _.compose(function(m) {
            return m == s || m == s + 'q';
        }, FormatMove));
    },

    whereToGo: function(from) {

        return _.chain(GenerateValidMoves())
            .map(FormatMove)
            .filter(function(move) {
                return !move.lastIndexOf(from);
            })
            .invoke('slice', 2, 4)
            .value();
    },

    findBestMove: function(callback) {

        Search(callback, 99, null);
    }
});

// User interaction

var board = new Chessboard({
    background: {
        image: './background.png',
        repeat: 'repeat'
    },
    el: $('#board'),
    animation: true
});

board.on('piece:touch', function(piece, from) {

    this.addPointers(from, this.whereToGo(from));
});

board.on('piece:drop', function(piece, from, to, undo) {

    this.removePointers();

    undo();

    var mv = this.getMove(from, to);

    if (mv) {
        this.playMove(false, mv);
        this.isGameOver || this.findBestMove(_.bind(this.playMove, this, true));
    }
});

board.on('message', function(rnd, mov, res) {

    var text = (rnd % 2 ? '' : (1 + rnd / 2) + '. ') + mov + ' ' + res;
    document.getElementById('message').textContent += text;
});

ResetGame();
