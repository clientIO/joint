var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper'), width: 650, height: 400, gridSize: 1, model: graph });

var el = new joint.shapes.basic.Rect({
    position: { x: 0, y: 0 },
    size: { width: 100, height: 40 },
    attrs: {
        rect: { rx: 2, ry: 2, fill: '#2ECC71', stroke: '#27AE60', 'stroke-width': 2 },
        text: { 'font-size': 10, fill: '#333' }
    }
});

var dropShadow = el.clone();
dropShadow.translate(20, 20);
dropShadow.attr('text/text', 'dropShadow(2,2,3)');
dropShadow.attr('rect/filter', { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 5, opacity: .8 } });
graph.addCell(dropShadow);

var blur = el.clone();
blur.translate(150, 20);
blur.attr('text/text', 'blur(5)');
blur.attr('rect/filter', { name: 'blur', args: { x: 5 } });
graph.addCell(blur);

var grayscale = el.clone();
grayscale.translate(280, 20);
grayscale.attr('text/text', 'grayscale(1)');
grayscale.attr('rect/filter', { name: 'grayscale' });
graph.addCell(grayscale);

var sepia = el.clone();
sepia.translate(410, 20);
sepia.attr('text/text', 'sepia(1)');
sepia.attr('rect/filter', { name: 'sepia' });
graph.addCell(sepia);

var saturate = el.clone();
saturate.translate(20, 100);
saturate.attr('text/text', 'saturate(.7)');
saturate.attr('rect/filter', { name: 'saturate', args: { amount: .7 } });
graph.addCell(saturate);

var hueRotate = el.clone();
hueRotate.translate(150, 100);
hueRotate.attr('text/text', 'hueRotate(50)');
hueRotate.attr('rect/filter', { name: 'hueRotate', args: { angle: 50 } });
graph.addCell(hueRotate);

var invert = el.clone();
invert.translate(280, 100);
invert.attr('text/text', 'invert(1)');
invert.attr('rect/filter', { name: 'invert' });
graph.addCell(invert);

var brightness = el.clone();
brightness.translate(410, 100);
brightness.attr('text/text', 'brightness(.7)');
brightness.attr('rect/filter', { name: 'brightness', args: { amount: .7 } });
graph.addCell(brightness);

var contrast = el.clone();
contrast.translate(20, 180);
contrast.attr('text/text', 'contrast(.5)');
contrast.attr('rect/filter', { name: 'contrast', args: { amount: .5 } });
graph.addCell(contrast);

