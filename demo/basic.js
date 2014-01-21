var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph
});

var rb = new joint.shapes.basic.Rect({
    position: { x: 50, y: 50 },
    size: { width: 100, height: 40 },
    attrs: { text: { text: 'basic.Rect' } }
});
graph.addCell(rb);

var tb = new joint.shapes.basic.Text({
    position: { x: 170, y: 50 },
    size: { width: 100, height: 30 },
    attrs: { text: { text: 'basic.Text' } }
});
graph.addCell(tb);

var cb = new joint.shapes.basic.Circle({
    position: { x: 300, y: 70 },
    size: { width: 100, height: 40 },
    attrs: { text: { text: 'basic.Circle' } }
});
graph.addCell(cb);

var ib = new joint.shapes.basic.Image({
    position: { x: 450, y: 50 },
    size: { width: 40, height: 40 },
    attrs: {
        text: { text: 'basic.Image' },
        image: { 'xlink:href': 'https://cdn3.iconfinder.com/data/icons/betelgeuse/96/224386-folder-image-48.png', width: 48, height: 48 }
    }
});
graph.addCell(ib);

var pb = new joint.shapes.basic.Path({
    position: { x: 50, y: 150 },
    size: { width: 40, height: 40 },
    attrs: {
        path: { d: 'M25.979,12.896 19.312,12.896 19.312,6.229 12.647,6.229 12.647,12.896 5.979,12.896 5.979,19.562 12.647,19.562 12.647,26.229 19.312,26.229 19.312,19.562 25.979,19.562z' },
        text: { text: 'basic.Path' }
    }
});
graph.addCell(pb);

var tbl = new joint.shapes.basic.TextBlock({
    position: { x: 400, y: 180 },
    size: { width: 180, height: 100 },
    content: "Lorem ipsum dolor sit amet,\n consectetur adipiscing elit. Nulla vel porttitor est."
});
graph.addCell(tbl);

// An example of a custom element.
// -------------------------------

var MyElementWithPorts = joint.shapes.basic.Generic.extend({

   defaults: joint.util.deepSupplement({

       markup: [
           '<g class="rotatable">',
           '<g class="scalable">',
           '<rect/>',
           '</g>',
           '<g class="inPorts">',
           '<g class="port1"><circle/><text/></g>',
           '<g class="port2"><circle/><text/></g>',
           '</g>',
           '<g class="outPorts">',
           '<g class="port3"><circle/><text/></g>',
           '<g class="port4"><circle/><text/></g>',
           '</g>',
           '</g>'
       ].join(''),
   
       type: 'basic.Generic',
       attrs: {
           '.': { magnet: false },
           rect: {
               width: 150, height: 250,
               stroke: 'black'
           },
           circle: {
               r: 5,
               magnet: true,
               stroke: 'black'
           },
           text: {
               fill: 'black',
               'pointer-events': 'none'
           },
           '.label': { text: 'Model', dx: 5, dy: 5 },
           '.inPorts text': { dx:-15, 'text-anchor': 'end' },
           '.outPorts text':{ dx: 15 },
           '.inPorts circle': { fill: 'PaleGreen' },
           '.outPorts circle': { fill: 'Tomato' }
       }
       
   }, joint.shapes.basic.Generic.prototype.defaults)
});

var d = new MyElementWithPorts({
    position: { x: 250, y: 150 },
    size: { width: 80, height: 80 },
    attrs: {
        '.port1 text': { text: 'port1' },
        '.port2 text': { text: 'port2' },
        '.port3 text': { text: 'port3' },
        '.port4 text': { text: 'port4' },
        '.port1': { ref: 'rect', 'ref-y': .2 },
        '.port2': { ref: 'rect', 'ref-y': .4 },
        '.port3': { ref: 'rect', 'ref-y': .2, 'ref-dx': 0 },
        '.port4': { ref: 'rect', 'ref-y': .4, 'ref-dx': 0 }        
    }
});

graph.addCell(d);