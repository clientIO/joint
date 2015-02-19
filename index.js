// These are all the exports for the NodeJS environment.
// The idea is that JointJS can be used exactly the same way in the browser and also in Node.

var Backbone = require('backbone');
Backbone.$ = require('./lib/jquery');

module.exports = {
  util:       {},
  shapes:     {},
  connectors: {},
  alg:        {},
  dia:    {
    Cell:     {},
    CellView: {},
    Graph:    {},
    Link:     {},
    Element:  {},
    Paper:    {}
  }
};
var jointjs = require('jointjs');
jointjs.util            = require('./src/core').util;
jointjs.dia.Cell        = require('./src/joint.dia.cell').Cell;
jointjs.dia.CellView    = require('./src/joint.dia.cell').CellView;
jointjs.dia.Graph       = require('./src/joint.dia.graph').Graph;
jointjs.dia.Link        = require('./src/joint.dia.link').Link;
jointjs.dia.Element     = require('./src/joint.dia.element').Element;
jointjs.dia.ElementView = require('./src/joint.dia.element').ElementView;
jointjs.dia.Paper       = require('./src/joint.dia.paper').Paper;
jointjs.shapes          = require('./plugins/shapes');

jointjs.connectors.smooth   = require('./plugins/connectors/joint.connectors.smooth');
jointjs.connectors.rounded  = require('./plugins/connectors/joint.connectors.rounded');
jointjs.connectors.normal   = require('./plugins/connectors/joint.connectors.normal');

jointjs.geometry            = require('./src/geometry');
jointjs.vectorizer          = require('./src/vectorizer').Vectorizer;
