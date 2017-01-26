QUnit.module('Special Attributes', function() {

    QUnit.module('getAttributeDefinition()', function() {

        QUnit.test('will find correct defintion', function(assert) {

            joint.dia.specialAttributes.globalTest = 'global';
            joint.dia.specialAttributes.priority = 'lower';

            var Cell = joint.dia.Cell.extend({}, {
                specialAttributes: {
                    localTest: 'local',
                    priority: 'higher'
                }
            });

            assert.equal(Cell.getAttributeDefinition(), null);
            assert.equal(Cell.getAttributeDefinition('nonExistingTest'), null);            
            assert.equal(Cell.getAttributeDefinition('globalTest'), 'global');
            assert.equal(Cell.getAttributeDefinition('localTest'), 'local');
            assert.equal(Cell.getAttributeDefinition('priority'), 'higher');
        });
    });



});
