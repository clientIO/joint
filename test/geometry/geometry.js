module('geometry');

test('scale', function() {

    equal(g.scale.linear([.5, 1], [50, 150], .75), 100, 'linear scale up');
    equal(g.scale.linear([50, 150], [.5, 1], 100), .75, 'linear scale down');
})

test('line.bearing', function() {

    equal(g.line('0 0', '0 -10').bearing(), 'S', 'south bearing');
    equal(g.line('0 0', '0 10').bearing(), 'N', 'north bearing');
    equal(g.line('0 0', '10 10').bearing(), 'NE', 'north east bearing');
    equal(g.line('0 0', '-10 10').bearing(), 'NW', 'north west bearing');
    equal(g.line('0 0', '10 0').bearing(), 'E', 'east bearing');
    equal(g.line('0 0', '-10 0').bearing(), 'W', 'west bearing');
    equal(g.line('0 0', '-10 -10').bearing(), 'SW', 'south west bearing');
    equal(g.line('0 0', '10 -10').bearing(), 'SE', 'south east bearing');
})

test('rect.containsRect', function() {

    ok(!g.rect(50, 50, 100, 100).containsRect(g.rect(20, 20, 200, 200)), 'not inside');
    ok(!g.rect(50, 50, 100, 100).containsRect(g.rect(60, 60, 100, 100)), 'inside');
})
