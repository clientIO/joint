'use strict';

var dia = joint.dia;
var util = joint.util;
var standard = joint.shapes.standard;

// Custom attribute for retrieving image placeholder with specific size
dia.attributes.placeholderURL = {
    qualify: function(url) {
        return typeof url === 'string';
    },
    set: function(url, refBBox) {
        return { 'xlink:href': util.template(url)(refBBox.round().toJSON()) }
    }
};

var graph = new dia.Graph();
var paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 800,
    gridSize: 1,
    model: graph
});

var rectangle = new standard.Rectangle();
rectangle.resize(100, 100);
rectangle.position(50, 10);
rectangle.attr('root/tabindex', 1);
rectangle.attr('root/title', 'joint.shapes.standard.Rectangle');
rectangle.attr('body/fill', '#30d0c6');
rectangle.attr('body/fillOpacity', 0.5);
rectangle.attr('label/text', 'Rectangle');
rectangle.addTo(graph);

var circle = new standard.Circle();
circle.resize(100, 100);
circle.position(200, 10);
circle.attr('root/tabindex', 2);
circle.attr('root/title', 'joint.shapes.standard.Circle');
circle.attr('body/fill', '#30d0c6');
circle.attr('body/fillOpacity', 0.5);
circle.attr('label/text', 'Circle');
circle.addTo(graph);

var ellipse = new standard.Ellipse();
ellipse.resize(150, 100);
ellipse.position(350, 10);
ellipse.attr('root/tabindex', 3);
ellipse.attr('root/title', 'joint.shapes.standard.Ellipse');
ellipse.attr('body/fill', '#30d0c6');
ellipse.attr('body/fillOpacity', 0.5);
ellipse.attr('label/text', 'Ellipse');
ellipse.addTo(graph);

var path = new standard.Path();
path.resize(100, 100);
path.position(50, 210);
path.attr('root/tabindex', 4);
path.attr('root/title', 'joint.shapes.standard.Path');
path.attr('label/text', 'Path');
path.attr('body/fill', '#30d0c6');
path.attr('body/fillOpacity', 0.5);
path.attr('body/refD', 'M 0 5 10 0 C 20 0 20 20 10 20 L 0 15 Z');
path.addTo(graph);

var polygon = new standard.Polygon();
polygon.resize(100, 100);
polygon.position(200, 210);
polygon.attr('root/tabindex', 5);
polygon.attr('root/title', 'joint.shapes.standard.Polygon');
polygon.attr('label/text', 'Polygon');
polygon.attr('body/fill', '#30d0c6');
polygon.attr('body/fillOpacity', 0.5);
polygon.attr('body/refPoints', '0,10 10,0 20,10 10,20');
polygon.addTo(graph);

var polyline = new standard.Polyline();
polyline.resize(100, 100);
polyline.position(375, 210);
polyline.attr('root/tabindex', 6);
polyline.attr('root/title', 'joint.shapes.standard.Polyline');
polyline.attr('label/text', 'Polyline');
polyline.attr('body/fill', '#30d0c6');
polyline.attr('body/fillOpacity', 0.5);
polyline.attr('body/refPoints', '0,0 0,10 10,10 10,0');
polyline.addTo(graph);

var cylinder = new standard.Cylinder();
cylinder.resize(100, 200);
cylinder.position(525, 75);
cylinder.attr('root/tabindex', 7);
cylinder.attr('root/title', 'joint.shapes.standard.Cylinder');
cylinder.attr('body/fill','#fe854f');
cylinder.attr('body/fillOpacity', 0.5);
cylinder.attr('top/fill','#fe854f');
cylinder.attr('top/fillOpacity', 0.8);
cylinder.attr('label/text', 'Cylinder');
cylinder.addTo(graph);

var image = new standard.Image();
image.resize(150, 100);
image.position(25, 410);
image.attr('root/tabindex', 8);
image.attr('root/title', 'joint.shapes.standard.Image');
image.attr('label/text', 'Image');
image.attr('image/placeholderURL', 'http://via.placeholder.com/${width}x${height}');
image.addTo(graph);

var borderedImage = new standard.BorderedImage();
borderedImage.resize(150, 100);
borderedImage.position(225, 410);
borderedImage.attr('root/tabindex', 9);
borderedImage.attr('root/title', 'joint.shapes.standard.BoarderedImage');
borderedImage.attr('label/text', 'Bordered\nImage');
borderedImage.attr('border/rx', 5);
borderedImage.attr('image/placeholderURL', 'http://via.placeholder.com/${width}x${height}');
borderedImage.addTo(graph);

var embeddedImage = new standard.EmbeddedImage();
embeddedImage.resize(150, 100);
embeddedImage.position(425, 410);
embeddedImage.attr('root/tabindex', 10);
embeddedImage.attr('root/title', 'joint.shapes.standard.EmbeddedImage');
embeddedImage.attr('label/text', 'Embedded\nImage');
embeddedImage.attr('body/fill', '#fe854f');
embeddedImage.attr('body/fillOpacity', 0.5);
embeddedImage.attr('image/xlinkHref', 'http://via.placeholder.com/60x80');
embeddedImage.addTo(graph);

var headeredRectangle = new standard.HeaderedRectangle();
headeredRectangle.resize(150, 100);
headeredRectangle.position(25, 610);
headeredRectangle.attr('root/tabindex', 11);
headeredRectangle.attr('root/title', 'joint.shapes.standard.HeaderedRectangle');
headeredRectangle.attr('header/fill', '#000000');
headeredRectangle.attr('header/fillOpacity', 0.1);
headeredRectangle.attr('headerText/text', 'Header');
headeredRectangle.attr('body/fill', '#fe854f');
headeredRectangle.attr('body/fillOpacity', 0.5);
headeredRectangle.attr('bodyText/text', 'Headered\nRectangle');
headeredRectangle.addTo(graph);

var textBlock = new standard.TextBlock();
textBlock.resize(100, 100);
textBlock.position(250, 610);
textBlock.attr('root/tabindex', 12);
textBlock.attr('root/title', 'joint.shapes.standard.TextBlock');
textBlock.attr('body/fill', '#5654a0');
textBlock.attr('body/fillOpacity', 0.5);
textBlock.attr('label/text', 'Hyper Text Markup Language');
textBlock.attr('label/style/color', '#ffffff');
textBlock.addTo(graph);

var link = new standard.Link();
link.prop('source', { x: 450, y: 600 });
link.prop('target', { x: 400, y: 750 });
link.attr('root/tabindex', 13);
link.attr('root/title', 'joint.shapes.standard.Link');
link.attr('line/stroke', '#fe854f');
link.vertices([{ x: 450, y: 700 }]);
link.addTo(graph);

var doubleLink = new standard.DoubleLink();
doubleLink.prop('source', { x: 500, y: 600 });
doubleLink.prop('target', { x: 450, y: 750 });
doubleLink.attr('root/tabindex', 14);
doubleLink.attr('root/title', 'joint.shapes.standard.DoubleLink');
doubleLink.attr('line/stroke', '#30d0c6');
doubleLink.vertices([{ x: 500, y: 700 }]);
doubleLink.addTo(graph);

var shadowLink = new standard.ShadowLink();
shadowLink.prop('source', { x: 550, y: 600 });
shadowLink.prop('target', { x: 500, y: 750 });
shadowLink.attr('root/tabindex', 15);
shadowLink.attr('root/title', 'joint.shapes.standard.ShadowLink');
shadowLink.attr('line/stroke', '#5654a0');
shadowLink.vertices([{ x: 550, y: 700 }]);
shadowLink.addTo(graph);
