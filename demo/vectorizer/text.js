(function() {

    var svg = V('svg', { width: '100%', height: '100%' }).appendTo(document.body);

    var defs = [{
        title: '1-Line',
        text: 'Single Line'
    }, {
        title: 'N-Lines',
        text: 'Multiple\nLines\n\n!!!'
    }, {
        title: 'Annotations and LineHeight "auto"',
        text: 'This iS a rich text.\nThis text goes to multiple lines.',
        opts: {
            annotations: [
                { start: 5, end: 10, attrs: { fill: 'red', 'font-size': 30 } },
                { start: 7, end: 15, attrs: { fill: 'blue' }},
                { start: 20, end: 30, attrs: { fill: 'blue', 'class': 'text-link', style: 'text-decoration: underline', 'font-size': 18  } }
            ],
            lineHeight: 'auto'
        }
    }, {
        title: 'Annotations and LineHeight "2em"',
        text: 'This iS a rich text.\nThis text goes to multiple lines.',
        opts: {
            annotations: [
                { start: 5, end: 10, attrs: { fill: 'red', 'font-size': 30 } },
                { start: 7, end: 15, attrs: { fill: 'blue' }},
                { start: 20, end: 30, attrs: { fill: 'blue', 'class': 'text-link', style: 'text-decoration: underline', 'font-size': 18  } }
            ],
            lineHeight: '2em'
        }
    }];

    var fontSize = 16;
    var textAnchor = 'middle';
    for (var i = 0, n = defs.length; i < n; i++) {

        var t , r, l, p, bbox;
        var def = defs[i];
        var y = (i + 1) * 200;
        var text = def.text;
        var opt = def.opts;
        var title = V('text', { x: 0, y: y - 50 }).text(def.title).appendTo(svg);

        V('line', { x1: 0, y1: y, x2: '100%', y2: y, stroke: 'gray', 'stroke-dasharray': 5 }).appendTo(svg);
        t = V('text').attr('font-size', fontSize).attr('text-anchor', textAnchor);
        t.attr({ x: '20%', y: y });
        t.appendTo(svg);
        t.text(text, Object.assign({ textVerticalAnchor: 'top' }, opt));

        bbox = t.getBBox();
        bbox.y += (y - bbox.y);
        r = V('rect').attr(bbox.toJSON()).attr({ fill: 'none', stroke: 'red' }).appendTo(svg);
        p = bbox.topRight();
        l = V('line').attr({ x1: p.x, y1: p.y, x2: p.x + 20, y2: p.y, 'stroke': 'red' }).appendTo(svg);

        t = V('text').attr('font-size', fontSize).attr('text-anchor', textAnchor);
        t.attr({ x: '50%', y: y});
        t.appendTo(svg);
        t.text(text, Object.assign({ textVerticalAnchor: 'middle' }, opt));

        bbox = t.getBBox();
        bbox.y += (y - bbox.height / 2 - bbox.y);
        r = V('rect').attr(bbox.toJSON()).attr({ fill: 'none', stroke: 'red' }).appendTo(svg);
        p = bbox.rightMiddle();
        l = V('line').attr({ x1: p.x, y1: p.y, x2: p.x + 20, y2: p.y, 'stroke': 'red' }).appendTo(svg);

        t = V('text').attr('font-size', fontSize).attr('text-anchor', textAnchor);
        t.attr({ x: '80%', y: y });
        t.appendTo(svg);
        t.text(text, Object.assign({ textVerticalAnchor: 'bottom' }, opt));

        bbox = t.getBBox();
        bbox.y += (y - bbox.height - bbox.y);
        r = V('rect').attr(bbox.toJSON()).attr({ fill: 'none', stroke: 'red' }).appendTo(svg);
        p = bbox.corner();
        l = V('line').attr({ x1: p.x, y1: p.y, x2: p.x + 20, y2: p.y, 'stroke': 'red' }).appendTo(svg);
    }

    V('text').attr({ y: 50, x: '20%', 'text-anchor': 'middle' }).text('Top\nAlignment').appendTo(svg);
    V('text').attr({ y: 50, x: '50%', 'text-anchor': 'middle' }).text('Middle\nAlignment').appendTo(svg);
    V('text').attr({ y: 50, x: '80%', 'text-anchor': 'middle' }).text('Bottom\nAlignment').appendTo(svg);

})();

