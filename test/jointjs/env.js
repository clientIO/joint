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
				joint.env.test('does_not_exist')
			},
			new Error('Test not defined ("does_not_exist"). Use `joint.env.addTest(name, fn) to add a new test.`'),
			'should throw error if test does not exist'
		);

		var called = false;
		joint.env._tests['custom1'] = function() {
			called = true;
			return true;
		};

		assert.ok(joint.env.test('custom1') && called, 'should run a test function');
	});
});
