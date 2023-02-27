var graph = new joint.dia.Graph;
new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 1,
    model: graph
});

var el = new joint.shapes.standard.Rectangle({
    position: { x: 0, y: 0 },
    size: { width: 100, height: 40 },
    attrs: {
        body: {
            rx: 2,
            ry: 2,
            fill: '#2ECC71',
            stroke: '#27AE60',
            strokeWidth: 2
        },
        label: {
            fontSize: 10,
            fill: '#333'
        }
    }
});

var dropShadow = el.clone();
dropShadow.translate(20, 20);
dropShadow.attr('label/text', 'dropShadow(2,2,3)');
dropShadow.attr('body/filter', { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 5, opacity: .8 }});
graph.addCell(dropShadow);

var blur = el.clone();
blur.translate(150, 20);
blur.attr('label/text', 'blur(5)');
blur.attr('body/filter', { name: 'blur', args: { x: 5 }});
graph.addCell(blur);

var grayscale = el.clone();
grayscale.translate(280, 20);
grayscale.attr('label/text', 'grayscale(1)');
grayscale.attr('body/filter', { name: 'grayscale' });
graph.addCell(grayscale);

var sepia = el.clone();
sepia.translate(410, 20);
sepia.attr('label/text', 'sepia(1)');
sepia.attr('body/filter', { name: 'sepia' });
graph.addCell(sepia);

var saturate = el.clone();
saturate.translate(20, 100);
saturate.attr('label/text', 'saturate(.7)');
saturate.attr('body/filter', { name: 'saturate', args: { amount: .7 }});
graph.addCell(saturate);

var hueRotate = el.clone();
hueRotate.translate(150, 100);
hueRotate.attr('label/text', 'hueRotate(50)');
hueRotate.attr('body/filter', { name: 'hueRotate', args: { angle: 50 }});
graph.addCell(hueRotate);

var invert = el.clone();
invert.translate(280, 100);
invert.attr('label/text', 'invert(1)');
invert.attr('body/filter', { name: 'invert' });
graph.addCell(invert);

var brightness = el.clone();
brightness.translate(410, 100);
brightness.attr('label/text', 'brightness(.7)');
brightness.attr('body/filter', { name: 'brightness', args: { amount: .7 }});
graph.addCell(brightness);

var contrast = el.clone();
contrast.translate(20, 180);
contrast.attr('label/text', 'contrast(.5)');
contrast.attr('body/filter', { name: 'contrast', args: { amount: .5 }});
graph.addCell(contrast);

