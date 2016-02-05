'use strict';

QUnit.module('joint.env', function(hooks) {

    QUnit.test('addTest(name, fn)', function(assert) {

        assert.equal(typeof joint.env.addTest, 'function', 'should be a function');

        var testFn = function() {
            return true;
        };

        joint.env.addTest('custom1', testFn);

        assert.equal(joint.env._tests['custom1'], testFn, 'should be able to add a test');
    });

    QUnit.test('test(name)', function(assert) {

        assert.equal(typeof joint.env.test, 'function', 'should be a function');

        assert.throws(
            function() {
                joint.env.test('does_not_exist');
            },
            new Error('Test not defined ("does_not_exist"). Use `joint.env.addTest(name, fn) to add a new test.`'),
            'should throw error if test does not exist'
        );

        var numCalls = 0;

        joint.env._tests['custom1'] = function() {
            numCalls++;
            return true;
        };

        assert.ok(joint.env.test('custom1') && numCalls === 1, 'should run the test function');
        assert.ok(joint.env.test('custom1') && numCalls === 1, 'should only run the test function once');

        joint.env._tests['throws_error'] = function() {
            throw new Error('Testing thrown error');
        };

        assert.notOk(joint.env.test('throws_error'), 'should catch thrown error and return false');
    });
});
