'use strict';

QUnit.module('joint.mvc.View', function(hooks) {

    var resetViews = function() {
        _.invoke(joint.mvc.views, 'remove');
        joint.mvc.views = {};
    };

    hooks.beforeEach(resetViews);
    hooks.afterEach(resetViews);

    QUnit.test('constructor', function(assert) {

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

    QUnit.test('options', function(assert) {

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

    QUnit.test('options for an svg element', function(assert) {

        var svgElementView = joint.mvc.View.extend({
            tagName: 'g',
            svgElement: true
        });
        var svgEl = new svgElementView();

        assert.ok(svgEl.el, 'element is created');
        assert.equal(svgEl.el.tagName.toLowerCase(), 'g', 'creates the correct element');
        assert.ok(svgEl.el instanceof SVGElement, 'element is of the type SVGElement');
    });

    QUnit.test('init()', function(assert) {

        var called = false;

        var SomeView = joint.mvc.View.extend({
            init: function() {
                called = true;
            }
        });

        new SomeView();

        assert.ok(called, 'should be executed when a new view is created');
    });

    QUnit.test('setTheme(theme)', function(assert) {

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

    QUnit.test('render()', function(assert) {

        assert.ok(typeof joint.mvc.View.prototype.render === 'function', 'should be a function');

        var called;

        var SomeView = joint.mvc.View.extend({
            render: function() {
                called = true;
            }
        });

        var view = new SomeView();
        called = false;
        var returnValue = view.render();

        assert.ok(called, 'custom render method should be called');
        assert.equal(returnValue, view, 'should return itself');
    });

    QUnit.test('onRender()', function(assert) {

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

    QUnit.test('classNamePrefix', function(assert) {

        var className = 'custom-class-name';

        var SomeView = joint.mvc.View.extend({
            className: className
        });

        var view = new SomeView();
        var defaultTheme = joint.mvc.View.prototype.defaultTheme;
        var themeClassName = SomeView.prototype.themeClassNamePrefix + defaultTheme;

        assert.equal(view.$el.attr('class'), joint.util.addClassNamePrefix(className) + ' ' + themeClassName);
    });

    QUnit.test('mvc.View.extend does not modify prototype or static properties objects', function(assert) {

        var protoProps = {};
        var staticProps = {};

        var MyView = joint.mvc.View.extend(protoProps, staticProps);
        MyView.extend(protoProps, staticProps);

        assert.ok(_.isEmpty(protoProps), 'does not add any properties to prototype properties argument');
        assert.ok(_.isEmpty(staticProps), 'does not add any properties to static properties argument');
    });
});
