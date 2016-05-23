module('joint.mvc.View', {

    beforeEach: function() {

        _.invoke(joint.mvc.views, 'remove');
        joint.mvc.views = {};
    },

    afterEach: function() {

        _.invoke(joint.mvc.views, 'remove');
        joint.mvc.views = {};
    }
});

test('constructor', function(assert) {

    assert.ok(typeof joint.mvc.View === 'function', 'should be a function');

    var SomeView = joint.mvc.View.extend({
    });

    var view = new SomeView();

    assert.ok(_.keys(joint.mvc.views).length === 1, 'should add the instantiated view to the `joint.views` object');
});

test('options', function(assert) {

    var SomeView = joint.mvc.View.extend({
        options: {
            option1: 'some value',
            anotherOption: 150
        }
    });

    var instanceOptions = {
        option1: 'different value',
        option2: true
    };

    var view = new SomeView(instanceOptions);

    var expectedOptions = _.extend(
        {},
        joint.mvc.View.prototype.options,
        SomeView.prototype.options,
        instanceOptions
    );

    assert.deepEqual(view.options, expectedOptions, 'options should be inherited correctly');
});

test('init()', function(assert) {

    var called = false;

    var SomeView = joint.mvc.View.extend({
        init: function() {
            called = true;
        }
    });

    var view = new SomeView();

    assert.ok(called, 'should be executed when a new view is created');
});
