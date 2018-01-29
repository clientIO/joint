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
        var opt = def.opts || {};
        var title = V('text', { x: 0, y: y - 50 }).text(def.title).appendTo(svg);

        V('line', { x1: 0, y1: y, x2: '100%', y2: y, stroke: 'gray', 'stroke-dasharray': 5 }).appendTo(svg);

        // top
        t = V('text').attr('font-size', fontSize).attr('text-anchor', textAnchor);
        t.attr({ x: 200, y: y });
        t.appendTo(svg);
        opt.textVerticalAnchor = 'top';
        t.text(text, opt);

        bbox = t.getBBox();
        bbox.y += (y - bbox.y);
        r = V('rect').attr(bbox.toJSON()).attr({ fill: 'none', stroke: 'red' }).appendTo(svg);
        p = bbox.topRight();
        l = V('line').attr({ x1: p.x, y1: p.y, x2: p.x + 20, y2: p.y, 'stroke': 'red' }).appendTo(svg);

        // middle
        t = V('text').attr('font-size', fontSize).attr('text-anchor', textAnchor);
        t.attr({ x: 500, y: y});
        t.appendTo(svg);
        opt.textVerticalAnchor = 'middle';
        t.text(text, opt);

        bbox = t.getBBox();
        bbox.y += (y - bbox.height / 2 - bbox.y);
        r = V('rect').attr(bbox.toJSON()).attr({ fill: 'none', stroke: 'red' }).appendTo(svg);
        p = bbox.rightMiddle();
        l = V('line').attr({ x1: p.x, y1: p.y, x2: p.x + 20, y2: p.y, 'stroke': 'red' }).appendTo(svg);

        // bottom
        t = V('text').attr('font-size', fontSize).attr('text-anchor', textAnchor);
        t.attr({ x: 800, y: y });
        t.appendTo(svg);
        opt.textVerticalAnchor = 'bottom';
        t.text(text, opt);

        bbox = t.getBBox();
        bbox.y += (y - bbox.height - bbox.y);
        r = V('rect').attr(bbox.toJSON()).attr({ fill: 'none', stroke: 'red' }).appendTo(svg);
        p = bbox.corner();
        l = V('line').attr({ x1: p.x, y1: p.y, x2: p.x + 20, y2: p.y, 'stroke': 'red' }).appendTo(svg);
    }

    // text path
    l = V('path').attr({ d: 'M 0 80 200 50 400 80 600 50 700 80 1000 50', stroke: 'gray', 'stroke-width': 2, fill: 'none' }).appendTo(svg);
    t = V('text').attr({ 'font-weight': 'bold' });
    t.clone().attr('x', 200).text('Top\nAnchor', { textVerticalAnchor: 'top',  textPath: { 'xlink:href': '#' + l.id }}).appendTo(svg);
    t.clone().attr('x', 500).text('Middle\nAnchor', { textVerticalAnchor: 'middle', textPath: { 'xlink:href': '#' + l.id }}).appendTo(svg);
    t.clone().attr('x', 800).text('Bottom\nAnchor', { textVerticalAnchor: 'bottom', textPath: { 'xlink:href': '#' + l.id }}).appendTo(svg);

})();
