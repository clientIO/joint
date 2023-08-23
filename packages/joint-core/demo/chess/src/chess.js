var Board = joint.dia.Paper.extend({

    options: joint.util.assign(joint.dia.Paper.prototype.options, {

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
            this._p0 = cellView.model.position();
            this.trigger('piece:touch', cellView.model, this._p2n(this._p0));
        });

        this.on('cell:pointerup', function(cellView) {

            var model = cellView.model;
            var pos = model.position();
            var p0 = this._p0;
            var p1 = g.Point(pos).snapToGrid(50).toJSON();

            model.set('position', p1);

            this.trigger('piece:drop', model, this._p2n(p0), this._p2n(p1), function() {
                model.set('position', p0);
            });
        });

        this.reset();
    },

    reset: function() {

        this.model.resetCells();

        joint.util.forIn(this.options.startup, this.addPiece.bind(this));
    },

    at: function(square) {

        return this.model.findModelsFromPoint(this._mid(this._n2p(square)));
    },

    addPiece: function(piece, square) {

        this.model.addCell(new this.options.namespace[piece]({ position: this._n2p(square) }));
    },

    movePiece: function(from, to, opts) {

        opts = opts || {};

        var pc = this.at(from);

        if (!this.options.animation || opts.animation === false) {

            joint.util.invoke(pc, 'set', 'position', this._n2p(to));

        } else {

            joint.util.invoke(pc, 'transition', 'position', this._n2p(to), {
                valueFunction: joint.util.interpolate.object
            });
        }
    },

    addPointer: function(from, to) {

        var pointer = new joint.shapes.standard.Link({
            source: this._mid(this._n2p(from)),
            target: this._mid(this._n2p(to)),
            z: -1,
            attrs: {
                root: {
                    opacity: .2
                },
                line: {
                    strokeWidth: 4,
                    stroke: 'black',
                    targetMarker: {
                        'type': 'circle',
                        'r': 10
                    }
                }
            }
        });
        pointer.addTo(this.model);
    },

    addPointers: function(from, toArray) {

        var p1 = this._n2p(from);
        var moves = toArray.map(this._n2p.bind(this));
        var groupedMoves = joint.util.groupBy(moves, function(p0) {
            return g.Point(p0).theta(p1);
        });
        joint.util.toArray(groupedMoves).map(function(group) {
            var distance = 0;
            var to = null;
            group.forEach(function(p0) {
                var currentDistance = g.Point(p1).distance(p0);
                if (currentDistance > distance) {
                    distance = currentDistance;
                    to = p0;
                }
            });
            return to;
        }).forEach(function(to) {
            this.addPointer(from, this._p2n(to));
        }, this);
    },

    removePointers: function() {

        joint.util.invoke(this.model.getLinks(), 'remove');
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

        var from = window.FormatSquare(mv & 0xFF);
        var to = window.FormatSquare((mv >> 8) & 0xFF);
        var opts = { animation: transition };

        joint.util.invoke(this.at(to), 'remove');

        board.movePiece(from, to, opts);

        if (mv & window.moveflagPromotion) {

            var promote = (function(color) {

                joint.util.invoke(this.at(to), 'remove');
                this.addPiece('Queen' + color, to);

            }).bind(this, (window.g_toMove ? 'White' : 'Black'));

            if (transition) {
                this.listenToOnce(this.model, 'transition:end', promote);
            } else {
                promote();
            }

        } else if (mv & window.moveflagCastleQueen) {

            this.movePiece('a'+ to[1], 'd' + to[1], opts);

        } else if (mv & window.moveflagCastleKing) {

            this.movePiece('h'+ to[1], 'f' + to[1], opts);

        } else if (mv & window.moveflagEPC) {

            joint.util.invoke(this.at(to[0] + from[1]), 'remove');
        }

        var msg = ['message', window.g_moveCount, window.GetMoveSAN(mv), ''];

        window.MakeMove(mv);

        if (window.GenerateValidMoves().length == 0) {

            msg[3] = window.g_inCheck ? !window.g_toMove ? '1 : 0' : '0 : 1' : '½ : ½';

            this.isGameOver = true;
        }

        this.trigger.apply(this, msg);
    },

    getMove: function(from, to) {

        var s1 = from + to;
        var moves = window.GenerateValidMoves();
        while (moves.length > 0) {
            var move = moves.pop();
            var s2 = window.FormatMove(move);
            if (s2 == s1 || s2 == s1 + 'q') return move;
        }
        return null;
    },

    whereToGo: function(from) {

        return window.GenerateValidMoves()
            .map(window.FormatMove)
            .filter(function(move) {
                return !move.lastIndexOf(from);
            }).map(function(mv) {
                return mv.slice(2,4);
            });
    },

    findBestMove: function(callback) {

        window.Search(callback, 99, null);
    }
});

// User interaction

var board = new Chessboard({
    background: {
        image: './background.png',
        repeat: 'repeat'
    },
    el: document.getElementById('board'),
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
        this.isGameOver || this.findBestMove(function(mv) {
            board.playMove(true, mv);
        });
    }
});

board.on('message', function(rnd, mov, res) {

    var text = (rnd % 2 ? '' : (1 + rnd / 2) + '. ') + mov + ' ' + res;
    document.getElementById('message').textContent += text;
});

window.ResetGame();
