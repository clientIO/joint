var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph
});

joint.shapes.basic.Cube = joint.shapes.basic.Generic.extend({

   defaults: _.defaultsDeep({

       type: 'basic.Cube',

       markup: [
           '<g class="rotatable"><g class="scalable">',
           '<g  id="layer1"     transform="translate(-86.239072,-219.33952)">    <g       style="fill:none;stroke:none"       id="g2989"       >      <path                  id="path2999"         style="fill:#afafde;fill-rule:evenodd;stroke:none"                 d="m 88.192424,269.53849 74.407006,41.08811 56.96124,-18.90953 -71.19432,-32.2265 z" />      <path                  id="path2991"         style="fill:#353564;fill-rule:evenodd;stroke:none"                  d="m 88.192424,224.59434 0,44.94415 60.173926,-10.04792 0,-38.1617 z" />      <path                  id="path3001"         style="fill:#e9e9ff;fill-rule:evenodd;stroke:none"                 d="m 148.36635,221.32887 71.19432,25.97662 0,44.41158 -71.19432,-32.2265 z" />      <path                  id="path2993"         style="fill:#4d4d9f;fill-rule:evenodd;stroke:none"                  d="m 88.192424,224.59434 74.407006,32.15935 56.96124,-9.4482 -71.19432,-25.97662 z" />      <path                  id="path2997"         style="fill:#d7d7ff;fill-rule:evenodd;stroke:none"                 d="m 162.59943,256.75369 0,53.87291 56.96124,-18.90953 0,-44.41158 z" />      <path         id="path2995"         style="fill:#8686bf;fill-rule:evenodd;stroke:none"                d="m 88.192424,224.59434 74.407006,32.15935 0,53.87291 -74.407006,-41.08811 z" />    </g>  </g>',
           '</g></g>'
       ].join('')
   }, joint.shapes.basic.Generic.prototype.defaults)
});


var cube = new joint.shapes.basic.Cube({
    position: { x: 50, y: 50 },
    size: { width: 200, height: 80 }
});
graph.addCell(cube);


cube.transition('angle', 360, { duration: 3000 });
cube.on('transition:end', function() {
    cube.transition('angle', cube.get('angle') + 360, { duration: 3000 });
});
