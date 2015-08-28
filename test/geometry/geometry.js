module('geometry');

test('scale', function(assert) {

    assert.equal(g.scale.linear([.5, 1], [50, 150], .75), 100, 'linear scale up');
    assert.equal(g.scale.linear([50, 150], [.5, 1], 100), .75, 'linear scale down');
});

test('line.bearing', function(assert) {

    assert.equal(g.line('0 0', '0 -10').bearing(), 'S', 'south bearing');
    assert.equal(g.line('0 0', '0 10').bearing(), 'N', 'north bearing');
    assert.equal(g.line('0 0', '10 10').bearing(), 'NE', 'north east bearing');
    assert.equal(g.line('0 0', '-10 10').bearing(), 'NW', 'north west bearing');
    assert.equal(g.line('0 0', '10 0').bearing(), 'E', 'east bearing');
    assert.equal(g.line('0 0', '-10 0').bearing(), 'W', 'west bearing');
    assert.equal(g.line('0 0', '-10 -10').bearing(), 'SW', 'south west bearing');
    assert.equal(g.line('0 0', '10 -10').bearing(), 'SE', 'south east bearing');
});

test('rect.containsRect', function(assert) {

    assert.notOk(g.rect(50, 50, 100, 100).containsRect(g.rect(20, 20, 200, 200)), 'not inside when surround');
    assert.notOk(g.rect(50, 50, 100, 100).containsRect(g.rect(40, 40, 100, 100)), 'not inside when overlap left and top');
    assert.notOk(g.rect(50, 50, 100, 100).containsRect(g.rect(60, 60, 100, 100)), 'not inside when overlap right and bottom');
    assert.ok(g.rect(50, 50, 100, 100).containsRect(g.rect(60, 60, 80, 80)), 'inside');
});

test('rect.equals', function(assert) {

    assert.ok(g.rect(20,20,100,100).equals(g.rect(20,20,100,100)), 'equal');
    assert.ok(g.rect(20,20,100,100).equals(g.rect(120,120,-100,-100)), 'equal when target not normalized');
    assert.ok(g.rect(120,120,-100,-100).equals(g.rect(20,20,100,100)), 'equal when source not normalized');
    assert.notOk(g.rect(20,20,100,100).equals(g.rect(10,10,110,110)), 'not equal');
});

test('rect.intersect', function(assert) {

    assert.ok(g.rect(20,20,100,100).intersect(g.rect(40,40,20,20)).equals(g.rect(40,40,20,20)), 'inside');
    assert.ok(g.rect(20,20,100,100).intersect(g.rect(0,0,100,100)).equals(g.rect(20,20,80,80)), 'overlap left and top');
    assert.ok(g.rect(20,20,100,100).intersect(g.rect(40,40,100,100)).equals(g.rect(40,40,80,80)), 'overlap right and bottom');
    assert.equal(g.rect(20,20,100,100).intersect(g.rect(140,140,20,20)), null, 'no intersection');
});
