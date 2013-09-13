/*! JointJS v0.6.3 - JavaScript diagramming library  2013-09-13 


This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var global=self;/*
Copyright (c) 2012-2013 Chris Pettitt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
global.dagre = require("./index");

},{"./index":2}],2:[function(require,module,exports){
/*
Copyright (c) 2012-2013 Chris Pettitt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
exports.dot = require("./lib/dot");
exports.layout = require("./lib/layout/layout");
exports.util = require("./lib/util");
exports.version = require("./lib/version");

},{"./lib/dot":7,"./lib/layout/layout":9,"./lib/util":13,"./lib/version":14}],3:[function(require,module,exports){
/*
 * Returns all components in the graph using undirected navigation.
 */
module.exports = function(g) {
  var results = [];
  var visited = {};

  function dfs(u, component) {
    if (!(u in visited)) {
      visited[u] = true;
      component.push(u);
      g.neighbors(u).forEach(function(v) {
        dfs(v, component);
      });
    }
  }

  g.eachNode(function(u) {
    var component = [];
    dfs(u, component);
    if (component.length > 0) {
      results.push(component);
    }
  });

  return results;
};

},{}],4:[function(require,module,exports){
var PriorityQueue = require("../data/PriorityQueue");

/*
 * This algorithm uses undirected traversal to find a miminum spanning tree
 * using the supplied weight function. The algorithm is described in
 * Cormen, et al., "Introduction to Algorithms". The returned structure
 * is an array of node id to an array of adjacent nodes.
 */
module.exports = function(g, weight) {
  var result = {};
  var parent = {};
  var q = new PriorityQueue();

  if (g.nodes().length === 0) {
    return result;
  }

  g.eachNode(function(u) {
    q.add(u, Number.POSITIVE_INFINITY);
    result[u] = [];
  });

  // Start from arbitrary node
  q.decrease(g.nodes()[0], 0);

  var u;
  var init = false;
  while (q.size() > 0) {
    u = q.removeMin();
    if (u in parent) {
      result[u].push(parent[u]);
      result[parent[u]].push(u);
    } else if (init) {
      throw new Error("Input graph is not connected:\n" + g.toString());
    } else {
      init = true;
    }

    g.neighbors(u).forEach(function(v) {
      var pri = q.priority(v);
      if (pri !== undefined) {
        var edgeWeight = weight(u, v);
        if (edgeWeight < pri) {
          parent[v] = u;
          q.decrease(v, edgeWeight);
        }
      }
    });
  }

  return result;
};


},{"../data/PriorityQueue":5}],5:[function(require,module,exports){
module.exports = PriorityQueue;

function PriorityQueue() {
  this._arr = [];
  this._keyIndices = {};
}

PriorityQueue.prototype.size = function() { return this._arr.length; };

PriorityQueue.prototype.keys = function() { return Object.keys(this._keyIndices); };

PriorityQueue.prototype.has = function(key) { return key in this._keyIndices; };

PriorityQueue.prototype.priority = function(key) {
  var i = this._keyIndices[key];
  if (i !== undefined) {
    return this._arr[i].pri;
  }
};

PriorityQueue.prototype.add = function(key, pri) {
  if (!(key in this._keyIndices)) {
    var entry = {key: key, pri: pri};
    var index = this._arr.length;
    this._keyIndices[key] = index;
    this._arr.push(entry);
    this._decrease(index);
    return true;
  }
  return false;
};

PriorityQueue.prototype.min = function() {
  if (this.size() > 0) {
    return this._arr[0].key;
  }
};

PriorityQueue.prototype.removeMin = function() {
  this._swap(0, this._arr.length - 1);
  var min = this._arr.pop();
  delete this._keyIndices[min.key];
  this._heapify(0);
  return min.key;
};

PriorityQueue.prototype.decrease = function(key, pri) {
  var index = this._keyIndices[key];
  if (pri > this._arr[index].pri) {
    throw new Error("New priority is greater than current priority. " +
        "Key: " + key + " Old: " + this._arr[index].pri + " New: " + pri);
  }
  this._arr[index].pri = pri;
  this._decrease(index);
};

PriorityQueue.prototype._heapify = function(i) {
  var arr = this._arr;
  var l = 2 * i,
      r = l + 1,
      largest = i;
  if (l < arr.length) {
    largest = arr[l].pri < arr[largest].pri ? l : largest;
    if (r < arr.length) {
      largest = arr[r].pri < arr[largest].pri ? r : largest;
    }
    if (largest !== i) {
      this._swap(i, largest);
      this._heapify(largest);
    }
  }
};

PriorityQueue.prototype._decrease = function(i) {
  var pri = this._arr[i].pri;
  var parent;
  while (i > 0) {
    parent = i >> 1;
    if (this._arr[parent].pri < pri) {
      break;
    }
    this._swap(i, parent);
    i = parent;
  }
};

PriorityQueue.prototype._swap = function(i, j) {
  var arr = this._arr;
  var keyIndices = this._keyIndices;
  var tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
  keyIndices[arr[i].key] = i;
  keyIndices[arr[j].key] = j;
};

},{}],6:[function(require,module,exports){
module.exports = Set;

function Set(initialKeys) {
  this._size = 0;
  this._keys = {};

  if (initialKeys) {
    initialKeys.forEach(function(key) {
      this.add(key);
    }, this);
  }
}

Set.prototype.size = function() { return this._size; };

Set.prototype.keys = function() { return Object.keys(this._keys); };

Set.prototype.has = function(key) { return key in this._keys; };

Set.prototype.add = function(key) {
  if (!(key in this._keys)) {
    this._keys[key] = true;
    ++this._size;
    return true;
  }
  return false;
};

Set.prototype.remove = function(key) {
  if (key in this._keys) {
    delete this._keys[key];
    --this._size;
    return true;
  }
  return false;
};

},{}],7:[function(require,module,exports){
var util = require("./util"),
    Graph = require("graphlib").Graph,
    dot = require("graphlib-dot");

// For now we re-export with old names for backwards compatibility
exports.toGraph = dot.parse;
exports.toGraphArray = dot.parseMany;

// This is new, so no name change
exports.write = dot.write;

// TODO: move this and the object reading stuff in layout.js to their own file.
exports.toObjects = function(str) {
  var g = exports.toGraph(str);
  var nodes = g.nodes().map(function(u) { return g.node(u); });
  var edges = g.edges().map(function(e) {
    var edge = g.edge(e);
    edge.source = g.node(g.source(e));
    edge.target = g.node(g.target(e));
    return edge;
  });
  return { nodes: nodes, edges: edges };
};

},{"./util":13,"graphlib":27,"graphlib-dot":16}],8:[function(require,module,exports){
var util = require("../util");

module.exports = instrumentedRun;
module.exports.undo = undo;

function instrumentedRun(g, debugLevel) {
  var timer = util.createTimer();
  var reverseCount = util.createTimer().wrap("Acyclic Phase", run)(g);
  if (debugLevel >= 2) console.log("Acyclic Phase: reversed " + reverseCount + " edge(s)");
}

function run(g) {
  var onStack = {},
      visited = {},
      reverseCount = 0;

  function dfs(u) {
    if (u in visited) return;

    visited[u] = onStack[u] = true;
    g.outEdges(u).forEach(function(e) {
      var t = g.target(e),
          a;

      if (t in onStack) {
        a = g.edge(e);
        g.delEdge(e);
        a.reversed = true;
        ++reverseCount;
        g.addEdge(e, t, u, a);
      } else {
        dfs(t);
      }
    });

    delete onStack[u];
  }

  g.eachNode(function(u) { dfs(u); });

  return reverseCount;
}

function undo(g) {
  g.eachEdge(function(e, s, t, a) {
    if (a.reversed) {
      delete a.reversed;
      g.delEdge(e);
      g.addEdge(e, t, s, a);
    }
  });
}

},{"../util":13}],9:[function(require,module,exports){
var util = require("../util"),
    rank = require("./rank"),
    acyclic = require("./acyclic"),
    Digraph = require("graphlib").Digraph;

module.exports = function() {
  // External configuration
  var config = {
      // Nodes to lay out. At minimum must have `width` and `height` attributes.
      nodes: [],
      // Edges to lay out. At mimimum must have `source` and `target` attributes.
      edges: [],
      // How much debug information to include?
      debugLevel: 0,
  };

  var timer = util.createTimer();

  // Phase functions
  var
      order = require("./order")(),
      position = require("./position")();

  // This layout object
  var self = {};

  self.nodes = util.propertyAccessor(self, config, "nodes");
  self.edges = util.propertyAccessor(self, config, "edges");

  self.orderIters = delegateProperty(order.iterations);

  self.nodeSep = delegateProperty(position.nodeSep);
  self.edgeSep = delegateProperty(position.edgeSep);
  self.universalSep = delegateProperty(position.universalSep);
  self.rankSep = delegateProperty(position.rankSep);
  self.rankDir = delegateProperty(position.rankDir);
  self.debugAlignment = delegateProperty(position.debugAlignment);

  self.debugLevel = util.propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
    order.debugLevel(x);
    position.debugLevel(x);
  });

  self.run = timer.wrap("Total layout", run);

  self._normalize = normalize;

  return self;

  /*
   * Constructs an adjacency graph using the nodes and edges specified through
   * config. For each node and edge we add a property `dagre` that contains an
   * object that will hold intermediate and final layout information. Some of
   * the contents include:
   *
   *  1) A generated ID that uniquely identifies the object.
   *  2) Dimension information for nodes (copied from the source node).
   *  3) Optional dimension information for edges.
   *
   * After the adjacency graph is constructed the code no longer needs to use
   * the original nodes and edges passed in via config.
   */
  function buildAdjacencyGraph() {
    var g = new Digraph();
    var nextId = 0;

    // Get the node id for the type ("source" or "target") or throw if we
    // haven't seen the node.
    function safeGetNodeId(type, edge) {
      var nodeId;
      if (type in edge) {
        nodeId = edge[type].dagre.id;
      } else {
        if (!(type + "Id" in edge)) {
          throw new Error("Edge must have either a " + type + " or " + type + "Id attribute");
        }
        nodeId = edge[type + "Id"];
        edge[type] = g.node(nodeId);
      }

      if (!g.hasNode(nodeId)) {
        throw new Error(type + " node for '" + e + "' not in node list");
      }
      return nodeId;
    }

    // Tag each node so that we can properly represent relationships when
    // we add edges. Also copy relevant dimension information.
    config.nodes.forEach(function(u) {
      var id = "id" in u ? u.id : "_N" + nextId++;
      u.dagre = { id: id, width: u.width, height: u.height };
      g.addNode(id, u.dagre);
    });

    config.edges.forEach(function(e) {
      var source = safeGetNodeId("source", e);
      var target = safeGetNodeId("target", e);

      e.dagre = { points: [] };

      // Track edges that aren't self loops - layout does nothing for self
      // loops, so they can be skipped.
      if (source !== target) {
        var id = "id" in e ? e.id : "_E" + nextId++;
        e.dagre.id = id;
        e.dagre.minLen = e.minLen || 1;
        e.dagre.width = e.width || 0;
        e.dagre.height = e.height || 0;
        g.addEdge(id, source, target, e.dagre);
      }
    });

    return g;
  }

  function run () {
    var rankSep = self.rankSep();
    try {
      if (!config.nodes.length) {
        return;
      }

      // Build internal graph
      var g = buildAdjacencyGraph();

      // Make space for edge labels
      g.eachEdge(function(e, s, t, a) {
        a.minLen *= 2;
      });
      self.rankSep(rankSep / 2);

      // Reverse edges to get an acyclic graph, we keep the graph in an acyclic
      // state until the very end.
      acyclic(g, config.debugLevel);

      // Determine the rank for each node. Nodes with a lower rank will appear
      // above nodes of higher rank.
      rank(g, config.debugLevel);

      // Normalize the graph by ensuring that every edge is proper (each edge has
      // a length of 1). We achieve this by adding dummy nodes to long edges,
      // thus shortening them.
      normalize(g);

      // Order the nodes so that edge crossings are minimized.
      order.run(g);

      // Find the x and y coordinates for every node in the graph.
      position.run(g);

      // De-normalize the graph by removing dummy nodes and augmenting the
      // original long edges with coordinate information.
      undoNormalize(g);

      // Reverses points for edges that are in a reversed state.
      fixupEdgePoints(g);

      // Reverse edges that were revered previously to get an acyclic graph.
      acyclic.undo(g);
    } finally {
      self.rankSep(rankSep);
    }

    return self;
  }

  /*
   * This function is responsible for "normalizing" the graph. The process of
   * normalization ensures that no edge in the graph has spans more than one
   * rank. To do this it inserts dummy nodes as needed and links them by adding
   * dummy edges. This function keeps enough information in the dummy nodes and
   * edges to ensure that the original graph can be reconstructed later.
   *
   * This method assumes that the input graph is cycle free.
   */
  function normalize(g) {
    var dummyCount = 0;
    g.eachEdge(function(e, s, t, a) {
      var sourceRank = g.node(s).rank;
      var targetRank = g.node(t).rank;
      if (sourceRank + 1 < targetRank) {
        for (var u = s, rank = sourceRank + 1, i = 0; rank < targetRank; ++rank, ++i) {
          var v = "_D" + (++dummyCount);
          var node = {
            width: a.width,
            height: a.height,
            edge: { id: e, source: s, target: t, attrs: a },
            rank: rank,
            dummy: true
          };

          // If this node represents a bend then we will use it as a control
          // point. For edges with 2 segments this will be the center dummy
          // node. For edges with more than two segments, this will be the
          // first and last dummy node.
          if (i === 0) node.index = 0;
          else if (rank + 1 === targetRank) node.index = 1;

          g.addNode(v, node);
          g.addEdge(null, u, v, {});
          u = v;
        }
        g.addEdge(null, u, t, {});
        g.delEdge(e);
      }
    });
  }

  /*
   * Reconstructs the graph as it was before normalization. The positions of
   * dummy nodes are used to build an array of points for the original "long"
   * edge. Dummy nodes and edges are removed.
   */
  function undoNormalize(g) {
    var visited = {};

    g.eachNode(function(u, a) {
      if (a.dummy && "index" in a) {
        var edge = a.edge;
        if (!g.hasEdge(edge.id)) {
          g.addEdge(edge.id, edge.source, edge.target, edge.attrs);
        }
        var points = g.edge(edge.id).points;
        points[a.index] = { x: a.x, y: a.y, ul: a.ul, ur: a.ur, dl: a.dl, dr: a.dr };
        g.delNode(u);
      }
    });
  }

  /*
   * For each edge that was reversed during the `acyclic` step, reverse its
   * array of points.
   */
  function fixupEdgePoints(g) {
    g.eachEdge(function(e, s, t, a) { if (a.reversed) a.points.reverse(); });
  }

  /*
   * Given a function, a new function is returned that invokes the given
   * function. The return value from the function is always the `self` object.
   */
  function delegateProperty(f) {
    return function() {
      if (!arguments.length) return f();
      f.apply(null, arguments);
      return self;
    };
  }
};

},{"../util":13,"./acyclic":8,"./order":10,"./position":11,"./rank":12,"graphlib":27}],10:[function(require,module,exports){
var util = require("../util");

module.exports = function() {
  var config = {
    iterations: 24, // max number of iterations
    debugLevel: 0
  };

  var timer = util.createTimer();

  var self = {};

  self.iterations = util.propertyAccessor(self, config, "iterations");

  self.debugLevel = util.propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
  });

  self._initOrder = initOrder;

  self.run = timer.wrap("Order Phase", run);
  self.crossCount = crossCount;
  self.bilayerCrossCount = bilayerCrossCount;

  return self;

  function run(g) {
    var layering = initOrder(g);
    var bestLayering = copyLayering(layering);
    var bestCC = crossCount(g, layering);

    if (config.debugLevel >= 2) {
      console.log("Order phase start cross count: " + bestCC);
    }

    var cc, i, lastBest;
    for (i = 0, lastBest = 0; lastBest < 4 && i < config.iterations; ++i, ++lastBest) {
      cc = sweep(g, i, layering);
      if (cc < bestCC) {
        bestLayering = copyLayering(layering);
        bestCC = cc;
        lastBest = 0;
      }
      if (config.debugLevel >= 3) {
        console.log("Order phase iter " + i + " cross count: " + bestCC);
      }
    }

    bestLayering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        g.node(u).order = i;
      });
    });

    if (config.debugLevel >= 2) {
      console.log("Order iterations: " + i);
      console.log("Order phase best cross count: " + bestCC);
    }

    if (config.debugLevel >= 4) {
      console.log("Final layering:");
      bestLayering.forEach(function(layer, i) {
        console.log("Layer: " + i, layer);
      });
    }

    return bestLayering;
  }

  function initOrder(g) {
    var layering = [];
    g.eachNode(function(n, a) {
      var layer = layering[a.rank] || (layering[a.rank] = []);
      layer.push(n);
    });
    return layering;
  }

  /*
   * Returns a function that will return the predecessors for a node. This
   * function differs from `g.predecessors(u)` in that a predecessor appears
   * for each incident edge (`g.predecessors(u)` treats predecessors as a set).
   * This allows pseudo-weighting of predecessor nodes.
   */
  function multiPredecessors(g) {
    return function(u) {
      var preds = [];
      g.inEdges(u).forEach(function(e) {
        preds.push(g.source(e));
      });
      return preds;
    };
  }

  /*
   * Same as `multiPredecessors(g)` but for successors.
   */
  function multiSuccessors(g) {
    return function(u) {
      var sucs = [];
      g.outEdges(u).forEach(function(e) {
        sucs.push(g.target(e));
      });
      return sucs;
    };
  }

  function sweep(g, iter, layering) {
    var i;
    if (iter % 2 === 0) {
      for (i = 1; i < layering.length; ++i) {
        sortLayer(layering[i], multiPredecessors(g), layerPos(layering[i-1]));
      }
    } else {
      for (i = layering.length - 2; i >= 0; --i) {
        sortLayer(layering[i], multiSuccessors(g), layerPos(layering[i+1]));
      }
    }
    return crossCount(g, layering);
  }

  /*
   * Given a list of nodes, a function that returns neighbors of a node, and
   * a mapping of the neighbor nodes to their weights, this function sorts
   * the node list by the barycenter calculated for each node.
   */
  function sortLayer(nodes, neighbors, weights) {
    var pos = layerPos(nodes);
    var bs = barycenters(nodes, neighbors, weights);

    var toSort = nodes.filter(function(u) { return bs[u] !== -1; });
    toSort.sort(function(x, y) {
      return bs[x] - bs[y] || pos[x] - pos[y];
    });

    for (var i = nodes.length - 1; i >= 0; --i) {
      if (bs[nodes[i]] !== -1) {
        nodes[i] = toSort.pop();
      }
    }
  }

  /*
   * Given a list of nodes, a function that returns neighbors of a node, and
   * a mapping of the neighbor nodes to their weights, this function returns
   * a mapping of the input nodes to their calculated barycenters. The
   * barycenter values are the average weights of all neighbors of the
   * node. If a node has no neighbors it is assigned a barycenter of -1.
   */
  function barycenters(nodes, neighbors, weights) {
    var bs = {}; // barycenters

    nodes.forEach(function(u) {
      var vs = neighbors(u);
      var b = -1;
      if (vs.length > 0)
        b = util.sum(vs.map(function(v) { return weights[v]; })) / vs.length;
      bs[u] = b;
    });

    return bs;
  }

  function copyLayering(layering) {
    return layering.map(function(l) { return l.slice(0); });
  }

  function crossCount(g, layering) {
    var cc = 0;
    var prevLayer;
    layering.forEach(function(layer) {
      if (prevLayer) {
        cc += bilayerCrossCount(g, prevLayer, layer);
      }
      prevLayer = layer;
    });
    return cc;
  }

  /*
   * This function searches through a ranked and ordered graph and counts the
   * number of edges that cross. This algorithm is derived from:
   *
   *    W. Barth et al., Bilayer Cross Counting, JGAA, 8(2) 179–194 (2004)
   */
  function bilayerCrossCount(g, layer1, layer2) {
    var layer2Pos = layerPos(layer2);

    var indices = [];
    layer1.forEach(function(u) {
      var nodeIndices = [];
      g.outEdges(u).forEach(function(e) { nodeIndices.push(layer2Pos[g.target(e)]); });
      nodeIndices.sort(function(x, y) { return x - y; });
      indices = indices.concat(nodeIndices);
    });

    var firstIndex = 1;
    while (firstIndex < layer2.length) firstIndex <<= 1;

    var treeSize = 2 * firstIndex - 1;
    firstIndex -= 1;

    var tree = [];
    for (var i = 0; i < treeSize; ++i) { tree[i] = 0; }

    var cc = 0;
    indices.forEach(function(i) {
      var treeIndex = i + firstIndex;
      ++tree[treeIndex];
      var weightSum = 0;
      while (treeIndex > 0) {
        if (treeIndex % 2) {
          cc += tree[treeIndex + 1];
        }
        treeIndex = (treeIndex - 1) >> 1;
        ++tree[treeIndex];
      }
    });

    return cc;
  }
};


function layerPos(layer) {
  var pos = {};
  layer.forEach(function(u, i) { pos[u] = i; });
  return pos;
}

},{"../util":13}],11:[function(require,module,exports){
var util = require("../util");

/*
 * The algorithms here are based on Brandes and Köpf, "Fast and Simple
 * Horizontal Coordinate Assignment".
 */
module.exports = function() {
  // External configuration
  var config = {
    nodeSep: 50,
    edgeSep: 10,
    universalSep: null,
    rankSep: 30,
    rankDir: "TB",
    debugLevel: 0
  };

  var timer = util.createTimer();

  var self = {};

  self.nodeSep = util.propertyAccessor(self, config, "nodeSep");
  self.edgeSep = util.propertyAccessor(self, config, "edgeSep");
  // If not null this separation value is used for all nodes and edges
  // regardless of their widths. `nodeSep` and `edgeSep` are ignored with this
  // option.
  self.universalSep = util.propertyAccessor(self, config, "universalSep");
  self.rankSep = util.propertyAccessor(self, config, "rankSep");
  self.rankDir = util.propertyAccessor(self, config, "rankDir");
  self.debugLevel = util.propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
  });

  self.run = timer.wrap("Position Phase", run);

  return self;

  function run(g) {
    var layering = [];
    g.eachNode(function(u, node) {
      var layer = layering[node.rank] || (layering[node.rank] = []);
      layer[node.order] = u;
    });

    var conflicts = findConflicts(g, layering);

    var xss = {};
    ["u", "d"].forEach(function(vertDir) {
      if (vertDir === "d") layering.reverse();

      ["l", "r"].forEach(function(horizDir) {
        if (horizDir === "r") reverseInnerOrder(layering);

        var dir = vertDir + horizDir;
        var align = verticalAlignment(g, layering, conflicts, vertDir === "u" ? "predecessors" : "successors");
        xss[dir]= horizontalCompaction(g, layering, align.pos, align.root, align.align);

        if (config.debugLevel >= 3)
          debugPositioning(vertDir + horizDir, g, layering, xss[dir]);

        if (horizDir === "r") flipHorizontally(xss[dir]);

        if (horizDir === "r") reverseInnerOrder(layering);
      });

      if (vertDir === "d") layering.reverse();
    });

    balance(g, layering, xss);
    g.eachNode(function(v) {
      var xs = [];
      for (var alignment in xss) {
        xDebug(alignment, g, v, xss[alignment][v]);
        xs.push(xss[alignment][v]);
      }
      xs.sort(function(x, y) { return x - y; });
      x(g, v, (xs[1] + xs[2]) / 2);
    });

    // Translate layout so left edge of bounding rectangle has coordinate 0
    var minX = util.min(g.nodes().map(function(u) { return x(g, u) - width(g, u) / 2; }));
    g.eachNode(function(u) { x(g, u, x(g, u) - minX); });

    // Align y coordinates with ranks
    var posY = 0;
    layering.forEach(function(layer) {
      var maxHeight = util.max(layer.map(function(u) { return height(g, u); }));
      posY += maxHeight / 2;
      layer.forEach(function(u) { y(g, u, posY); });
      posY += maxHeight / 2 + config.rankSep;
    });
  };

  /*
   * Generate an ID that can be used to represent any undirected edge that is
   * incident on `u` and `v`.
   */
  function undirEdgeId(u, v) {
    return u < v
      ? u.toString().length + ":" + u + "-" + v
      : v.toString().length + ":" + v + "-" + u;
  }

  function findConflicts(g, layering) {
    var conflicts = {}, // Set of conflicting edge ids
        pos = {};       // Position of node in its layer

    if (layering.length <= 2) return conflicts;

    layering[1].forEach(function(u, i) { pos[u] = i; });
    for (var i = 1; i < layering.length - 1; ++i) {
      var prevLayer = layering[i];
      var currLayer = layering[i+1];
      var k0 = 0; // Position of the last inner segment in the previous layer
      var l = 0;  // Current position in the current layer (for iteration up to `l1`)

      // Scan current layer for next node that is incident to an inner segement
      // between layering[i+1] and layering[i].
      for (var l1 = 0; l1 < currLayer.length; ++l1) {
        var u = currLayer[l1]; // Next inner segment in the current layer or
                               // last node in the current layer
        pos[u] = l1;

        var k1 = undefined; // Position of the next inner segment in the previous layer or
                            // the position of the last element in the previous layer
        if (g.node(u).dummy) {
          var uPred = g.predecessors(u)[0];
          if (g.node(uPred).dummy)
            k1 = pos[uPred];
        }
        if (k1 === undefined && l1 === currLayer.length - 1)
          k1 = prevLayer.length - 1;

        if (k1 !== undefined) {
          for (; l <= l1; ++l) {
            g.predecessors(currLayer[l]).forEach(function(v) {
              var k = pos[v];
              if (k < k0 || k > k1)
                conflicts[undirEdgeId(currLayer[l], v)] = true;
            });
          }
          k0 = k1;
        }
      }
    }

    return conflicts;
  }

  function verticalAlignment(g, layering, conflicts, relationship) {
    var pos = {},   // Position for a node in its layer
        root = {},  // Root of the block that the node participates in
        align = {}; // Points to the next node in the block or, if the last
                    // element in the block, points to the first block's root

    layering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        root[u] = u;
        align[u] = u;
        pos[u] = i;
      });
    });

    layering.forEach(function(layer) {
      var prevIdx = -1;
      layer.forEach(function(v) {
        var related = g[relationship](v), // Adjacent nodes from the previous layer
            mid;                          // The mid point in the related array

        if (related.length > 0) {
          related.sort(function(x, y) { return pos[x] - pos[y]; });
          mid = (related.length - 1) / 2;
          related.slice(Math.floor(mid), Math.ceil(mid) + 1).forEach(function(u) {
            if (align[v] === v) {
              if (!conflicts[undirEdgeId(u, v)] && prevIdx < pos[u]) {
                align[u] = v;
                align[v] = root[v] = root[u];
                prevIdx = pos[u];
              }
            }
          });
        }
      });
    });

    return { pos: pos, root: root, align: align };
  }

  // This function deviates from the standard BK algorithm in two ways. First
  // it takes into account the size of the nodes. Second it includes a fix to
  // the original algorithm that is described in Carstens, "Node and Label
  // Placement in a Layered Layout Algorithm".
  function horizontalCompaction(g, layering, pos, root, align) {
    var sink = {},       // Mapping of node id -> sink node id for class
        maybeShift = {}, // Mapping of sink node id -> { class node id, min shift }
        shift = {},      // Mapping of sink node id -> shift
        pred = {},       // Mapping of node id -> predecessor node (or null)
        xs = {};         // Calculated X positions

    layering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        sink[u] = u;
        maybeShift[u] = {};
        if (i > 0)
          pred[u] = layer[i - 1];
      });
    });

    function updateShift(toShift, neighbor, delta) {
      if (!(neighbor in maybeShift[toShift])) {
        maybeShift[toShift][neighbor] = delta;
      } else {
        maybeShift[toShift][neighbor] = Math.min(maybeShift[toShift][neighbor], delta);
      }
    }

    function placeBlock(v) {
      if (!(v in xs)) {
        xs[v] = 0;
        var w = v;
        do {
          if (pos[w] > 0) {
            var u = root[pred[w]];
            placeBlock(u);
            if (sink[v] === v) {
              sink[v] = sink[u];
            }
            var delta = sep(g, pred[w]) + sep(g, w);
            if (sink[v] !== sink[u]) {
              updateShift(sink[u], sink[v], xs[v] - xs[u] - delta);
            } else {
              xs[v] = Math.max(xs[v], xs[u] + delta);
            }
          }
          w = align[w];
        } while (w !== v);
      }
    }

    // Root coordinates relative to sink
    util.values(root).forEach(function(v) {
      placeBlock(v);
    });

    // Absolute coordinates
    // There is an assumption here that we've resolved shifts for any classes
    // that begin at an earlier layer. We guarantee this by visiting layers in
    // order.
    layering.forEach(function(layer) {
      layer.forEach(function(v) {
        xs[v] = xs[root[v]];
        if (v === root[v] && v === sink[v]) {
          var minShift = 0;
          if (v in maybeShift && Object.keys(maybeShift[v]).length > 0) {
            minShift = util.min(Object.keys(maybeShift[v])
                                 .map(function(u) {
                                      return maybeShift[v][u] + (u in shift ? shift[u] : 0);
                                      }
                                 ));
          }
          shift[v] = minShift;
        }
      });
    });

    layering.forEach(function(layer) {
      layer.forEach(function(v) {
        xs[v] += shift[sink[root[v]]] || 0;
      });
    });

    return xs;
  }

  function findMinCoord(g, layering, xs) {
    return util.min(layering.map(function(layer) {
      var u = layer[0];
      return xs[u];
    }));
  }

  function findMaxCoord(g, layering, xs) {
    return util.max(layering.map(function(layer) {
      var u = layer[layer.length - 1];
      return xs[u];
    }));
  }

  function balance(g, layering, xss) {
    var min = {},                            // Min coordinate for the alignment
        max = {},                            // Max coordinate for the alginment
        smallestAlignment,
        shift = {};                          // Amount to shift a given alignment

    var smallest = Number.POSITIVE_INFINITY;
    for (var alignment in xss) {
      var xs = xss[alignment];
      min[alignment] = findMinCoord(g, layering, xs);
      max[alignment] = findMaxCoord(g, layering, xs);
      var w = max[alignment] - min[alignment];
      if (w < smallest) {
        smallest = w;
        smallestAlignment = alignment;
      }
    }

    // Determine how much to adjust positioning for each alignment
    ["u", "d"].forEach(function(vertDir) {
      ["l", "r"].forEach(function(horizDir) {
        var alignment = vertDir + horizDir;
        shift[alignment] = horizDir === "l"
            ? min[smallestAlignment] - min[alignment]
            : max[smallestAlignment] - max[alignment];
      });
    });

    // Find average of medians for xss array
    for (var alignment in xss) {
      g.eachNode(function(v) {
        xss[alignment][v] += shift[alignment];
      });
    }
  }

  function flipHorizontally(xs) {
    for (var u in xs) {
      xs[u] = -xs[u];
    }
  }

  function reverseInnerOrder(layering) {
    layering.forEach(function(layer) {
      layer.reverse();
    });
  }

  function width(g, u) {
    switch (config.rankDir) {
      case "LR": return g.node(u).height;
      default:   return g.node(u).width;
    }
  }

  function height(g, u) {
    switch(config.rankDir) {
      case "LR": return g.node(u).width;
      default:   return g.node(u).height;
    }
  }

  function sep(g, u) {
    if (config.universalSep !== null) {
      return config.universalSep;
    }
    var w = width(g, u);
    var s = g.node(u).dummy ? config.edgeSep : config.nodeSep;
    return (w + s) / 2;
  }

  function x(g, u, x) {
    switch (config.rankDir) {
      case "LR":
        if (arguments.length < 3) {
          return g.node(u).y;
        } else {
          g.node(u).y = x;
        }
        break;
      default:
        if (arguments.length < 3) {
          return g.node(u).x;
        } else {
          g.node(u).x = x;
        }
    }
  }

  function xDebug(name, g, u, x) {
    switch (config.rankDir) {
      case "LR":
        if (arguments.length < 3) {
          return g.node(u)[name];
        } else {
          g.node(u)[name] = x;
        }
        break;
      default:
        if (arguments.length < 3) {
          return g.node(u)[name];
        } else {
          g.node(u)[name] = x;
        }
    }
  }

  function y(g, u, y) {
    switch (config.rankDir) {
      case "LR":
        if (arguments.length < 3) {
          return g.node(u).x;
        } else {
          g.node(u).x = y;
        }
        break;
      default:
        if (arguments.length < 3) {
          return g.node(u).y;
        } else {
          g.node(u).y = y;
        }
    }
  }

  function debugPositioning(align, g, layering, xs) {
    layering.forEach(function(l, li) {
      var u, xU;
      l.forEach(function(v) {
        var xV = xs[v];
        if (u) {
          var s = sep(g, u) + sep(g, v);
          if (xV - xU < s)
            console.log("Position phase: sep violation. Align: " + align + ". Layer: " + li + ". " +
              "U: " + u + " V: " + v + ". Actual sep: " + (xV - xU) + " Expected sep: " + s);
        }
        u = v;
        xU = xV;
      });
    });
  }
};

},{"../util":13}],12:[function(require,module,exports){
var util = require("../util"),
    components = require("../algo/components"),
    prim = require("../algo/prim"),
    PriorityQueue = require("../data/PriorityQueue"),
    Set = require("../data/Set");

module.exports = function(g, debugLevel) {
  var timer = util.createTimer(debugLevel >= 1);
  timer.wrap("Rank phase", function() {
    initRank(g);

    components(g).forEach(function(cmpt) {
      var subgraph = g.subgraph(cmpt);
      feasibleTree(subgraph);
      normalize(subgraph);
    });
  })();
};

function initRank(g) {
  var minRank = {};
  var pq = new PriorityQueue();

  g.eachNode(function(u) {
    pq.add(u, g.inEdges(u).length);
    minRank[u] = 0;
  });

  while (pq.size() > 0) {
    var minId = pq.min();
    if (pq.priority(minId) > 0) {
      throw new Error("Input graph is not acyclic: " + g.toString());
    }
    pq.removeMin();

    var rank = minRank[minId];
    g.node(minId).rank = rank;

    g.outEdges(minId).forEach(function(e) {
      var target = g.target(e);
      minRank[target] = Math.max(minRank[target], rank + (g.edge(e).minLen || 1));
      pq.decrease(target, pq.priority(target) - 1);
    });
  }
}

function feasibleTree(g) {
  var remaining = new Set(g.nodes()),
      minLen = []; // Array of {u, v, len}

  // Collapse multi-edges and precompute the minLen, which will be the
  // max value of minLen for any edge in the multi-edge.
  var minLenMap = {};
  g.eachEdge(function(e, u, v, edge) {
    var id = incidenceId(u, v);
    if (!(id in minLenMap)) {
      minLen.push(minLenMap[id] = { u: u, v: v, len: 1 });
    }
    minLenMap[id].len = Math.max(minLenMap[id].len, edge.minLen || 1);
  });

  function slack(mle /* minLen entry*/) {
    return Math.abs(g.node(mle.u).rank - g.node(mle.v).rank) - mle.len;
  }

  // Remove arbitrary node - it is effectively the root of the spanning tree.
  remaining.remove(g.nodes()[0]);

  // Finds the next edge with the minimum slack.
  function findMinSlack() {
    var result,
        eSlack = Number.POSITIVE_INFINITY;
    minLen.forEach(function(mle /* minLen entry */) {
      if (remaining.has(mle.u) !== remaining.has(mle.v)) {
        var mleSlack = slack(mle);
        if (mleSlack < eSlack) {
          if (!remaining.has(mle.u)) {
            result = { treeNode: mle.u, graphNode: mle.v, len: mle.len};
          } else {
            result = { treeNode: mle.v, graphNode: mle.u, len: -mle.len };
          }
          eSlack = mleSlack;
        }
      }
    });

    return result;
  }

  while (remaining.size() > 0) {
    var result = findMinSlack();
    remaining.remove(result.graphNode);
    g.node(result.graphNode).rank = g.node(result.treeNode).rank + result.len;
  }
}

function normalize(g) {
  var m = util.min(g.nodes().map(function(u) { return g.node(u).rank; }));
  g.eachNode(function(u, node) { node.rank -= m; });
}

/*
 * This id can be used to group (in an undirected manner) multi-edges
 * incident on the same two nodes.
 */
function incidenceId(u, v) {
  return u < v ?  u.length + ":" + u + "-" + v : v.length + ":" + v + "-" + u;
}

},{"../algo/components":3,"../algo/prim":4,"../data/PriorityQueue":5,"../data/Set":6,"../util":13}],13:[function(require,module,exports){
/*
 * Copies attributes from `src` to `dst`. If an attribute name is in both
 * `src` and `dst` then the attribute value from `src` takes precedence.
 */
exports.mergeAttributes = function(src, dst) {
  Object.keys(src).forEach(function(k) { dst[k] = src[k]; });
};

/*
 * Returns the smallest value in the array.
 */
exports.min = function(values) {
  return Math.min.apply(null, values);
};

/*
 * Returns the largest value in the array.
 */
exports.max = function(values) {
  return Math.max.apply(null, values);
};

/*
 * Returns `true` only if `f(x)` is `true` for all `x` in `xs`. Otherwise
 * returns `false`. This function will return immediately if it finds a
 * case where `f(x)` does not hold.
 */
exports.all = function(xs, f) {
  for (var i = 0; i < xs.length; ++i) {
    if (!f(xs[i])) {
      return false; 
    }
  }
  return true;
};

/*
 * Accumulates the sum of elements in the given array using the `+` operator.
 */
exports.sum = function(values) {
  return values.reduce(function(acc, x) { return acc + x; }, 0);
};

/*
 * Joins all of the given arrays into a single array.
 */
exports.concat = function(arrays) {
  return Array.prototype.concat.apply([], arrays);
};

/*
 * Returns an array of all values in the given object.
 */
exports.values = function(obj) {
  return Object.keys(obj).map(function(k) { return obj[k]; });
};

/*
 * Treats each input array as a set and returns the union of all of the arrays.
 * This function biases towards the last array. That is, if an "equivalent"
 * key appears in more than on array, the resulting array will contain the last
 * "equivalent" key.
 */
exports.union = function(arrays) {
  var obj = {};
  for (var i = 0; i < arrays.length; ++i) {
    var a = arrays[i];
    for (var j = 0; j < a.length; ++j) {
      var v = a[j];
      obj[v] = v;
    }
  }

  var results = [];
  for (var k in obj) {
    results.push(obj[k]);
  }

  return results;
};

exports.intersectRect = function(rect, point) {
  var x = rect.x;
  var y = rect.y;

  // For now we only support rectangles

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  var dx = point.x - x;
  var dy = point.y - y;
  var w = rect.width / 2;
  var h = rect.height / 2;

  var sx, sy;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = dy === 0 ? 0 : h * dx / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = dx === 0 ? 0 : w * dy / dx;
  }

  return {x: x + sx, y: y + sy};
};

exports.pointStr = function(point) {
  return point.x + "," + point.y;
};

exports.createTimer = function(enabled) {
  var self = {};

  // Default to disabled
  enabled = enabled || false;

  self.enabled = function(x) {
    if (!arguments.length) return enabled;
    enabled = x;
    return self;
  };

  self.wrap = function(name, func) {
    return function() {
      var start = enabled ? new Date().getTime() : null;
      try {
        return func.apply(null, arguments);
      } finally {
        if (start) console.log(name + " time: " + (new Date().getTime() - start) + "ms");
      }
    };
  };

  return self;
};

exports.propertyAccessor = function(self, config, field, setHook) {
  return function(x) {
    if (!arguments.length) return config[field];
    config[field] = x;
    if (setHook) setHook(x);
    return self;
  };
};

},{}],14:[function(require,module,exports){
module.exports = '0.2.0';

},{}],15:[function(require,module,exports){
module.exports = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "start": parse_start,
        "graphStmt": parse_graphStmt,
        "stmtList": parse_stmtList,
        "stmt": parse_stmt,
        "attrStmt": parse_attrStmt,
        "inlineAttrStmt": parse_inlineAttrStmt,
        "nodeStmt": parse_nodeStmt,
        "edgeStmt": parse_edgeStmt,
        "subgraphStmt": parse_subgraphStmt,
        "attrList": parse_attrList,
        "attrListBlock": parse_attrListBlock,
        "aList": parse_aList,
        "edgeRHS": parse_edgeRHS,
        "idDef": parse_idDef,
        "nodeIdOrSubgraph": parse_nodeIdOrSubgraph,
        "nodeId": parse_nodeId,
        "port": parse_port,
        "compassPt": parse_compassPt,
        "id": parse_id,
        "node": parse_node,
        "edge": parse_edge,
        "graph": parse_graph,
        "digraph": parse_digraph,
        "subgraph": parse_subgraph,
        "strict": parse_strict,
        "graphType": parse_graphType,
        "whitespace": parse_whitespace,
        "comment": parse_comment,
        "_": parse__
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "start";
      }
      
      var pos = 0;
      var reportFailures = 0;
      var rightmostFailuresPos = 0;
      var rightmostFailuresExpected = [];
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function matchFailed(failure) {
        if (pos < rightmostFailuresPos) {
          return;
        }
        
        if (pos > rightmostFailuresPos) {
          rightmostFailuresPos = pos;
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_start() {
        var result0, result1;
        
        result1 = parse_graphStmt();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_graphStmt();
          }
        } else {
          result0 = null;
        }
        return result0;
      }
      
      function parse_graphStmt() {
        var result0, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10, result11, result12;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = [];
        result1 = parse__();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse__();
        }
        if (result0 !== null) {
          pos2 = pos;
          result1 = parse_strict();
          if (result1 !== null) {
            result2 = parse__();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_graphType();
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result4 = parse_id();
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result5 = [];
                  result6 = parse__();
                  while (result6 !== null) {
                    result5.push(result6);
                    result6 = parse__();
                  }
                  if (result5 !== null) {
                    if (input.charCodeAt(pos) === 123) {
                      result6 = "{";
                      pos++;
                    } else {
                      result6 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"{\"");
                      }
                    }
                    if (result6 !== null) {
                      result7 = [];
                      result8 = parse__();
                      while (result8 !== null) {
                        result7.push(result8);
                        result8 = parse__();
                      }
                      if (result7 !== null) {
                        result8 = parse_stmtList();
                        result8 = result8 !== null ? result8 : "";
                        if (result8 !== null) {
                          result9 = [];
                          result10 = parse__();
                          while (result10 !== null) {
                            result9.push(result10);
                            result10 = parse__();
                          }
                          if (result9 !== null) {
                            if (input.charCodeAt(pos) === 125) {
                              result10 = "}";
                              pos++;
                            } else {
                              result10 = null;
                              if (reportFailures === 0) {
                                matchFailed("\"}\"");
                              }
                            }
                            if (result10 !== null) {
                              result11 = [];
                              result12 = parse__();
                              while (result12 !== null) {
                                result11.push(result12);
                                result12 = parse__();
                              }
                              if (result11 !== null) {
                                result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10, result11];
                              } else {
                                result0 = null;
                                pos = pos1;
                              }
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, type, id, stmts) {
                return {type: type, id: id, stmts: stmts};
              })(pos0, result0[2], result0[4], result0[8]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_stmtList() {
        var result0, result1, result2, result3, result4, result5, result6, result7;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_stmt();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 59) {
              result2 = ";";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\";\"");
              }
            }
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result3 = [];
              pos2 = pos;
              result4 = [];
              result5 = parse__();
              while (result5 !== null) {
                result4.push(result5);
                result5 = parse__();
              }
              if (result4 !== null) {
                result5 = parse_stmt();
                if (result5 !== null) {
                  result6 = [];
                  result7 = parse__();
                  while (result7 !== null) {
                    result6.push(result7);
                    result7 = parse__();
                  }
                  if (result6 !== null) {
                    if (input.charCodeAt(pos) === 59) {
                      result7 = ";";
                      pos++;
                    } else {
                      result7 = null;
                      if (reportFailures === 0) {
                        matchFailed("\";\"");
                      }
                    }
                    result7 = result7 !== null ? result7 : "";
                    if (result7 !== null) {
                      result4 = [result4, result5, result6, result7];
                    } else {
                      result4 = null;
                      pos = pos2;
                    }
                  } else {
                    result4 = null;
                    pos = pos2;
                  }
                } else {
                  result4 = null;
                  pos = pos2;
                }
              } else {
                result4 = null;
                pos = pos2;
              }
              while (result4 !== null) {
                result3.push(result4);
                pos2 = pos;
                result4 = [];
                result5 = parse__();
                while (result5 !== null) {
                  result4.push(result5);
                  result5 = parse__();
                }
                if (result4 !== null) {
                  result5 = parse_stmt();
                  if (result5 !== null) {
                    result6 = [];
                    result7 = parse__();
                    while (result7 !== null) {
                      result6.push(result7);
                      result7 = parse__();
                    }
                    if (result6 !== null) {
                      if (input.charCodeAt(pos) === 59) {
                        result7 = ";";
                        pos++;
                      } else {
                        result7 = null;
                        if (reportFailures === 0) {
                          matchFailed("\";\"");
                        }
                      }
                      result7 = result7 !== null ? result7 : "";
                      if (result7 !== null) {
                        result4 = [result4, result5, result6, result7];
                      } else {
                        result4 = null;
                        pos = pos2;
                      }
                    } else {
                      result4 = null;
                      pos = pos2;
                    }
                  } else {
                    result4 = null;
                    pos = pos2;
                  }
                } else {
                  result4 = null;
                  pos = pos2;
                }
              }
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, first, rest) {
                var result = [first];
                for (var i = 0; i < rest.length; ++i) {
                    result.push(rest[i][1]);
                }
                return result;
              })(pos0, result0[0], result0[3]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_stmt() {
        var result0;
        
        result0 = parse_attrStmt();
        if (result0 === null) {
          result0 = parse_edgeStmt();
          if (result0 === null) {
            result0 = parse_subgraphStmt();
            if (result0 === null) {
              result0 = parse_inlineAttrStmt();
              if (result0 === null) {
                result0 = parse_nodeStmt();
              }
            }
          }
        }
        return result0;
      }
      
      function parse_attrStmt() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_graph();
        if (result0 === null) {
          result0 = parse_node();
          if (result0 === null) {
            result0 = parse_edge();
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_attrList();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, type, attrs) {
                return { type: "attr", attrType: type, attrs: attrs || {}};
              })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_inlineAttrStmt() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_id();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 61) {
              result2 = "=";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"=\"");
              }
            }
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result4 = parse_id();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, k, v) {
                var attrs = {};
                attrs[k] = v;
                return { type: "inlineAttr", attrs: attrs };
              })(pos0, result0[0], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_nodeStmt() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_nodeId();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_attrList();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, id, attrs) { return {type: "node", id: id, attrs: attrs || {}}; })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_edgeStmt() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_nodeIdOrSubgraph();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_edgeRHS();
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result4 = parse_attrList();
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, lhs, rhs, attrs) {
                var elems = [lhs];
                for (var i = 0; i < rhs.length; ++i) {
                    elems.push(rhs[i]);
                }
                return { type: "edge", elems: elems, attrs: attrs || {} };
              })(pos0, result0[0], result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_subgraphStmt() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2, pos3;
        
        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        result0 = parse_subgraph();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            pos3 = pos;
            result2 = parse_id();
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos3;
              }
            } else {
              result2 = null;
              pos = pos3;
            }
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos2;
            }
          } else {
            result0 = null;
            pos = pos2;
          }
        } else {
          result0 = null;
          pos = pos2;
        }
        result0 = result0 !== null ? result0 : "";
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 123) {
            result1 = "{";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"{\"");
            }
          }
          if (result1 !== null) {
            result2 = [];
            result3 = parse__();
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse__();
            }
            if (result2 !== null) {
              result3 = parse_stmtList();
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result4 = [];
                result5 = parse__();
                while (result5 !== null) {
                  result4.push(result5);
                  result5 = parse__();
                }
                if (result4 !== null) {
                  if (input.charCodeAt(pos) === 125) {
                    result5 = "}";
                    pos++;
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"}\"");
                    }
                  }
                  if (result5 !== null) {
                    result0 = [result0, result1, result2, result3, result4, result5];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, id, stmts) {
                id = id[2] || [];
                return { type: "subgraph", id: id[0], stmts: stmts };
              })(pos0, result0[0], result0[3]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_attrList() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_attrListBlock();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = [];
          result3 = parse__();
          while (result3 !== null) {
            result2.push(result3);
            result3 = parse__();
          }
          if (result2 !== null) {
            result3 = parse_attrListBlock();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = [];
            result3 = parse__();
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse__();
            }
            if (result2 !== null) {
              result3 = parse_attrListBlock();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, first, rest) {
                var result = first;
                for (var i = 0; i < rest.length; ++i) {
                    result = rightBiasedMerge(result, rest[i][1]);
                }
                return result;
              })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_attrListBlock() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 91) {
          result0 = "[";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"[\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_aList();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                if (input.charCodeAt(pos) === 93) {
                  result4 = "]";
                  pos++;
                } else {
                  result4 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"]\"");
                  }
                }
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, aList) { return aList; })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_aList() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_idDef();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = [];
          result3 = parse__();
          while (result3 !== null) {
            result2.push(result3);
            result3 = parse__();
          }
          if (result2 !== null) {
            if (input.charCodeAt(pos) === 44) {
              result3 = ",";
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("\",\"");
              }
            }
            result3 = result3 !== null ? result3 : "";
            if (result3 !== null) {
              result4 = [];
              result5 = parse__();
              while (result5 !== null) {
                result4.push(result5);
                result5 = parse__();
              }
              if (result4 !== null) {
                result5 = parse_idDef();
                if (result5 !== null) {
                  result2 = [result2, result3, result4, result5];
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = [];
            result3 = parse__();
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse__();
            }
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 44) {
                result3 = ",";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\",\"");
                }
              }
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result4 = [];
                result5 = parse__();
                while (result5 !== null) {
                  result4.push(result5);
                  result5 = parse__();
                }
                if (result4 !== null) {
                  result5 = parse_idDef();
                  if (result5 !== null) {
                    result2 = [result2, result3, result4, result5];
                  } else {
                    result2 = null;
                    pos = pos2;
                  }
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, first, rest) {
                var result = first;
                for (var i = 0; i < rest.length; ++i) {
                    result = rightBiasedMerge(result, rest[i][3]);
                }
                return result;
              })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_edgeRHS() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        if (input.substr(pos, 2) === "--") {
          result0 = "--";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"--\"");
          }
        }
        if (result0 !== null) {
          result1 = (function(offset) { return directed; })(pos) ? null : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos2;
          }
        } else {
          result0 = null;
          pos = pos2;
        }
        if (result0 === null) {
          pos2 = pos;
          if (input.substr(pos, 2) === "->") {
            result0 = "->";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"->\"");
            }
          }
          if (result0 !== null) {
            result1 = (function(offset) { return directed; })(pos) ? "" : null;
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos2;
            }
          } else {
            result0 = null;
            pos = pos2;
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_nodeIdOrSubgraph();
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result4 = parse_edgeRHS();
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, rhs, rest) {
                var result = [rhs];
                for (var i = 0; i < rest.length; ++i) {
                    result.push(rest[i]);
                }
                return result;
              })(pos0, result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_idDef() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_id();
        if (result0 !== null) {
          pos2 = pos;
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 61) {
              result2 = "=";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"=\"");
              }
            }
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                result4 = parse_id();
                if (result4 !== null) {
                  result1 = [result1, result2, result3, result4];
                } else {
                  result1 = null;
                  pos = pos2;
                }
              } else {
                result1 = null;
                pos = pos2;
              }
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, k, v) {
                var result = {};
                result[k] = v[3];
                return result;
              })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_nodeIdOrSubgraph() {
        var result0;
        var pos0;
        
        result0 = parse_subgraphStmt();
        if (result0 === null) {
          pos0 = pos;
          result0 = parse_nodeId();
          if (result0 !== null) {
            result0 = (function(offset, id) { return { type: "node", id: id, attrs: {} }; })(pos0, result0);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_nodeId() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_id();
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_port();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, id) { return id; })(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_port() {
        var result0, result1, result2, result3, result4, result5, result6;
        var pos0, pos1;
        
        pos0 = pos;
        if (input.charCodeAt(pos) === 58) {
          result0 = ":";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\":\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse__();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse__();
          }
          if (result1 !== null) {
            result2 = parse_id();
            if (result2 !== null) {
              result3 = [];
              result4 = parse__();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse__();
              }
              if (result3 !== null) {
                pos1 = pos;
                if (input.charCodeAt(pos) === 58) {
                  result4 = ":";
                  pos++;
                } else {
                  result4 = null;
                  if (reportFailures === 0) {
                    matchFailed("\":\"");
                  }
                }
                if (result4 !== null) {
                  result5 = [];
                  result6 = parse__();
                  while (result6 !== null) {
                    result5.push(result6);
                    result6 = parse__();
                  }
                  if (result5 !== null) {
                    result6 = parse_compassPt();
                    if (result6 !== null) {
                      result4 = [result4, result5, result6];
                    } else {
                      result4 = null;
                      pos = pos1;
                    }
                  } else {
                    result4 = null;
                    pos = pos1;
                  }
                } else {
                  result4 = null;
                  pos = pos1;
                }
                result4 = result4 !== null ? result4 : "";
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_compassPt() {
        var result0;
        
        if (input.charCodeAt(pos) === 110) {
          result0 = "n";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"n\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 2) === "ne") {
            result0 = "ne";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"ne\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 101) {
              result0 = "e";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"e\"");
              }
            }
            if (result0 === null) {
              if (input.substr(pos, 2) === "se") {
                result0 = "se";
                pos += 2;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"se\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 115) {
                  result0 = "s";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"s\"");
                  }
                }
                if (result0 === null) {
                  if (input.substr(pos, 2) === "sw") {
                    result0 = "sw";
                    pos += 2;
                  } else {
                    result0 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"sw\"");
                    }
                  }
                  if (result0 === null) {
                    if (input.charCodeAt(pos) === 119) {
                      result0 = "w";
                      pos++;
                    } else {
                      result0 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"w\"");
                      }
                    }
                    if (result0 === null) {
                      if (input.substr(pos, 2) === "nw") {
                        result0 = "nw";
                        pos += 2;
                      } else {
                        result0 = null;
                        if (reportFailures === 0) {
                          matchFailed("\"nw\"");
                        }
                      }
                      if (result0 === null) {
                        if (input.charCodeAt(pos) === 99) {
                          result0 = "c";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"c\"");
                          }
                        }
                        if (result0 === null) {
                          if (input.charCodeAt(pos) === 95) {
                            result0 = "_";
                            pos++;
                          } else {
                            result0 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"_\"");
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_id() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1, pos2, pos3;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        if (/^[a-zA-Z\u0200-\u0377_]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z\\u0200-\\u0377_]");
          }
        }
        if (result0 !== null) {
          result1 = [];
          if (/^[a-zA-Z\u0200-\u0377_0-9]/.test(input.charAt(pos))) {
            result2 = input.charAt(pos);
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z\\u0200-\\u0377_0-9]");
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            if (/^[a-zA-Z\u0200-\u0377_0-9]/.test(input.charAt(pos))) {
              result2 = input.charAt(pos);
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[a-zA-Z\\u0200-\\u0377_0-9]");
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, fst, rest) { return fst + rest.join(""); })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          if (input.charCodeAt(pos) === 45) {
            result0 = "-";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
          result0 = result0 !== null ? result0 : "";
          if (result0 !== null) {
            if (input.charCodeAt(pos) === 46) {
              result1 = ".";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\".\"");
              }
            }
            if (result1 !== null) {
              if (/^[0-9]/.test(input.charAt(pos))) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("[0-9]");
                }
              }
              if (result3 !== null) {
                result2 = [];
                while (result3 !== null) {
                  result2.push(result3);
                  if (/^[0-9]/.test(input.charAt(pos))) {
                    result3 = input.charAt(pos);
                    pos++;
                  } else {
                    result3 = null;
                    if (reportFailures === 0) {
                      matchFailed("[0-9]");
                    }
                  }
                }
              } else {
                result2 = null;
              }
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, sign, dot, after) { return sign + dot + after.join(""); })(pos0, result0[0], result0[1], result0[2]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            if (input.charCodeAt(pos) === 45) {
              result0 = "-";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"-\"");
              }
            }
            result0 = result0 !== null ? result0 : "";
            if (result0 !== null) {
              if (/^[0-9]/.test(input.charAt(pos))) {
                result2 = input.charAt(pos);
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("[0-9]");
                }
              }
              if (result2 !== null) {
                result1 = [];
                while (result2 !== null) {
                  result1.push(result2);
                  if (/^[0-9]/.test(input.charAt(pos))) {
                    result2 = input.charAt(pos);
                    pos++;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("[0-9]");
                    }
                  }
                }
              } else {
                result1 = null;
              }
              if (result1 !== null) {
                pos2 = pos;
                if (input.charCodeAt(pos) === 46) {
                  result2 = ".";
                  pos++;
                } else {
                  result2 = null;
                  if (reportFailures === 0) {
                    matchFailed("\".\"");
                  }
                }
                if (result2 !== null) {
                  result3 = [];
                  if (/^[0-9]/.test(input.charAt(pos))) {
                    result4 = input.charAt(pos);
                    pos++;
                  } else {
                    result4 = null;
                    if (reportFailures === 0) {
                      matchFailed("[0-9]");
                    }
                  }
                  while (result4 !== null) {
                    result3.push(result4);
                    if (/^[0-9]/.test(input.charAt(pos))) {
                      result4 = input.charAt(pos);
                      pos++;
                    } else {
                      result4 = null;
                      if (reportFailures === 0) {
                        matchFailed("[0-9]");
                      }
                    }
                  }
                  if (result3 !== null) {
                    result2 = [result2, result3];
                  } else {
                    result2 = null;
                    pos = pos2;
                  }
                } else {
                  result2 = null;
                  pos = pos2;
                }
                result2 = result2 !== null ? result2 : "";
                if (result2 !== null) {
                  result0 = [result0, result1, result2];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, sign, before, after) { return sign + before.join("") + (after[0] || "") + (after[1] || []).join(""); })(pos0, result0[0], result0[1], result0[2]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              pos1 = pos;
              if (input.charCodeAt(pos) === 34) {
                result0 = "\"";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"\\\"\"");
                }
              }
              if (result0 !== null) {
                result1 = [];
                pos2 = pos;
                if (input.substr(pos, 2) === "\\\"") {
                  result2 = "\\\"";
                  pos += 2;
                } else {
                  result2 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"\\\\\\\"\"");
                  }
                }
                if (result2 !== null) {
                  result2 = (function(offset) { return '"'; })(pos2);
                }
                if (result2 === null) {
                  pos = pos2;
                }
                if (result2 === null) {
                  pos2 = pos;
                  pos3 = pos;
                  if (input.charCodeAt(pos) === 92) {
                    result2 = "\\";
                    pos++;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"\\\\\"");
                    }
                  }
                  if (result2 !== null) {
                    if (/^[^"]/.test(input.charAt(pos))) {
                      result3 = input.charAt(pos);
                      pos++;
                    } else {
                      result3 = null;
                      if (reportFailures === 0) {
                        matchFailed("[^\"]");
                      }
                    }
                    if (result3 !== null) {
                      result2 = [result2, result3];
                    } else {
                      result2 = null;
                      pos = pos3;
                    }
                  } else {
                    result2 = null;
                    pos = pos3;
                  }
                  if (result2 !== null) {
                    result2 = (function(offset, ch) { return "\\" + ch; })(pos2, result2[1]);
                  }
                  if (result2 === null) {
                    pos = pos2;
                  }
                  if (result2 === null) {
                    if (/^[^"]/.test(input.charAt(pos))) {
                      result2 = input.charAt(pos);
                      pos++;
                    } else {
                      result2 = null;
                      if (reportFailures === 0) {
                        matchFailed("[^\"]");
                      }
                    }
                  }
                }
                while (result2 !== null) {
                  result1.push(result2);
                  pos2 = pos;
                  if (input.substr(pos, 2) === "\\\"") {
                    result2 = "\\\"";
                    pos += 2;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"\\\\\\\"\"");
                    }
                  }
                  if (result2 !== null) {
                    result2 = (function(offset) { return '"'; })(pos2);
                  }
                  if (result2 === null) {
                    pos = pos2;
                  }
                  if (result2 === null) {
                    pos2 = pos;
                    pos3 = pos;
                    if (input.charCodeAt(pos) === 92) {
                      result2 = "\\";
                      pos++;
                    } else {
                      result2 = null;
                      if (reportFailures === 0) {
                        matchFailed("\"\\\\\"");
                      }
                    }
                    if (result2 !== null) {
                      if (/^[^"]/.test(input.charAt(pos))) {
                        result3 = input.charAt(pos);
                        pos++;
                      } else {
                        result3 = null;
                        if (reportFailures === 0) {
                          matchFailed("[^\"]");
                        }
                      }
                      if (result3 !== null) {
                        result2 = [result2, result3];
                      } else {
                        result2 = null;
                        pos = pos3;
                      }
                    } else {
                      result2 = null;
                      pos = pos3;
                    }
                    if (result2 !== null) {
                      result2 = (function(offset, ch) { return "\\" + ch; })(pos2, result2[1]);
                    }
                    if (result2 === null) {
                      pos = pos2;
                    }
                    if (result2 === null) {
                      if (/^[^"]/.test(input.charAt(pos))) {
                        result2 = input.charAt(pos);
                        pos++;
                      } else {
                        result2 = null;
                        if (reportFailures === 0) {
                          matchFailed("[^\"]");
                        }
                      }
                    }
                  }
                }
                if (result1 !== null) {
                  if (input.charCodeAt(pos) === 34) {
                    result2 = "\"";
                    pos++;
                  } else {
                    result2 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"\\\"\"");
                    }
                  }
                  if (result2 !== null) {
                    result0 = [result0, result1, result2];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
              if (result0 !== null) {
                result0 = (function(offset, id) { return id.join(""); })(pos0, result0[1]);
              }
              if (result0 === null) {
                pos = pos0;
              }
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("identifier");
        }
        return result0;
      }
      
      function parse_node() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 4).toLowerCase() === "node") {
          result0 = input.substr(pos, 4);
          pos += 4;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"node\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_edge() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 4).toLowerCase() === "edge") {
          result0 = input.substr(pos, 4);
          pos += 4;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"edge\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_graph() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 5).toLowerCase() === "graph") {
          result0 = input.substr(pos, 5);
          pos += 5;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"graph\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_digraph() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 7).toLowerCase() === "digraph") {
          result0 = input.substr(pos, 7);
          pos += 7;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"digraph\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_subgraph() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 8).toLowerCase() === "subgraph") {
          result0 = input.substr(pos, 8);
          pos += 8;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"subgraph\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_strict() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (input.substr(pos, 6).toLowerCase() === "strict") {
          result0 = input.substr(pos, 6);
          pos += 6;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"strict\"");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, k) { return k.toLowerCase(); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_graphType() {
        var result0;
        var pos0;
        
        result0 = parse_graph();
        if (result0 === null) {
          pos0 = pos;
          result0 = parse_digraph();
          if (result0 !== null) {
            result0 = (function(offset, graph) {
                  directed = graph === "digraph";
                  return graph;
                })(pos0, result0);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_whitespace() {
        var result0, result1;
        
        reportFailures++;
        if (/^[ \t\r\n]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[ \\t\\r\\n]");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (/^[ \t\r\n]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[ \\t\\r\\n]");
              }
            }
          }
        } else {
          result0 = null;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("whitespace");
        }
        return result0;
      }
      
      function parse_comment() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        reportFailures++;
        pos0 = pos;
        if (input.substr(pos, 2) === "//") {
          result0 = "//";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"//\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          if (/^[^\n]/.test(input.charAt(pos))) {
            result2 = input.charAt(pos);
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[^\\n]");
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            if (/^[^\n]/.test(input.charAt(pos))) {
              result2 = input.charAt(pos);
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[^\\n]");
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          if (input.substr(pos, 2) === "/*") {
            result0 = "/*";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"/*\"");
            }
          }
          if (result0 !== null) {
            result1 = [];
            pos1 = pos;
            pos2 = pos;
            reportFailures++;
            if (input.substr(pos, 2) === "*/") {
              result2 = "*/";
              pos += 2;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"*/\"");
              }
            }
            reportFailures--;
            if (result2 === null) {
              result2 = "";
            } else {
              result2 = null;
              pos = pos2;
            }
            if (result2 !== null) {
              if (input.length > pos) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("any character");
                }
              }
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
            while (result2 !== null) {
              result1.push(result2);
              pos1 = pos;
              pos2 = pos;
              reportFailures++;
              if (input.substr(pos, 2) === "*/") {
                result2 = "*/";
                pos += 2;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("\"*/\"");
                }
              }
              reportFailures--;
              if (result2 === null) {
                result2 = "";
              } else {
                result2 = null;
                pos = pos2;
              }
              if (result2 !== null) {
                if (input.length > pos) {
                  result3 = input.charAt(pos);
                  pos++;
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("any character");
                  }
                }
                if (result3 !== null) {
                  result2 = [result2, result3];
                } else {
                  result2 = null;
                  pos = pos1;
                }
              } else {
                result2 = null;
                pos = pos1;
              }
            }
            if (result1 !== null) {
              if (input.substr(pos, 2) === "*/") {
                result2 = "*/";
                pos += 2;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("\"*/\"");
                }
              }
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("comment");
        }
        return result0;
      }
      
      function parse__() {
        var result0;
        
        result0 = parse_whitespace();
        if (result0 === null) {
          result0 = parse_comment();
        }
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {
          var ch = input.charAt(i);
          if (ch === "\n") {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
          var directed;
      
          function rightBiasedMerge(lhs, rhs) {
              var result = {};
              for (var k in lhs) {
                  result[k] = lhs[k];
              }
              for (var k in rhs) {
                  result[k] = rhs[k];
              }
              return result;     
          }
      
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var offset = Math.max(pos, rightmostFailuresPos);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = computeErrorPosition();
        
        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();

},{}],16:[function(require,module,exports){
var parse = require("./parse"),
    write = require("./write");

exports.parse = exports.decode = parse;
exports.parseMany = parse.parseMany;
exports.write = exports.encode = write;

// This makes graphlib-dot a valid levelup encoding.
exports.type = 'dot';
exports.buffer = false;


},{"./parse":17,"./write":19}],17:[function(require,module,exports){
var util = require("./util"),
    Digraph = require("graphlib").Digraph;

var dot_parser = require("./dot-grammar");

module.exports = parse;
module.exports.parseMany = parseMany;

/*
 * Parses a single DOT graph from the given string and returns its `Digraph`
 * representation.
 *
 * Note: this is exported as the module export.
 *
 * @param {String} str the DOT string representation of one or more graphs
 */
function parse(str) {
  return parseMany(str)[0];
}

/*
 * Parses one or more DOT graphs in the given string and returns a `Digraph`
 * representation.
 *
 * @param {String} str the DOT string representation of one or more graphs
 */
function parseMany(str) {
  var parseTree = dot_parser.parse(str);

  return parseTree.map(function(subtree) {
    return buildParseTree(subtree);
  });
}

function buildParseTree(parseTree) {
  var g = new Digraph();
  var undir = parseTree.type === "graph";
  g.type = parseTree.type;

  function createNode(id, attrs) {
    if (!(g.hasNode(id))) {
      // We only apply default attributes to a node when it is first defined.
      // If the node is subsequently used in edges, we skip apply default
      // attributes.
      g.addNode(id, defaultAttrs.get("node", { id: id }));

      // The "label" attribute is given special treatment: if it is not
      // defined we set it to the id of the node.
      if (g.node(id).label === undefined) {
        g.node(id).label = id;
      }
    }
    if (attrs) {
      util.mergeAttributes(attrs, g.node(id));
    }
  }

  var edgeCount = {};
  function createEdge(source, target, attrs) {
    var edgeKey = source + "-" + target;
    var count = edgeCount[edgeKey];
    if (!count) {
      count = edgeCount[edgeKey] = 0;
    }
    edgeCount[edgeKey]++;

    var id = attrs.id || edgeKey + "-" + count;
    var edge = {};
    util.mergeAttributes(defaultAttrs.get("edge", attrs), edge);
    util.mergeAttributes({ id: id }, edge);
    g.addEdge(id, source, target, edge);
  }

  function collectNodeIds(stmt) {
    var ids = {},
        stack = [],
        curr;
    function pushStack(e) { stack.push(e); }

    pushStack(stmt);
    while (stack.length !== 0) {
      curr = stack.pop();
      switch (curr.type) {
        case "node": ids[curr.id] = true; break;
        case "edge":
          curr.elems.forEach(pushStack);
          break;
        case "subgraph":
          curr.stmts.forEach(pushStack);
          break;
      }
    }
    return Object.keys(ids);
  }

  /*!
   * We use a chain of prototypes to maintain properties as we descend into
   * subgraphs. This allows us to simply get the value for a property and have
   * the VM do appropriate resolution. When we leave a subgraph we simply set
   * the current context to the prototype of the current defaults object.
   * Alternatively, this could have been written using a stack.
   */
  var defaultAttrs = {
    _default: {},

    get: function get(type, attrs) {
      if (typeof this._default[type] !== "undefined") {
        var mergedAttrs = {};
        // clone default attributes so they won't get overwritten in the next step
        util.mergeAttributes(this._default[type], mergedAttrs);
        // merge statement attributes with default attributes, precedence give to stmt attributes
        util.mergeAttributes(attrs, mergedAttrs);
        return mergedAttrs;
      } else {
        return attrs;
      }
    },

    set: function set(type, attrs) {
      this._default[type] = this.get(type, attrs);
    },

    enterSubDigraph: function() {
      function SubDigraph() {}
      SubDigraph.prototype = this._default;
      var subgraph = new SubDigraph();
      this._default = subgraph;
    },

    exitSubDigraph: function() {
      this._default = Object.getPrototypeOf(this._default);
    }
  };

  function handleStmt(stmt) {
    var attrs = stmt.attrs;
    switch (stmt.type) {
      case "node":
        createNode(stmt.id, attrs);
        break;
      case "edge":
        var prev,
            curr;
        stmt.elems.forEach(function(elem) {
          handleStmt(elem);

          switch(elem.type) {
            case "node": curr = [elem.id]; break;
            case "subgraph": curr = collectNodeIds(elem); break;
            default:
              // We don't currently support subgraphs incident on an edge
              throw new Error("Unsupported type incident on edge: " + elem.type);
          }

          if (prev) {
            prev.forEach(function(p) {
              curr.forEach(function(c) {
                createEdge(p, c, attrs);
                if (undir) {
                  createEdge(c, p, attrs);
                }
              });
            });
          }
          prev = curr;
        });
        break;
      case "subgraph":
        defaultAttrs.enterSubDigraph();
        if (stmt.stmts) {
          stmt.stmts.forEach(function(s) { handleStmt(s); });
        }
        defaultAttrs.exitSubDigraph();
        break;
      case "attr":
        defaultAttrs.set(stmt.attrType, attrs);
        break;
      default:
        throw new Error("Unsupported statement type: " + stmt.type);
    }
  }

  if (parseTree.stmts) {
    parseTree.stmts.forEach(function(stmt) {
      handleStmt(stmt);
    });
  }

  return g;
}

// TODO: move this and the object reading stuff in layout.js to their own file.
exports.toObjects = function(str) {
  var g = exports.toDigraph(str);
  var nodes = g.nodes().map(function(u) { return g.node(u); });
  var edges = g.edges().map(function(e) {
    var edge = g.edge(e);
    edge.source = g.node(g.source(e));
    edge.target = g.node(g.target(e));
    return edge;
  });
  return { nodes: nodes, edges: edges };
};

},{"./dot-grammar":15,"./util":18,"graphlib":20}],18:[function(require,module,exports){
/*
 * Copies attributes from `src` to `dst`. If an attribute name is in both
 * `src` and `dst` then the attribute value from `src` takes precedence.
 */
exports.mergeAttributes = function(src, dst) {
  Object.keys(src).forEach(function(k) { dst[k] = src[k]; });
};

/*
 * Returns the smallest value in the array.
 */
exports.min = function(values) {
  return Math.min.apply(null, values);
};

/*
 * Returns the largest value in the array.
 */
exports.max = function(values) {
  return Math.max.apply(null, values);
};

/*
 * Returns `true` only if `f(x)` is `true` for all `x` in `xs`. Otherwise
 * returns `false`. This function will return immediately if it finds a
 * case where `f(x)` does not hold.
 */
exports.all = function(xs, f) {
  for (var i = 0; i < xs.length; ++i) {
    if (!f(xs[i])) {
      return false; 
    }
  }
  return true;
};

/*
 * Accumulates the sum of elements in the given array using the `+` operator.
 */
exports.sum = function(values) {
  return values.reduce(function(acc, x) { return acc + x; }, 0);
};

/*
 * Joins all of the given arrays into a single array.
 */
exports.concat = function(arrays) {
  return Array.prototype.concat.apply([], arrays);
};

/*
 * Returns an array of all values in the given object.
 */
exports.values = function(obj) {
  return Object.keys(obj).map(function(k) { return obj[k]; });
};

/*
 * Treats each input array as a set and returns the union of all of the arrays.
 * This function biases towards the last array. That is, if an "equivalent"
 * key appears in more than on array, the resulting array will contain the last
 * "equivalent" key.
 */
exports.union = function(arrays) {
  var obj = {};
  for (var i = 0; i < arrays.length; ++i) {
    var a = arrays[i];
    for (var j = 0; j < a.length; ++j) {
      var v = a[j];
      obj[v] = v;
    }
  }

  var results = [];
  for (var k in obj) {
    results.push(obj[k]);
  }

  return results;
};

exports.intersectRect = function(rect, point) {
  var x = rect.x;
  var y = rect.y;

  // For now we only support rectangles

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  var dx = point.x - x;
  var dy = point.y - y;
  var w = rect.width / 2;
  var h = rect.height / 2;

  var sx, sy;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = dy === 0 ? 0 : h * dx / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = dx === 0 ? 0 : w * dy / dx;
  }

  return {x: x + sx, y: y + sy};
};

exports.pointStr = function(point) {
  return point.x + "," + point.y;
};

exports.createTimer = function(enabled) {
  var self = {};

  // Default to disabled
  enabled = enabled || false;

  self.enabled = function(x) {
    if (!arguments.length) return enabled;
    enabled = x;
    return self;
  };

  self.wrap = function(name, func) {
    return function() {
      var start = enabled ? new Date().getTime() : null;
      try {
        return func.apply(null, arguments);
      } finally {
        if (start) console.log(name + " time: " + (new Date().getTime() - start) + "ms");
      }
    };
  };

  return self;
};

exports.propertyAccessor = function(self, config, field, setHook) {
  return function(x) {
    if (!arguments.length) return config[field];
    config[field] = x;
    if (setHook) setHook(x);
    return self;
  };
};

},{}],19:[function(require,module,exports){
module.exports = write;

/*
 * Writes a string representation of the given graph in the DOT language.
 *
 * Note: this is exported as the module export
 *
 * @param {Digraph} g the graph to serialize
 */
function write(g) {
  var edgeConnector = g.type == 'digraph' ? "->" : "--";
  var str = (g.type || 'digraph') + " {\n";

  g.nodes().forEach(function(u) {
    str += _writeNode(u, g.node(u));
  });

  g.eachEdge(function(id, source, target, value) {
    str += _writeEdge(id, edgeConnector, source, target, value);
  });

  str += "}\n";
  return str;
}

function id(obj) {
  return '"' + obj.toString().replace(/"/g, '\\"') + '"';
}

function idVal(obj) {
  if (Object.prototype.toString.call(obj) === "[object Object]" ||
      Object.prototype.toString.call(obj) === "[object Array]") {
    return id(JSON.stringify(obj));
  }
  return id(obj);
}

function _writeNode(u, attrs) {
  var _id = id(u);
  var str = "    " + id(u);
  var hasAttrs = false;
  for (var k in attrs) {
    
    if((k == 'label' || k == 'id') && id(attrs[k]) != _id) {
      if (!hasAttrs) {
        str += ' [';
        hasAttrs = true;
      } else {
        str += ',';
      }
      str += id(k) + "=" + idVal(attrs[k]);
    }
  }
  if (hasAttrs) {
    str += "]";
  }
  str += "\n";
  return str;
}

function _writeEdge(eId, edgeConnector, u, v, attrs) {
  var _id = id(eId);
  var str = "    " + id(u) + " " + edgeConnector + " " + id(v);
  var hasAttrs = false;
  for (var k in attrs) {
//TODO: don't output edge id if it's only the default id.
//not sure where the default id is created...
//      if((k == 'id') && id(attrs[k]) != _id) {
      if (!hasAttrs) {
        str += ' [';
        hasAttrs = true;
      } else {
        str += ',';
      }
      str += id(k) + "=" + idVal(attrs[k]);
//    }
  }
  if (hasAttrs) {
    str += "]";
  }
  str += "\n";
  return str;
}


},{}],20:[function(require,module,exports){
exports.Digraph = require("./lib/Digraph");
exports.alg = require("./lib/alg");
exports.version = require("./lib/version");

// Backwards compatibility - to remove at next minor version bump
exports.Graph = exports.Digraph

},{"./lib/Digraph":21,"./lib/alg":22,"./lib/version":26}],21:[function(require,module,exports){
/*!
 * This file is organized with in the following order:
 *
 * Exports
 * Graph constructors
 * Graph queries (e.g. nodes(), edges()
 * Graph mutators
 * Helper functions
 */

var util = require("./util");

module.exports = Digraph;

/*
 * Constructor to create a new directed multi-graph.
 */
function Digraph() {
  /*! Map of nodeId -> {id, value} */
  this._nodes = {};

  /*! Map of sourceId -> {targetId -> {count, edgeId -> true}} */
  this._inEdges = {};

  /*! Map of targetId -> {sourceId -> {count, edgeId -> true}} */
  this._outEdges = {};

  /*! Map of edgeId -> {id, source, target, value} */
  this._edges = {};

  /*! Used to generate anonymous edge ids */
  this._nextEdgeId = 0;
}

/*
 * Constructs and returns a new graph that includes only the nodes in `us`. Any
 * edges that have both their source and target in the set `us` are also
 * included in the subgraph.
 * 
 * Changes to the graph itself are not reflected in the original graph.
 * However, the values for nodes and edges are not copied. If the values are
 * objects then their changes will be reflected in the original graph and the
 * subgraph.
 *
 * If any of the nodes in `us` are not in this graph this function raises an
 * Error.
 *
 * @param {String[]} us the node ids to include in the subgraph
 */
Digraph.prototype.subgraph = function(us) {
  var g = new Digraph();
  var self = this;

  us.forEach(function(u) { g.addNode(u, self.node(u)); });
  util.values(this._edges).forEach(function(e) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.addEdge(e.id, e.source, e.target, self.edge(e.id));
    }
  });

  return g;
};

/*
 * Returns the number of nodes in this graph.
 */
Digraph.prototype.order = function() {
  return Object.keys(this._nodes).length;
};

/*
 * Returns the number of edges in this graph.
 */
Digraph.prototype.size = function() {
  return Object.keys(this._edges).length;
};

/*
 * Returns `true` if this graph contains a node with the id `u`. Otherwise
 * returns false.
 *
 * @param {String} u a node id
 */
Digraph.prototype.hasNode = function(u) {
  return u in this._nodes;
};

/*
 * Returns the value for a node in the graph with the id `u`. If no such node
 * is in the graph this function will throw an Error.
 *
 * @param {String} u a node id
 */
Digraph.prototype.node = function(u) {
  return this._strictGetNode(u).value;
};

/*
 * Returns the ids of all nodes in this graph. Use `graph.node(u)` to get the
 * value for a specific node.
 */
Digraph.prototype.nodes = function() {
  var nodes = [];
  this.eachNode(function(id, _) { nodes.push(id); });
  return nodes;
};

/*
 * Applies a function that takes the parameters (`id`, `value`) to each node in
 * the graph in arbitrary order.
 *
 * @param {Function} func the function to apply to each node
 */
Digraph.prototype.eachNode = function(func) {
  for (var k in this._nodes) {
    var node = this._nodes[k];
    func(node.id, node.value);
  }
};

/*
 * Returns all successors of the node with the id `u`. That is, all nodes
 * that have the node `u` as their source are returned.
 * 
 * If no node `u` exists in the graph this function throws an Error.
 *
 * @param {String} u a node id
 */
Digraph.prototype.successors = function(u) {
  this._strictGetNode(u);
  return Object.keys(this._outEdges[u])
               .map(function(v) { return this._nodes[v].id; }, this);
};

/*
 * Returns all predecessors of the node with the id `u`. That is, all nodes
 * that have the node `u` as their target are returned.
 * 
 * If no node `u` exists in the graph this function throws an Error.
 *
 * @param {String} u a node id
 */
Digraph.prototype.predecessors = function(u) {
  this._strictGetNode(u);
  return Object.keys(this._inEdges[u])
               .map(function(v) { return this._nodes[v].id; }, this);
};

/*
 * Returns all nodes that are adjacent to the node with the id `u`. In other
 * words, this function returns the set of all successors and predecessors of
 * node `u`.
 *
 * @param {String} u a node id
 */
Digraph.prototype.neighbors = function(u) {
  this._strictGetNode(u);
  var vs = {};

  Object.keys(this._outEdges[u])
        .map(function(v) { vs[v] = true; });

  Object.keys(this._inEdges[u])
        .map(function(v) { vs[v] = true; });

  return Object.keys(vs)
               .map(function(v) { return this._nodes[v].id; }, this);
};

/*
 * Returns all nodes in the graph that have no in-edges.
 */
Digraph.prototype.sources = function() {
  var self = this;
  return this._filterNodes(function(u) {
    // This could have better space characteristics if we had an inDegree function.
    return self.inEdges(u).length === 0;
  });
};

/*
 * Returns all nodes in the graph that have no out-edges.
 */
Digraph.prototype.sinks = function() {
  var self = this;
  return this._filterNodes(function(u) {
    // This could have better space characteristics if we have an outDegree function.
    return self.outEdges(u).length === 0;
  });
};

/*
 * Returns `true` if this graph has an edge with the id `e`. Otherwise this
 * function returns `false`.
 *
 * @param {String} e an edge id
 */
Digraph.prototype.hasEdge = function(e) {
  return e in this._edges;
};

/*
 * Returns the value for an edge with the id `e`. If no such edge exists in
 * the graph this function throws an Error.
 *
 * @param {String} e the edge id
 */
Digraph.prototype.edge = function(e) {
  return this._strictGetEdge(e).value;
};

/*
 * Return all edges with no arguments,
 * the ones that are incident on a node (one argument),
 * or all edges from a source to a target (two arguments)
 *
 * @param {String} [u] an optional node id
 * @param {String} [v] an optional node id
 */
Digraph.prototype.edges = function(u, v) {
  var es, sourceEdges;
  if (!arguments.length) {
    es = [];
    this.eachEdge(function(id) { es.push(id); });
    return es;
  } else if (arguments.length === 1) {
    return util.mergeKeys([this.inEdges(u), this.outEdges(u)]);
  } else if (arguments.length === 2) {
    this._strictGetNode(u);
    this._strictGetNode(v);
    sourceEdges = this._outEdges[u];
    es = (v in sourceEdges) ? Object.keys(sourceEdges[v].edges) : [];
    return es.map(function(e) { return this._edges[e].id; }, this);
  }
};

/*
 * Applies a function that takes the parameters (`id`, `source`, `target`,
 * `value`) to each edge in this graph in arbitrary order.
 *
 * @param {Function} func a function to apply to each edge
 */
Digraph.prototype.eachEdge = function(func) {
  for (var k in this._edges) {
    var edge = this._edges[k];
    func(edge.id, edge.source, edge.target, edge.value);
  }
};

/*
 * Returns the source node incident on the edge identified by the id `e`. If no
 * such edge exists in the graph this function throws an Error.
 *
 * @param {String} e an edge id
 */
Digraph.prototype.source = function(e) {
  return this._strictGetEdge(e).source;
};

/*
 * Returns the target node incident on the edge identified by the id `e`. If no
 * such edge exists in the graph this function throws an Error.
 *
 * @param {String} e an edge id
 */
Digraph.prototype.target = function(e) {
  return this._strictGetEdge(e).target;
};

/*
 * Returns the ids of all edges in the graph that have the node `target` as
 * their target. If the node `target` is not in the graph this function raises
 * an Error.
 *
 * @param {String} target the target node id
 */
Digraph.prototype.inEdges = function(target) {
  this._strictGetNode(target);
  return util.concat(util.values(this._inEdges[target])
             .map(function(es) { return Object.keys(es.edges); }, this));
};

/*
 * Returns the ids of all nodes in the graph that have the node `source` as
 * their source. If the node `source` is not in the graph this function raises
 * an Error.
 *
 * @param {String} source the source node id
 */
Digraph.prototype.outEdges = function(source) {
  this._strictGetNode(source);
  return util.concat(util.values(this._outEdges[source])
             .map(function(es) { return Object.keys(es.edges); }, this));
};

/*
 * Returns `true` if the values of all nodes and all edges are equal (===)
 *
 * @param {Digraph} other the graph to test for equality with this graph
 */
Digraph.prototype.equals = function(other) {
  var self = this;

  return self.order() === other.order() &&
         self.size() === other.size() &&
         util.all(self.nodes(), function(x) { return other.hasNode(x) && self.node(x) === other.node(x); }) &&
         util.all(self.edges(), function(x) { return other.hasEdge(x) && self.edge(x) === other.edge(x); });
};

/*
 * Returns a string representation of this graph.
 */
Digraph.prototype.toString = function() {
  var self = this;
  var str = "GRAPH:\n";

  str += "    Nodes:\n";
  Object.keys(this._nodes)
        .forEach(function(u) {
          str += "        " + u + ": " + JSON.stringify(self._nodes[u].value) + "\n";
        });

  str += "    Edges:\n";
  Object.keys(this._edges)
        .forEach(function(e) {
          var edge = self._edges[e];
          str += "        " + e + " (" + edge.source + " -> " + edge.target + "): " +
                 JSON.stringify(self._edges[e].value) + "\n";
        });

  return str;
};

/*
 * Adds a new node with the id `u` to the graph and assigns it the value
 * `value`. If a node with the id is already a part of the graph this function
 * throws an Error.
 *
 * @param {String} u a node id
 * @param {Object} [value] an optional value to attach to the node
 */
Digraph.prototype.addNode = function(u, value) {
  if (this.hasNode(u)) {
    throw new Error("Graph already has node '" + u + "':\n" + this.toString());
  }
  this._nodes[u] = { id: u, value: value };
  this._inEdges[u] = {};
  this._outEdges[u] = {};
};

/*
 * Removes a node from the graph that has the id `u`. Any edges incident on the
 * node are also removed. If the graph does not contain a node with the id this
 * function will throw an Error.
 *
 * @param {String} u a node id
 */
Digraph.prototype.delNode = function(u) {
  this._strictGetNode(u);

  var self = this;
  this.edges(u).forEach(function(e) { self.delEdge(e); });

  delete this._inEdges[u];
  delete this._outEdges[u];
  delete this._nodes[u];
};

/*
 * Adds a new edge to the graph with the id `e` from a node with the id `source`
 * to a noce with an id `target` and assigns it the value `value`. This graph
 * allows more than one edge from `source` to `target` as long as the id `e`
 * is unique in the set of edges. If `e` is `null` the graph will assign a
 * unique identifier to the edge.
 *
 * If `source` or `target` are not present in the graph this function will
 * throw an Error.
 *
 * @param {String} [e] an edge id
 * @param {String} source the source node id
 * @param {String} target the target node id
 * @param {Object} [value] an optional value to attach to the edge
 */
Digraph.prototype.addEdge = function(e, source, target, value) {
  this._strictGetNode(source);
  this._strictGetNode(target);

  if (e === null) {
    e = "_ANON-" + (++this._nextEdgeId);
  }
  else if (this.hasEdge(e)) {
    throw new Error("Graph already has edge '" + e + "':\n" + this.toString());
  }

  this._edges[e] = { id: e, source: source, target: target, value: value };
  addEdgeToMap(this._inEdges[target], source, e);
  addEdgeToMap(this._outEdges[source], target, e);
};

/*
 * Removes an edge in the graph with the id `e`. If no edge in the graph has
 * the id `e` this function will throw an Error.
 *
 * @param {String} e an edge id
 */
Digraph.prototype.delEdge = function(e) {
  var edge = this._strictGetEdge(e);
  delEdgeFromMap(this._inEdges[edge.target], edge.source, e);
  delEdgeFromMap(this._outEdges[edge.source], edge.target, e);
  delete this._edges[e];
};

Digraph.prototype._strictGetNode = function(u) {
  var node = this._nodes[u];
  if (node === undefined) {
    throw new Error("Node '" + u + "' is not in graph:\n" + this.toString());
  }
  return node;
};

Digraph.prototype._strictGetEdge = function(e) {
  var edge = this._edges[e];
  if (edge === undefined) {
    throw new Error("Edge '" + e + "' is not in graph:\n" + this.toString());
  }
  return edge;
};

Digraph.prototype._filterNodes = function(pred) {
  var filtered = [];
  this.eachNode(function(u, value) {
    if (pred(u)) {
      filtered.push(u);
    }
  });
  return filtered;
};

function addEdgeToMap(map, v, e) {
  var vEntry = map[v];
  if (!vEntry) {
    vEntry = map[v] = { count: 0, edges: {} };
  }
  vEntry.count++;
  vEntry.edges[e] = true;
}

function delEdgeFromMap(map, v, e) {
  var vEntry = map[v];
  if (--vEntry.count === 0) {
    delete map[v];
  } else {
    delete vEntry.edges[e];
  }
}


},{"./util":25}],22:[function(require,module,exports){
module.exports = {
  isAcyclic: require("./alg/isAcyclic"),
  topsort: require("./alg/topsort")
};

},{"./alg/isAcyclic":23,"./alg/topsort":24}],23:[function(require,module,exports){
var topsort = require("./topsort");

module.exports = isAcyclic;

/*
 * Given a Graph **g** this function returns `true` if the graph has no cycles
 * and returns `false` if it does.
 *
 * @param {Graph} g the graph to test for cycles
 */
function isAcyclic(g) {
  try {
    topsort(g);
  } catch (e) {
    if (e instanceof topsort.CycleException) return false;
    throw e;
  }
  return true;
}

},{"./topsort":24}],24:[function(require,module,exports){
module.exports = topsort;
topsort.CycleException = CycleException;

/*
 * Given a graph **g**, this function returns an ordered list of nodes such
 * that for each edge `u -> v`, `u` appears before `v` in the list. If the
 * graph has a cycle it is impossible to generate such a list and
 * **CycleException** is thrown.
 *
 * See [topological sorting](https://en.wikipedia.org/wiki/Topological_sorting)
 * for more details about how this algorithm works.
 *
 * @param {Graph} g the graph to sort
 */
function topsort(g) {
  var visited = {};
  var stack = {};
  var results = [];

  function visit(node) {
    if (node in stack) {
      throw new CycleException();
    }

    if (!(node in visited)) {
      stack[node] = true;
      visited[node] = true;
      g.predecessors(node).forEach(function(pred) {
        visit(pred);
      });
      delete stack[node];
      results.push(node);
    }
  }

  var sinks = g.sinks();
  if (g.order() !== 0 && sinks.length === 0) {
    throw new CycleException();
  }

  g.sinks().forEach(function(sink) {
    visit(sink);
  });

  return results;
}

function CycleException() {}

CycleException.prototype.toString = function() {
  return "Graph has at least one cycle";
};

},{}],25:[function(require,module,exports){
// Returns `true` only if `f(x)` is `true` for all `x` in **xs**. Otherwise
// returns `false`. This function will return immediately if it finds a
// case where `f(x)` does not hold.
exports.all = function(xs, f) {
  for (var i = 0; i < xs.length; ++i) {
    if (!f(xs[i])) return false;
  }
  return true;
}

// Returns an array of all values for properties of **o**.
exports.values = function(o) {
  return Object.keys(o).map(function(k) { return o[k]; });
}

// Joins all of the arrays **xs** into a single array.
exports.concat = function(xs) {
  return Array.prototype.concat.apply([], xs);
}

// Similar to **concat**, but all duplicates are removed
exports.mergeKeys = function(xs) {
  var obj = {};
  xs.forEach(function(x) {
    x.forEach(function(o) {
      obj[o] = o;
    });
  });
  return exports.values(obj);
}

},{}],26:[function(require,module,exports){
module.exports = '0.0.3';

},{}],27:[function(require,module,exports){
exports.Digraph = require("./lib/Digraph");
exports.alg = {
  isAcyclic: require("./lib/alg/isAcyclic"),
  findCycles: require("./lib/alg/findCycles"),
  tarjan: require("./lib/alg/tarjan"),
  topsort: require("./lib/alg/topsort")
};
exports.data = {
  PriorityQueue: require("./lib/data/PriorityQueue")
};
exports.version = require("./lib/version");

},{"./lib/Digraph":28,"./lib/alg/findCycles":29,"./lib/alg/isAcyclic":30,"./lib/alg/tarjan":31,"./lib/alg/topsort":32,"./lib/data/PriorityQueue":33,"./lib/version":35}],28:[function(require,module,exports){
/*!
 * This file is organized with in the following order:
 *
 * Exports
 * Graph constructors
 * Graph queries (e.g. nodes(), edges()
 * Graph mutators
 * Helper functions
 */

var util = require("./util");

module.exports = Digraph;

/*
 * Constructor to create a new directed multi-graph.
 */
function Digraph() {
  /*! The value assigned to the graph itself */
  this._value = undefined;

  /*! Map of nodeId -> {id, value} */
  this._nodes = {};

  /*! Map of sourceId -> {targetId -> {count, edgeId -> true}} */
  this._inEdges = {};

  /*! Map of targetId -> {sourceId -> {count, edgeId -> true}} */
  this._outEdges = {};

  /*! Map of edgeId -> {id, source, target, value} */
  this._edges = {};

  /*! Used to generate anonymous edge ids */
  this._nextEdgeId = 0;
}

/*
 * Constructs and returns a new graph that includes only the nodes in `us`. Any
 * edges that have both their source and target in the set `us` are also
 * included in the subgraph.
 * 
 * Changes to the graph itself are not reflected in the original graph.
 * However, the values for nodes and edges are not copied. If the values are
 * objects then their changes will be reflected in the original graph and the
 * subgraph.
 *
 * If any of the nodes in `us` are not in this graph this function raises an
 * Error.
 *
 * @param {String[]} us the node ids to include in the subgraph
 */
Digraph.prototype.subgraph = function(us) {
  var g = new Digraph();
  var self = this;

  us.forEach(function(u) { g.addNode(u, self.node(u)); });
  util.values(this._edges).forEach(function(e) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.addEdge(e.id, e.source, e.target, self.edge(e.id));
    }
  });

  return g;
};

/*
 * Returns the number of nodes in this graph.
 */
Digraph.prototype.order = function() {
  return Object.keys(this._nodes).length;
};

/*
 * Returns the number of edges in this graph.
 */
Digraph.prototype.size = function() {
  return Object.keys(this._edges).length;
};

/*
 * Accessor for a graph-level value. If called with no arguments this function
 * returns the graph value object. If called with the **value** argument this
 * function sets the value for the graph, replacing the previous value.
 *
 * @param {Object} [value] optional value to set for this graph.
 */
Digraph.prototype.graph = function(value) {
  if (arguments.length === 0) {
    return this._value;
  }
  this._value = value;
};

/*
 * Returns `true` if this graph contains a node with the id `u`. Otherwise
 * returns false.
 *
 * @param {String} u a node id
 */
Digraph.prototype.hasNode = function(u) {
  return u in this._nodes;
};

/*
 * Accessor for node values. If called with a single argument this function
 * returns the value for the node **u**. If called with two arguments, this
 * function assigns **value** as the value for node **u**.
 *
 * If no such node is in the graph this function will throw an Error.
 *
 * @param {String} u a node id
 * @param {Object} [value] option value to set for this node
 */
Digraph.prototype.node = function(u, value) {
  var node = this._strictGetNode(u);
  if (arguments.length === 1) {
    return node.value;
  }
  node.value = value;
};

/*
 * Returns the ids of all nodes in this graph. Use `graph.node(u)` to get the
 * value for a specific node.
 */
Digraph.prototype.nodes = function() {
  var nodes = [];
  this.eachNode(function(id, _) { nodes.push(id); });
  return nodes;
};

/*
 * Applies a function that takes the parameters (`id`, `value`) to each node in
 * the graph in arbitrary order.
 *
 * @param {Function} func the function to apply to each node
 */
Digraph.prototype.eachNode = function(func) {
  for (var k in this._nodes) {
    var node = this._nodes[k];
    func(node.id, node.value);
  }
};

/*
 * Returns all successors of the node with the id `u`. That is, all nodes
 * that have the node `u` as their source are returned.
 * 
 * If no node `u` exists in the graph this function throws an Error.
 *
 * @param {String} u a node id
 */
Digraph.prototype.successors = function(u) {
  this._strictGetNode(u);
  return Object.keys(this._outEdges[u])
               .map(function(v) { return this._nodes[v].id; }, this);
};

/*
 * Returns all predecessors of the node with the id `u`. That is, all nodes
 * that have the node `u` as their target are returned.
 * 
 * If no node `u` exists in the graph this function throws an Error.
 *
 * @param {String} u a node id
 */
Digraph.prototype.predecessors = function(u) {
  this._strictGetNode(u);
  return Object.keys(this._inEdges[u])
               .map(function(v) { return this._nodes[v].id; }, this);
};

/*
 * Returns all nodes that are adjacent to the node with the id `u`. In other
 * words, this function returns the set of all successors and predecessors of
 * node `u`.
 *
 * @param {String} u a node id
 */
Digraph.prototype.neighbors = function(u) {
  this._strictGetNode(u);
  var vs = {};

  Object.keys(this._outEdges[u])
        .map(function(v) { vs[v] = true; });

  Object.keys(this._inEdges[u])
        .map(function(v) { vs[v] = true; });

  return Object.keys(vs)
               .map(function(v) { return this._nodes[v].id; }, this);
};

/*
 * Returns all nodes in the graph that have no in-edges.
 */
Digraph.prototype.sources = function() {
  var self = this;
  return this._filterNodes(function(u) {
    // This could have better space characteristics if we had an inDegree function.
    return self.inEdges(u).length === 0;
  });
};

/*
 * Returns all nodes in the graph that have no out-edges.
 */
Digraph.prototype.sinks = function() {
  var self = this;
  return this._filterNodes(function(u) {
    // This could have better space characteristics if we have an outDegree function.
    return self.outEdges(u).length === 0;
  });
};

/*
 * Returns `true` if this graph has an edge with the id `e`. Otherwise this
 * function returns `false`.
 *
 * @param {String} e an edge id
 */
Digraph.prototype.hasEdge = function(e) {
  return e in this._edges;
};

/*
 * Accessor for edge values. If called with a single argument this function
 * returns the value for the edge **e**. If called with two arguments, this
 * function assigns **value** as the value for edge **e**.
 *
 * If no such edge is in the graph this function will throw an Error.
 *
 * @param {String} e an edge id
 * @param {Object} [value] option value to set for this node
 */
Digraph.prototype.edge = function(e, value) {
  var edge = this._strictGetEdge(e);
  if (arguments.length === 1) {
    return edge.value;
  }
  edge.value = value;
};

/*
 * Returns the ids of all edges in the graph.
 */
Digraph.prototype.edges = function(u) {
  if (arguments.length === 1) {
    throw new Error("Digraph.edges() cannot be called with 1 argument. " +
                    "Use Digraph.incidentEdges() instead.");
  } else if (arguments.length > 1) {
    throw new Error("Digraph.edges() cannot be called with more than 1 argument. " +
                    "Use Digraph.outEdges() instead.");
  }

  var es = [];
  this.eachEdge(function(id) { es.push(id); });
  return es;
};

/*
 * Applies a function that takes the parameters (`id`, `source`, `target`,
 * `value`) to each edge in this graph in arbitrary order.
 *
 * @param {Function} func a function to apply to each edge
 */
Digraph.prototype.eachEdge = function(func) {
  for (var k in this._edges) {
    var edge = this._edges[k];
    func(edge.id, edge.source, edge.target, edge.value);
  }
};

/*
 * Returns the source node incident on the edge identified by the id `e`. If no
 * such edge exists in the graph this function throws an Error.
 *
 * @param {String} e an edge id
 */
Digraph.prototype.source = function(e) {
  return this._strictGetEdge(e).source;
};

/*
 * Returns the target node incident on the edge identified by the id `e`. If no
 * such edge exists in the graph this function throws an Error.
 *
 * @param {String} e an edge id
 */
Digraph.prototype.target = function(e) {
  return this._strictGetEdge(e).target;
};

/*
 * Returns an array of ids for all edges in the graph that have the node
 * `target` as their target. If the node `target` is not in the graph this
 * function raises an Error.
 *
 * Optionally a `source` node can also be specified. This causes the results
 * to be filtered such that only edges from `source` to `target` are included.
 * If the node `source` is specified but is not in the graph then this function
 * raises an Error.
 *
 * @param {String} target the target node id
 * @param {String} [source] an optional source node id
 */
Digraph.prototype.inEdges = function(target, source) {
  this._strictGetNode(target);
  var results = util.concat(util.values(this._inEdges[target])
                    .map(function(es) { return Object.keys(es.edges); }, this));
  if (arguments.length > 1) {
    this._strictGetNode(source);
    results = results.filter(function(e) { return this.source(e) === source; }, this);
  }
  return results;
};

/*
 * Returns an array of ids for all edges in the graph that have the node
 * `source` as their source. If the node `source` is not in the graph this
 * function raises an Error.
 *
 * Optionally a `target` node may also be specified. This causes the results
 * to be filtered such that only edges from `source` to `target` are included.
 * If the node `target` is specified but is not in the graph then this function
 * raises an Error.
 *
 * @param {String} source the source node id
 * @param {String} [target] an optional target node id
 */
Digraph.prototype.outEdges = function(source, target) {
  this._strictGetNode(source);
  var results =  util.concat(util.values(this._outEdges[source])
                     .map(function(es) { return Object.keys(es.edges); }, this));
  if (arguments.length > 1) {
    this._strictGetNode(target);
    results = results.filter(function(e) { return this.target(e) === target; }, this);
  }
  return results;
};

/*
 * Returns an array of ids for all edges in the graph that have the `u` as
 * their source or their target. If the node `u` is not in the graph this
 * function raises an Error.
 *
 * Optionally a `v` node may also be specified. This causes the results to be
 * filtered such that only edges between `u` and `v` - in either direction -
 * are included. IF the node `v` is specified but not in the graph then this
 * function raises an Error.
 *
 * @param {String} u the node for which to find incident edges
 * @param {String} [v] option node that must be adjacent to `u`
 */
Digraph.prototype.incidentEdges = function(u, v) {
  if (arguments.length > 1) {
    return util.mergeKeys([this.outEdges(u, v), this.outEdges(v, u)]);
  } else {
    return util.mergeKeys([this.inEdges(u), this.outEdges(u)]);
  }
};

/*
 * Returns `true` if the values of all nodes and all edges are equal (===)
 *
 * @param {Digraph} other the graph to test for equality with this graph
 */
Digraph.prototype.equals = function(other) {
  var self = this;

  return self.order() === other.order() &&
         self.size() === other.size() &&
         util.all(self.nodes(), function(x) { return other.hasNode(x) && self.node(x) === other.node(x); }) &&
         util.all(self.edges(), function(x) { return other.hasEdge(x) && self.edge(x) === other.edge(x); });
};

/*
 * Returns a string representation of this graph.
 */
Digraph.prototype.toString = function() {
  var self = this;
  var str = "GRAPH: " + JSON.stringify(self._value) + "\n";
  str += "    Nodes:\n";
  Object.keys(this._nodes)
        .forEach(function(u) {
          str += "        " + u + ": " + JSON.stringify(self._nodes[u].value) + "\n";
        });

  str += "    Edges:\n";
  Object.keys(this._edges)
        .forEach(function(e) {
          var edge = self._edges[e];
          str += "        " + e + " (" + edge.source + " -> " + edge.target + "): " +
                 JSON.stringify(self._edges[e].value) + "\n";
        });

  return str;
};

/*
 * Adds a new node with the id `u` to the graph and assigns it the value
 * `value`. If a node with the id is already a part of the graph this function
 * throws an Error.
 *
 * @param {String} u a node id
 * @param {Object} [value] an optional value to attach to the node
 */
Digraph.prototype.addNode = function(u, value) {
  if (this.hasNode(u)) {
    throw new Error("Graph already has node '" + u + "':\n" + this.toString());
  }
  this._nodes[u] = { id: u, value: value };
  this._inEdges[u] = {};
  this._outEdges[u] = {};
};

/*
 * Removes a node from the graph that has the id `u`. Any edges incident on the
 * node are also removed. If the graph does not contain a node with the id this
 * function will throw an Error.
 *
 * @param {String} u a node id
 */
Digraph.prototype.delNode = function(u) {
  this._strictGetNode(u);

  var self = this;
  this.incidentEdges(u).forEach(function(e) { self.delEdge(e); });

  delete this._inEdges[u];
  delete this._outEdges[u];
  delete this._nodes[u];
};

/*
 * Adds a new edge to the graph with the id `e` from a node with the id `source`
 * to a noce with an id `target` and assigns it the value `value`. This graph
 * allows more than one edge from `source` to `target` as long as the id `e`
 * is unique in the set of edges. If `e` is `null` the graph will assign a
 * unique identifier to the edge.
 *
 * If `source` or `target` are not present in the graph this function will
 * throw an Error.
 *
 * @param {String} [e] an edge id
 * @param {String} source the source node id
 * @param {String} target the target node id
 * @param {Object} [value] an optional value to attach to the edge
 */
Digraph.prototype.addEdge = function(e, source, target, value) {
  this._strictGetNode(source);
  this._strictGetNode(target);

  if (e === null) {
    e = "_ANON-" + (++this._nextEdgeId);
  }
  else if (this.hasEdge(e)) {
    throw new Error("Graph already has edge '" + e + "':\n" + this.toString());
  }

  this._edges[e] = { id: e, source: source, target: target, value: value };
  addEdgeToMap(this._inEdges[target], source, e);
  addEdgeToMap(this._outEdges[source], target, e);
};

/*
 * Removes an edge in the graph with the id `e`. If no edge in the graph has
 * the id `e` this function will throw an Error.
 *
 * @param {String} e an edge id
 */
Digraph.prototype.delEdge = function(e) {
  var edge = this._strictGetEdge(e);
  delEdgeFromMap(this._inEdges[edge.target], edge.source, e);
  delEdgeFromMap(this._outEdges[edge.source], edge.target, e);
  delete this._edges[e];
};

Digraph.prototype._strictGetNode = function(u) {
  var node = this._nodes[u];
  if (node === undefined) {
    throw new Error("Node '" + u + "' is not in graph:\n" + this.toString());
  }
  return node;
};

Digraph.prototype._strictGetEdge = function(e) {
  var edge = this._edges[e];
  if (edge === undefined) {
    throw new Error("Edge '" + e + "' is not in graph:\n" + this.toString());
  }
  return edge;
};

Digraph.prototype._filterNodes = function(pred) {
  var filtered = [];
  this.eachNode(function(u, value) {
    if (pred(u)) {
      filtered.push(u);
    }
  });
  return filtered;
};

function addEdgeToMap(map, v, e) {
  var vEntry = map[v];
  if (!vEntry) {
    vEntry = map[v] = { count: 0, edges: {} };
  }
  vEntry.count++;
  vEntry.edges[e] = true;
}

function delEdgeFromMap(map, v, e) {
  var vEntry = map[v];
  if (--vEntry.count === 0) {
    delete map[v];
  } else {
    delete vEntry.edges[e];
  }
}


},{"./util":34}],29:[function(require,module,exports){
var tarjan = require("./tarjan");

module.exports = findCycles;

/*
 * Given a Digraph **g** this function returns all nodes that are part of a
 * cycle. Since there may be more than one cycle in a graph this function
 * returns an array of these cycles, where each cycle is itself represented
 * by an array of ids for each node involved in that cycle.
 *
 * [alg.isAcyclic][] is more efficient if you only need to determine whether
 * a graph has a cycle or not.
 *
 * [alg.isAcyclic]: isAcyclic.js.html#isAcyclic
 *
 * @param {Digraph} g the graph to search for cycles.
 */
function findCycles(g) {
  return tarjan(g).filter(function(cmpt) { return cmpt.length > 1; });
}

},{"./tarjan":31}],30:[function(require,module,exports){
var topsort = require("./topsort");

module.exports = isAcyclic;

/*
 * Given a Digraph **g** this function returns `true` if the graph has no
 * cycles and returns `false` if it does. This algorithm returns as soon as it
 * detects the first cycle.
 *
 * Use [alg.findCycles][] if you need the actual list of cycles in a graph.
 *
 * [alg.findCycles]: findCycles.js.html#findCycles
 *
 * @param {Digraph} g the graph to test for cycles
 */
function isAcyclic(g) {
  try {
    topsort(g);
  } catch (e) {
    if (e instanceof topsort.CycleException) return false;
    throw e;
  }
  return true;
}

},{"./topsort":32}],31:[function(require,module,exports){
module.exports = tarjan;

/*
 * This function is an implementation of [Tarjan's algorithm][] which finds
 * all [strongly connected components][] in the directed graph **g**. Each
 * strongly connected component is composed of nodes that can reach all other
 * nodes in the component via directed edges. A strongly connected component
 * can consist of a single node if that node cannot both reach and be reached
 * by any other specific node in the graph. Components of more than one node
 * are guaranteed to have at least one cycle.
 *
 * This function returns an array of components. Each component is itself an
 * array that contains the ids of all nodes in the component.
 *
 * @param {Digraph} g the graph to search for strongly connected components
 *
 * [Tarjan's algorithm]: http://en.wikipedia.org/wiki/Tarjan's_strongly_connected_components_algorithm
 * [strongly connected components]: http://en.wikipedia.org/wiki/Strongly_connected_component
 */
function tarjan(g) {
  var index = 0,
      stack = [],
      visited = {}; // node id -> { onStack, lowlink, index }
      results = [];

  function dfs(u) {
    var entry = visited[u] = {
      onStack: true,
      lowlink: index,
      index: index++
    };
    stack.push(u);

    g.successors(u).forEach(function(v) {
      if (!(v in visited)) {
        dfs(v);
        entry.lowlink = Math.min(entry.lowlink, visited[v].lowlink);
      } else if (visited[v].onStack) {
        entry.lowlink = Math.min(entry.lowlink, visited[v].index);
      }
    });

    if (entry.lowlink === entry.index) {
      var cmpt = [],
          v;
      do {
        v = stack.pop();
        visited[v].onStack = false;
        cmpt.push(v);
      } while (u !== v);
      results.push(cmpt);
    }
  }

  g.nodes().forEach(function(u) {
    if (!(u in visited)) {
      dfs(u);
    }
  });

  return results;
}

},{}],32:[function(require,module,exports){
module.exports = topsort;
topsort.CycleException = CycleException;

/*
 * Given a graph **g**, this function returns an ordered list of nodes such
 * that for each edge `u -> v`, `u` appears before `v` in the list. If the
 * graph has a cycle it is impossible to generate such a list and
 * **CycleException** is thrown.
 *
 * See [topological sorting](https://en.wikipedia.org/wiki/Topological_sorting)
 * for more details about how this algorithm works.
 *
 * @param {Digraph} g the graph to sort
 */
function topsort(g) {
  var visited = {};
  var stack = {};
  var results = [];

  function visit(node) {
    if (node in stack) {
      throw new CycleException();
    }

    if (!(node in visited)) {
      stack[node] = true;
      visited[node] = true;
      g.predecessors(node).forEach(function(pred) {
        visit(pred);
      });
      delete stack[node];
      results.push(node);
    }
  }

  var sinks = g.sinks();
  if (g.order() !== 0 && sinks.length === 0) {
    throw new CycleException();
  }

  g.sinks().forEach(function(sink) {
    visit(sink);
  });

  return results;
}

function CycleException() {}

CycleException.prototype.toString = function() {
  return "Graph has at least one cycle";
};

},{}],33:[function(require,module,exports){
module.exports = PriorityQueue;

/**
 * A min-priority queue data structure. This algorithm is derived from Cormen,
 * et al., "Introduction to Algorithms". The basic idea of a min-priority
 * queue is that you can efficiently (in O(1) time) get the smallest key in
 * the queue. Adding and removing elements takes O(log n) time. A key can
 * have its priority decreased in O(log n) time.
 */
function PriorityQueue() {
  this._arr = [];
  this._keyIndices = {};
}

/**
 * Returns the number of elements in the queue. Takes `O(1)` time.
 */
PriorityQueue.prototype.size = function() {
  return this._arr.length;
};

/**
 * Returns the keys that are in the queue. Takes `O(n)` time.
 */
PriorityQueue.prototype.keys = function() {
  return this._arr.map(function(x) { return x.key; });
};

/**
 * Returns `true` if **key** is in the queue and `false` if not.
 */
PriorityQueue.prototype.has = function(key) {
  return key in this._keyIndices;
};

/**
 * Returns the priority for **key**. If **key** is not present in the queue
 * then this function returns `undefined`. Takes `O(1)` time.
 *
 * @param {Object} key
 */
PriorityQueue.prototype.priority = function(key) {
  var index = this._keyIndices[key];
  if (index !== undefined) {
    return this._arr[index].priority;
  }
};

/**
 * Returns the key for the minimum element in this queue. If the queue is
 * empty this function throws an Error. Takes `O(1)` time.
 */
PriorityQueue.prototype.min = function(key) {
  if (this.size() === 0) {
    throw new Error("Queue underflow");
  }
  return this._arr[0].key;
};

/**
 * Inserts a new key into the priority queue. If the key already exists in
 * the queue this function returns `false`; otherwise it will return `true`.
 * Takes `O(n)` time.
 *
 * @param {Object} key the key to add
 * @param {Number} priority the initial priority for the key
 */
PriorityQueue.prototype.add = function(key, priority) {
  if (!(key in this._keyIndices)) {
    var entry = {key: key, priority: priority};
    var index = this._arr.length;
    this._keyIndices[key] = index;
    this._arr.push(entry);
    this._decrease(index);
    return true;
  }
  return false;
};

/**
 * Removes and returns the smallest key in the queue. Takes `O(log n)` time.
 */
PriorityQueue.prototype.removeMin = function() {
  this._swap(0, this._arr.length - 1);
  var min = this._arr.pop();
  delete this._keyIndices[min.key];
  this._heapify(0);
  return min.key;
};

/**
 * Decreases the priority for **key** to **priority**. If the new priority is
 * greater than the previous priority, this function will throw an Error.
 *
 * @param {Object} key the key for which to raise priority
 * @param {Number} priority the new priority for the key
 */
PriorityQueue.prototype.decrease = function(key, priority) {
  var index = this._keyIndices[key];
  if (priority > this._arr[index].priority) {
    throw new Error("New priority is greater than current priority. " +
        "Key: " + key + " Old: " + this._arr[index].priority + " New: " + priority);
  }
  this._arr[index].priority = priority;
  this._decrease(index);
};

PriorityQueue.prototype._heapify = function(i) {
  var arr = this._arr;
  var l = 2 * i,
      r = l + 1,
      largest = i;
  if (l < arr.length) {
    largest = arr[l].priority < arr[largest].priority ? l : largest;
    if (r < arr.length) {
      largest = arr[r].priority < arr[largest].priority ? r : largest;
    }
    if (largest !== i) {
      this._swap(i, largest);
      this._heapify(largest);
    }
  }
};

PriorityQueue.prototype._decrease = function(index) {
  var arr = this._arr;
  var priority = arr[index].priority;
  var parent;
  while (index > 0) {
    parent = index >> 1;
    if (arr[parent].priority < priority) {
      break;
    }
    this._swap(index, parent);
    index = parent;
  }
};

PriorityQueue.prototype._swap = function(i, j) {
  var arr = this._arr;
  var keyIndices = this._keyIndices;
  var tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
  keyIndices[arr[i].key] = i;
  keyIndices[arr[j].key] = j;
};

},{}],34:[function(require,module,exports){
// Returns `true` only if `f(x)` is `true` for all `x` in **xs**. Otherwise
// returns `false`. This function will return immediately if it finds a
// case where `f(x)` does not hold.
exports.all = function(xs, f) {
  for (var i = 0; i < xs.length; ++i) {
    if (!f(xs[i])) return false;
  }
  return true;
}

// Returns an array of all values for properties of **o**.
exports.values = function(o) {
  return Object.keys(o).map(function(k) { return o[k]; });
}

// Joins all of the arrays **xs** into a single array.
exports.concat = function(xs) {
  return Array.prototype.concat.apply([], xs);
}

// Similar to **concat**, but all duplicates are removed
exports.mergeKeys = function(xs) {
  var obj = {};
  xs.forEach(function(x) {
    x.forEach(function(o) {
      obj[o] = o;
    });
  });
  return exports.values(obj);
}

},{}],35:[function(require,module,exports){
module.exports = '0.1.0';

},{}]},{},[1])
;
joint.layout.DirectedGraph = {

    layout: function(graph, opt) {

        opt = opt || {};

        var data = this._prepareData(graph);
        var runner = dagre.layout().nodes(data.nodeData).edges(data.edgeData);

        if (opt.debugLevel) { runner.debugLevel(opt.debugLevel); }
        if (opt.rankDir) { runner.rankDir(opt.rankDir); }
        if (opt.rankSep) { runner.rankSep(opt.rankSep); }
        if (opt.edgeSep) { runner.edgeSep(opt.edgeSep); }
        if (opt.nodeSep) { runner.nodeSep(opt.nodeSep); }

        runner.run();
        
        _.each(data.nodeData, function(node) {

            graph.get('cells').get(node.id).set('position', { x: node.dagre.x, y: node.dagre.y });
        });

        if (opt.setLinkVertices) {

            _.each(data.edgeData, function(edge) {

                graph.get('cells').get(edge.id).set('vertices', edge.dagre.points);
            });
        }
    },
    
    _prepareData: function() {

        var nodeData = [];
        var edgeData = [];

        var nodeDataHash = {};
        var edgeDataHash = {};

        // For each element.
        graph.get('cells').each(function(cell) {

            if (!(cell instanceof joint.dia.Element)) return;

            if (!nodeDataHash[cell.id]) {
                
                var node = {
                    id: cell.id,
                    inEdges: [],
                    outEdges: [],
                    width: cell.get('size').width,
                    height: cell.get('size').height
                };
                nodeData.push(node);
                nodeDataHash[cell.id] = node;
            }
        });

        // For each link.
        graph.get('cells').each(function(cell) {

            if (!(cell instanceof joint.dia.Link)) return;
            
            var sourceId = cell.get('source').id;
            var targetId = cell.get('target').id;

            var source = nodeDataHash[sourceId];
            var target = nodeDataHash[targetId];

            var edge;
            if (edgeDataHash[cell.id]) {

                edge = edgeDataHash[cell.id];
                
            } else {

                edge = { id: cell.id, source: source, target: target, label: 'fooedge' };
                edgeDataHash[cell.id] = edge;
                edgeData.push(edge);
            }
            
            if (!_.contains(source.outEdges, edge)) source.outEdges.push(edge);
            if (!_.contains(target.inEdges, edge)) target.inEdges.push(edge);
        });

        return {
            nodeData: nodeData,
            edgeData: edgeData
        };
    }
};