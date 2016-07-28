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

    var setThemeCalled = false;
    var className = 'class-name1 class-name2';

    var SomeView = joint.mvc.View.extend({
        className: className,
        setTheme: function() {
            setThemeCalled = true;
        }
    });

    var view = new SomeView();

    _.each(className.split(' '), function(_className) {
        _className = joint.util.addClassNamePrefix(_className);
        assert.ok(view.$el.hasClass(_className), 'has expected class name(s)');
    });

    assert.ok(setThemeCalled, 'should have executed setTheme() method');
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

    new SomeView();

    assert.ok(called, 'should be executed when a new view is created');
});

test('setTheme(theme)', function(assert) {

    var theme = 'some-theme';
    var defaultTheme = joint.mvc.View.prototype.defaultTheme;
    var SomeView = joint.mvc.View.extend();
    var view = new SomeView();

    view.setTheme(theme);

    var themeClassName = SomeView.prototype.themeClassNamePrefix + theme;

    assert.notEqual(defaultTheme, undefined, 'default theme is set');
    assert.equal(view.theme, theme, 'should correctly set the theme for the view');
    assert.ok(view.$el.hasClass(themeClassName) && !view.$el.hasClass(defaultTheme), 'view.$el should have correct theme class name');
});

test('render()', function(assert) {

    assert.ok(typeof joint.mvc.View.prototype.render === 'function', 'should be a function');

    var view = new joint.mvc.View();

    assert.equal(view.render(), view, 'should return itself');
});

test('onRender()', function(assert) {

    assert.ok(typeof joint.mvc.View.prototype.onRender === 'function', 'should be a function');

    var called;

    var SomeView = joint.mvc.View.extend({
        onRender: function() {
            called = true;
        }
    });

    var view = new SomeView();

    called = false;
    view.render();
    assert.ok(called, 'should be called when render() is called');
});

test('classNamePrefix', function(assert) {

    var className = 'custom-class-name';

    var SomeView = joint.mvc.View.extend({
        className: className
    });

    var view = new SomeView();
    var defaultTheme = joint.mvc.View.prototype.defaultTheme;
    var themeClassName = SomeView.prototype.themeClassNamePrefix + defaultTheme;

    assert.equal(view.$el.attr('class'), themeClassName + ' ' + joint.util.addClassNamePrefix(className));
});
