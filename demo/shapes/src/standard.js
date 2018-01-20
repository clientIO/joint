'use strict';

var dia = joint.dia;
var standard = joint.shapes.standard;
var graph = new joint.dia.Graph();
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 800,
    gridSize: 10,
    model: graph
});

var rectangle = new standard.Rectangle();
rectangle.resize(100, 100);
rectangle.position(50, 10);
rectangle.attr('root/tabindex', 1);
rectangle.attr('label/text', 'Rectangle');
rectangle.addTo(graph);

var circle = new standard.Circle();
circle.resize(100, 100);
circle.position(250, 10);
circle.attr('root/tabindex', 2);
circle.attr('label/text', 'Circle');
circle.addTo(graph);

var ellipse = new standard.Ellipse();
ellipse.resize(150, 100);
ellipse.position(425, 10);
ellipse.attr('root/tabindex', 3);
ellipse.attr('label/text', 'Ellipse');
ellipse.addTo(graph);

var path = new standard.Path();
path.resize(100, 100);
path.position(50, 210);
path.attr('root/tabindex', 4);
path.attr('label/text', 'Path');
path.addTo(graph);

var polygon = new standard.Polygon();
polygon.resize(100, 100);
polygon.position(250, 210);
polygon.attr('root/tabindex', 5);
polygon.attr('label/text', 'Polygon');
polygon.addTo(graph);

var polyline = new standard.Polyline();
polyline.resize(100, 100);
polyline.position(450, 210);
polyline.attr('root/tabindex', 6);
polyline.attr('label/text', 'Polyline');
polyline.addTo(graph);

// Will request image the same size as the model.
joint.dia.attributes.placeholderURL = {
    set: function(url, refBBox) {
        refBBox.round();
        return { 'xlink:href': url + refBBox.width + 'x' + refBBox.height }
    }
};

var image = new standard.Image();
image.resize(150, 100);
image.position(25, 410);
image.attr('root/tabindex', 7);
image.attr('label/text', 'Image');
image.attr('image/placeholderURL', 'http://via.placeholder.com/');
image.addTo(graph);

var borderedImage = new standard.BorderedImage();
borderedImage.resize(150, 100);
borderedImage.position(225, 410);
borderedImage.attr('root/tabindex', 8);
borderedImage.attr('label/text', 'Bordered\nImage');
borderedImage.attr('border/rx', 5);
borderedImage.attr('image/placeholderURL', 'http://via.placeholder.com/');
borderedImage.addTo(graph);

var embeddedImage = new standard.EmbeddedImage();
embeddedImage.resize(150, 100);
embeddedImage.position(425, 410);
embeddedImage.attr('root/tabindex', 9);
embeddedImage.attr('label/text', 'Embedded\nImage');
embeddedImage.attr('image/xlinkHref', 'http://via.placeholder.com/60x80');
embeddedImage.addTo(graph);

var textBlock = new standard.TextBlock();
textBlock.resize(100, 100);
textBlock.position(50, 610);
textBlock.attr('root/tabindex', 10);
textBlock.attr('body/text', 'Hyper Text Markup Language');
textBlock.addTo(graph);
