'use strict';

QUnit.module('joint.mvc.Collection', function(hooks) {

    var a, b, c, d, e, col, otherCol;

    QUnit.module('mvc.Collection', {

        beforeEach: function(assert) {
            a         = new joint.mvc.Model({ id: 3, label: 'a' });
            b         = new joint.mvc.Model({ id: 2, label: 'b' });
            c         = new joint.mvc.Model({ id: 1, label: 'c' });
            d         = new joint.mvc.Model({ id: 0, label: 'd' });
            e         = null;
            col       = new joint.mvc.Collection([a, b, c, d]);
            otherCol  = new joint.mvc.Collection();
        }

    });

    QUnit.test('new and sort', function(assert) {
        assert.expect(6);
        var counter = 0;
        col.on('sort', function(){ counter++; });
        assert.deepEqual(col.map((model) => model.get('label')), ['a', 'b', 'c', 'd']);
        col.comparator = function(m1, m2) {
            return m1.id > m2.id ? -1 : 1;
        };
        col.sort();
        assert.equal(counter, 1);
        assert.deepEqual(col.map((model) => model.get('label')), ['a', 'b', 'c', 'd']);
        col.comparator = function(model) { return model.id; };
        col.sort();
        assert.equal(counter, 2);
        assert.deepEqual(col.map((model) => model.get('label')), ['d', 'c', 'b', 'a']);
        assert.equal(col.length, 4);
    });

    QUnit.test('String comparator.', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection([
            { id: 3 },
            { id: 1 },
            { id: 2 }
        ], { comparator: 'id' });
        assert.deepEqual(collection.map((model) => model.get('id')), [1, 2, 3]);
    });

    QUnit.test('clone preserves model and comparator', function(assert) {
        assert.expect(3);
        var Model = joint.mvc.Model.extend();
        var comparator = function(model){ return model.id; };

        var collection = new joint.mvc.Collection([{ id: 1 }], {
            model: Model,
            comparator: comparator
        }).clone();
        collection.add({ id: 2 });
        assert.ok(collection.at(0) instanceof Model);
        assert.ok(collection.at(1) instanceof Model);
        assert.strictEqual(collection.comparator, comparator);
    });

    QUnit.test('get', function(assert) {
        assert.expect(6);
        assert.equal(col.get(0), d);
        assert.equal(col.get(d.clone()), d);
        assert.equal(col.get(2), b);
        assert.equal(col.get({ id: 1 }), c);
        assert.equal(col.get(c.clone()), c);
        assert.equal(col.get(col.first().cid), col.first());
    });

    QUnit.test('get with non-default ids', function(assert) {
        assert.expect(5);
        var MongoModel = joint.mvc.Model.extend({ idAttribute: '_id' });
        var model = new MongoModel({ _id: 100 });
        var collection = new joint.mvc.Collection([model], { model: MongoModel });
        assert.equal(collection.get(100), model);
        assert.equal(collection.get(model.cid), model);
        assert.equal(collection.get(model), model);
        assert.equal(collection.get(101), void 0);

        var collection2 = new joint.mvc.Collection();
        collection2.model = MongoModel;
        collection2.add(model.attributes);
        assert.equal(collection2.get(model.clone()), collection2.first());
    });

    QUnit.test('has', function(assert) {
        assert.expect(15);
        assert.ok(col.has(a));
        assert.ok(col.has(b));
        assert.ok(col.has(c));
        assert.ok(col.has(d));
        assert.ok(col.has(a.id));
        assert.ok(col.has(b.id));
        assert.ok(col.has(c.id));
        assert.ok(col.has(d.id));
        assert.ok(col.has(a.cid));
        assert.ok(col.has(b.cid));
        assert.ok(col.has(c.cid));
        assert.ok(col.has(d.cid));
        var outsider = new joint.mvc.Model({ id: 4 });
        assert.notOk(col.has(outsider));
        assert.notOk(col.has(outsider.id));
        assert.notOk(col.has(outsider.cid));
    });

    QUnit.test('update index when id changes', function(assert) {
        assert.expect(6);
        var collection = new joint.mvc.Collection();
        collection.add([
            { id: 0, name: 'one' },
            { id: 1, name: 'two' }
        ]);
        var one = collection.get(0);
        assert.equal(one.get('name'), 'one');
        collection.on('change:name', function(model) {
            assert.ok(this.get(model));
            assert.equal(model, this.get(101));
            assert.equal(this.get(0), null);
        });
        one.set({ name: 'dalmatians', id: 101 });
        assert.equal(collection.get(0), null);
        assert.equal(collection.get(101).get('name'), 'dalmatians');
    });

    QUnit.test('at', function(assert) {
        assert.expect(2);
        assert.equal(col.at(2), c);
        assert.equal(col.at(-2), c);
    });

    QUnit.test('add', function(assert) {
        assert.expect(14);
        var added, opts, secondAdded;
        added = opts = secondAdded = null;
        e = new joint.mvc.Model({ id: 10, label: 'e' });
        otherCol.add(e);
        otherCol.on('add', function() {
            secondAdded = true;
        });
        col.on('add', function(model, collection, options){
            added = model.get('label');
            opts = options;
        });
        col.add(e, { amazing: true });
        assert.equal(added, 'e');
        assert.equal(col.length, 5);
        assert.equal(col.last(), e);
        assert.equal(otherCol.length, 1);
        assert.equal(secondAdded, null);
        assert.ok(opts.amazing);

        var f = new joint.mvc.Model({ id: 20, label: 'f' });
        var g = new joint.mvc.Model({ id: 21, label: 'g' });
        var h = new joint.mvc.Model({ id: 22, label: 'h' });
        var atCol = new joint.mvc.Collection([f, g, h]);
        assert.equal(atCol.length, 3);
        atCol.add(e, { at: 1 });
        assert.equal(atCol.length, 4);
        assert.equal(atCol.at(1), e);
        assert.equal(atCol.last(), h);

        var coll = new joint.mvc.Collection(new Array(2));
        var addCount = 0;
        coll.on('add', function(){
            addCount += 1;
        });
        coll.add([undefined, f, g]);
        assert.equal(coll.length, 5);
        assert.equal(addCount, 3);
        coll.add(new Array(4));
        assert.equal(coll.length, 9);
        assert.equal(addCount, 7);
    });

    QUnit.test('add multiple models', function(assert) {
        assert.expect(6);
        var collection = new joint.mvc.Collection([{ at: 0 }, { at: 1 }, { at: 9 }]);
        collection.add([{ at: 2 }, { at: 3 }, { at: 4 }, { at: 5 }, { at: 6 }, { at: 7 }, { at: 8 }], { at: 2 });
        for (var i = 0; i <= 5; i++) {
            assert.equal(collection.at(i).get('at'), i);
        }
    });

    QUnit.test('add; at should have preference over comparator', function(assert) {
        assert.expect(1);
        var Col = joint.mvc.Collection.extend({
            comparator: function(m1, m2) {
                return m1.id > m2.id ? -1 : 1;
            }
        });

        var collection = new Col([{ id: 2 }, { id: 3 }]);
        collection.add(new joint.mvc.Model({ id: 1 }), { at: 1 });

        assert.equal(collection.map((model) => model.get('id')).join(' '), '3 1 2');
    });

    QUnit.test('add; at should add to the end if the index is out of bounds', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection([{ id: 2 }, { id: 3 }]);
        collection.add(new joint.mvc.Model({ id: 1 }), { at: 5 });

        assert.equal(collection.map((model) => model.get('id')).join(' '), '2 3 1');
    });

    QUnit.test('can\'t add model to collection twice', function(assert) {
        var collection = new joint.mvc.Collection([{ id: 1 }, { id: 2 }, { id: 1 }, { id: 2 }, { id: 3 }]);
        assert.equal(collection.map((model) => model.get('id')).join(' '), '1 2 3');
    });

    QUnit.test('can\'t add different model with same id to collection twice', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection;
        collection.unshift({ id: 101 });
        collection.add({ id: 101 });
        assert.equal(collection.length, 1);
    });

    QUnit.test('merge in duplicate models with {merge: true}', function(assert) {
        assert.expect(3);
        var collection = new joint.mvc.Collection;
        collection.add([{ id: 1, name: 'Moe' }, { id: 2, name: 'Curly' }, { id: 3, name: 'Larry' }]);
        collection.add({ id: 1, name: 'Moses' });
        assert.equal(collection.first().get('name'), 'Moe');
        collection.add({ id: 1, name: 'Moses' }, { merge: true });
        assert.equal(collection.first().get('name'), 'Moses');
        collection.add({ id: 1, name: 'Tim' }, { merge: true, silent: true });
        assert.equal(collection.first().get('name'), 'Tim');
    });

    QUnit.test('add model to multiple collections', function(assert) {
        assert.expect(10);
        var counter = 0;
        var m = new joint.mvc.Model({ id: 10, label: 'm' });
        m.on('add', function(model, collection) {
            counter++;
            assert.equal(m, model);
            if (counter > 1) {
                assert.equal(collection, col2);
            } else {
                assert.equal(collection, col1);
            }
        });
        var col1 = new joint.mvc.Collection([]);
        col1.on('add', function(model, collection) {
            assert.equal(m, model);
            assert.equal(col1, collection);
        });
        var col2 = new joint.mvc.Collection([]);
        col2.on('add', function(model, collection) {
            assert.equal(m, model);
            assert.equal(col2, collection);
        });
        col1.add(m);
        assert.equal(m.collection, col1);
        col2.add(m);
        assert.equal(m.collection, col1);
    });

    QUnit.test('add model to collection with sort()-style comparator', function(assert) {
        assert.expect(3);
        var collection = new joint.mvc.Collection;
        collection.comparator = function(m1, m2) {
            return m1.get('name') < m2.get('name') ? -1 : 1;
        };
        var tom = new joint.mvc.Model({ name: 'Tom' });
        var rob = new joint.mvc.Model({ name: 'Rob' });
        var tim = new joint.mvc.Model({ name: 'Tim' });
        collection.add(tom);
        collection.add(rob);
        collection.add(tim);
        assert.equal(collection.models.indexOf(rob), 0);
        assert.equal(collection.models.indexOf(tim), 1);
        assert.equal(collection.models.indexOf(tom), 2);
    });

    QUnit.test('comparator that depends on `this`', function(assert) {
        assert.expect(2);
        var collection = new joint.mvc.Collection;
        collection.negative = function(num) {
            return -num;
        };
        collection.comparator = function(model) {
            return this.negative(model.id);
        };
        collection.add([{ id: 1 }, { id: 2 }, { id: 3 }]);
        assert.deepEqual(collection.map((model) => model.get('id')), [3, 2, 1]);
        collection.comparator = function(m1, m2) {
            return this.negative(m2.id) - this.negative(m1.id);
        };
        collection.sort();
        assert.deepEqual(collection.map((model) => model.get('id')), [1, 2, 3]);
    });

    QUnit.test('remove', function(assert) {
        assert.expect(12);
        var removed = null;
        var result = null;
        col.on('remove', function(model, collection, options) {
            removed = model.get('label');
            assert.equal(options.index, 3);
            assert.equal(collection.get(model), undefined, '#3693: model cannot be fetched from collection');
        });
        result = col.remove(d);
        assert.equal(removed, 'd');
        assert.strictEqual(result, d);
        //if we try to remove d again, it's not going to actually get removed
        result = col.remove(d);
        assert.strictEqual(result, undefined);
        assert.equal(col.length, 3);
        assert.equal(col.first(), a);
        col.off();
        result = col.remove([c, d]);
        assert.equal(result.length, 1, 'only returns removed models');
        assert.equal(result[0], c, 'only returns removed models');
        result = col.remove([c, b]);
        assert.equal(result.length, 1, 'only returns removed models');
        assert.equal(result[0], b, 'only returns removed models');
        result = col.remove([]);
        assert.deepEqual(result, [], 'returns empty array when nothing removed');
    });

    QUnit.test('add and remove return values', function(assert) {
        assert.expect(13);
        var Even = joint.mvc.Model.extend({
            validate: function(attrs) {
                if (attrs.id % 2 !== 0) return 'odd';
            }
        });
        var collection = new joint.mvc.Collection;
        collection.model = Even;

        var list = collection.add([{ id: 2 }, { id: 4 }], { validate: true });
        assert.equal(list.length, 2);
        assert.ok(list[0] instanceof joint.mvc.Model);
        assert.equal(list[1], collection.last());
        assert.equal(list[1].get('id'), 4);

        list = collection.add([{ id: 3 }, { id: 6 }], { validate: true });
        assert.equal(collection.length, 3);
        assert.equal(list[0], false);
        assert.equal(list[1].get('id'), 6);

        var result = collection.add({ id: 6 });
        assert.equal(result.cid, list[1].cid);

        result = collection.remove({ id: 6 });
        assert.equal(collection.length, 2);
        assert.equal(result.id, 6);

        list = collection.remove([{ id: 2 }, { id: 8 }]);
        assert.equal(collection.length, 1);
        assert.equal(list[0].get('id'), 2);
        assert.equal(list[1], null);
    });

    QUnit.test('shift and pop', function(assert) {
        assert.expect(2);
        var collection = new joint.mvc.Collection([{ a: 'a' }, { b: 'b' }, { c: 'c' }]);
        assert.equal(collection.shift().get('a'), 'a');
        assert.equal(collection.pop().get('c'), 'c');
    });

    QUnit.test('slice', function(assert) {
        assert.expect(2);
        var collection = new joint.mvc.Collection([{ a: 'a' }, { b: 'b' }, { c: 'c' }]);
        var array = collection.slice(1, 3);
        assert.equal(array.length, 2);
        assert.equal(array[0].get('b'), 'b');
    });

    QUnit.test('events are unbound on remove', function(assert) {
        assert.expect(3);
        var counter = 0;
        var dj = new joint.mvc.Model();
        var emcees = new joint.mvc.Collection([dj]);
        emcees.on('change', function(){ counter++; });
        dj.set({ name: 'Kool' });
        assert.equal(counter, 1);
        emcees.reset([]);
        assert.equal(dj.collection, undefined);
        dj.set({ name: 'Shadow' });
        assert.equal(counter, 1);
    });

    QUnit.test('remove in multiple collections', function(assert) {
        assert.expect(7);
        var modelData = {
            id: 5,
            title: 'Othello'
        };
        var passed = false;
        var m1 = new joint.mvc.Model(modelData);
        var m2 = new joint.mvc.Model(modelData);
        m2.on('remove', function() {
            passed = true;
        });
        var col1 = new joint.mvc.Collection([m1]);
        var col2 = new joint.mvc.Collection([m2]);
        assert.notEqual(m1, m2);
        assert.ok(col1.length === 1);
        assert.ok(col2.length === 1);
        col1.remove(m1);
        assert.equal(passed, false);
        assert.ok(col1.length === 0);
        col2.remove(m1);
        assert.ok(col2.length === 0);
        assert.equal(passed, true);
    });

    QUnit.test('remove same model in multiple collection', function(assert) {
        assert.expect(16);
        var counter = 0;
        var m = new joint.mvc.Model({ id: 5, title: 'Othello' });
        m.on('remove', function(model, collection) {
            counter++;
            assert.equal(m, model);
            if (counter > 1) {
                assert.equal(collection, col1);
            } else {
                assert.equal(collection, col2);
            }
        });
        var col1 = new joint.mvc.Collection([m]);
        col1.on('remove', function(model, collection) {
            assert.equal(m, model);
            assert.equal(col1, collection);
        });
        var col2 = new joint.mvc.Collection([m]);
        col2.on('remove', function(model, collection) {
            assert.equal(m, model);
            assert.equal(col2, collection);
        });
        assert.equal(col1, m.collection);
        col2.remove(m);
        assert.ok(col2.length === 0);
        assert.ok(col1.length === 1);
        assert.equal(counter, 1);
        assert.equal(col1, m.collection);
        col1.remove(m);
        assert.equal(null, m.collection);
        assert.ok(col1.length === 0);
        assert.equal(counter, 2);
    });

    QUnit.test('initialize', function(assert) {
        assert.expect(1);
        var Collection = joint.mvc.Collection.extend({
            initialize: function() {
                this.one = 1;
            }
        });
        var coll = new Collection;
        assert.equal(coll.one, 1);
    });

    QUnit.test('preinitialize', function(assert) {
        assert.expect(1);
        var Collection = joint.mvc.Collection.extend({
            preinitialize: function() {
                this.one = 1;
            }
        });
        var coll = new Collection;
        assert.equal(coll.one, 1);
    });

    QUnit.test('preinitialize occurs before the collection is set up', function(assert) {
        assert.expect(2);
        var Collection = joint.mvc.Collection.extend({
            preinitialize: function() {
                assert.notEqual(this.model, FooModel);
            }
        });
        var FooModel = joint.mvc.Model.extend({ id: 'foo' });
        var coll = new Collection({}, {
            model: FooModel
        });
        assert.equal(coll.model, FooModel);
    });

    QUnit.test('toJSON', function(assert) {
        assert.expect(1);
        assert.equal(JSON.stringify(col), '[{"id":3,"label":"a"},{"id":2,"label":"b"},{"id":1,"label":"c"},{"id":0,"label":"d"}]');
    });

    QUnit.test('Collection methods', function(assert) {
        assert.expect(14);

        // each
        col.each((model, i) => model.set({ customData: i }));
        assert.equal(JSON.stringify(col), '[{"id":3,"label":"a","customData":0},{"id":2,"label":"b","customData":1},{"id":1,"label":"c","customData":2},{"id":0,"label":"d","customData":3}]');

        // filter
        assert.equal(col.filter((model) => model.get('customData') === 0).length, 1);

        // first
        assert.equal(col.first().get('id'), col.models[0].id);

        // includes
        assert.ok(col.includes(col.models[0]));

        const model = new joint.mvc.Model({ id: 5, label: 'a' });
        assert.ok(!col.includes(model));

        // last
        assert.equal(col.last().get('id'), col.models[col.models.length - 1].id);

        // isEmpty
        assert.ok(!col.isEmpty());

        const collection = new joint.mvc.Collection([]);
        assert.ok(collection.isEmpty());

        collection.set([new joint.mvc.Model({ id: 1, label: 'a' })]);
        assert.ok(!collection.isEmpty());

        // map
        assert.equal(col.map((model) => model.get('label')).join(' '), 'a b c d');

        // reduce
        const initAcc = 0;
        assert.equal(col.reduce((acc, model) => acc + model.id, initAcc), 6);
        assert.equal(collection.reduce((acc, model) => acc.get('id') + model.id ), 2);

        // sortBy
        assert.deepEqual(col.sortBy((model) => model.id)[0], col.at(3));

        // toArray
        assert.ok(Array.isArray(col.toArray()));
    });

    QUnit.test('Collection methods with object-style and property-style iteratee', function(assert) {
        assert.expect(2);
        const model = new joint.mvc.Model({ a: 4, b: 1, e: 3 });
        const collection = new joint.mvc.Collection([
            { a: 1, b: 1 },
            { a: 2, b: 1, c: 1 },
            { a: 3, b: 1 },
            model
        ]);

        assert.deepEqual(collection.sortBy('a')[3], model);
        assert.deepEqual(collection.sortBy('e')[0], model);
    });

    QUnit.test('reset', function(assert) {
        assert.expect(16);

        var resetCount = 0;
        var models = col.models;
        col.on('reset', function() { resetCount += 1; });
        col.reset([]);
        assert.equal(resetCount, 1);
        assert.equal(col.length, 0);
        assert.equal(col.last(), null);
        col.reset(models);
        assert.equal(resetCount, 2);
        assert.equal(col.length, 4);
        assert.equal(col.last(), d);
        col.reset(_.map(models, function(m){ return m.attributes; }));
        assert.equal(resetCount, 3);
        assert.equal(col.length, 4);
        assert.ok(col.last() !== d);
        assert.ok(_.isEqual(col.last().attributes, d.attributes));
        col.reset();
        assert.equal(col.length, 0);
        assert.equal(resetCount, 4);

        var f = new joint.mvc.Model({ id: 20, label: 'f' });
        col.reset([undefined, f]);
        assert.equal(col.length, 2);
        assert.equal(resetCount, 5);

        col.reset(new Array(4));
        assert.equal(col.length, 4);
        assert.equal(resetCount, 6);
    });

    QUnit.test('reset with different values', function(assert) {
        var collection = new joint.mvc.Collection({ id: 1 });
        collection.reset({ id: 1, a: 1 });
        assert.equal(collection.get(1).get('a'), 1);
    });

    QUnit.test('same references in reset', function(assert) {
        var model = new joint.mvc.Model({ id: 1 });
        var collection = new joint.mvc.Collection({ id: 1 });
        collection.reset(model);
        assert.equal(collection.get(1), model);
    });

    QUnit.test('reset passes caller options', function(assert) {
        assert.expect(3);
        var Model = joint.mvc.Model.extend({
            initialize: function(attrs, options) {
                this.modelParameter = options.modelParameter;
            }
        });
        var collection = new (joint.mvc.Collection.extend({ model: Model }))();
        collection.reset([{ astring: 'green', anumber: 1 }, { astring: 'blue', anumber: 2 }], { modelParameter: 'model parameter' });
        assert.equal(collection.length, 2);
        collection.each(function(model) {
            assert.equal(model.modelParameter, 'model parameter');
        });
    });

    QUnit.test('reset does not alter options by reference', function(assert) {
        assert.expect(2);
        var collection = new joint.mvc.Collection([{ id: 1 }]);
        var origOpts = {};
        collection.on('reset', function(coll, opts){
            assert.equal(origOpts.previousModels, undefined);
            assert.equal(opts.previousModels[0].id, 1);
        });
        collection.reset([], origOpts);
    });

    QUnit.test('trigger custom events on models', function(assert) {
        assert.expect(1);
        var fired = null;
        a.on('custom', function() { fired = true; });
        a.trigger('custom');
        assert.equal(fired, true);
    });

    QUnit.test('add does not alter arguments', function(assert) {
        assert.expect(2);
        var attrs = {};
        var models = [attrs];
        new joint.mvc.Collection().add(models);
        assert.equal(models.length, 1);
        assert.ok(attrs === models[0]);
    });

    QUnit.test('#574, remove its own reference to the .models array.', function(assert) {
        assert.expect(2);
        var collection = new joint.mvc.Collection([
            { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }
        ]);
        assert.equal(collection.length, 6);
        collection.remove(collection.models);
        assert.equal(collection.length, 0);
    });

    QUnit.test('#861, adding models to a collection which do not pass validation, with validate:true', function(assert) {
        assert.expect(2);
        var Model = joint.mvc.Model.extend({
            validate: function(attrs) {
                if (attrs.id === 3) return 'id can\'t be 3';
            }
        });

        var Collection = joint.mvc.Collection.extend({
            model: Model
        });

        var collection = new Collection;
        collection.on('invalid', function() { assert.ok(true); });

        collection.add([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }], { validate: true });
        assert.deepEqual(collection.map((model) => model.get('id')), [1, 2, 4, 5, 6]);
    });

    QUnit.test('Invalid models are discarded with validate:true.', function(assert) {
        assert.expect(5);
        var collection = new joint.mvc.Collection;
        collection.on('test', function() { assert.ok(true); });
        collection.model = joint.mvc.Model.extend({
            validate: function(attrs){ if (!attrs.valid) return 'invalid'; }
        });
        var model = new collection.model({ id: 1, valid: true });
        collection.add([model, { id: 2 }], { validate: true });
        model.trigger('test');
        assert.ok(collection.get(model.cid));
        assert.ok(collection.get(1));
        assert.ok(!collection.get(2));
        assert.equal(collection.length, 1);
    });

    QUnit.test('multiple copies of the same model', function(assert) {
        assert.expect(3);
        var collection = new joint.mvc.Collection();
        var model = new joint.mvc.Model();
        collection.add([model, model]);
        assert.equal(collection.length, 1);
        collection.add([{ id: 1 }, { id: 1 }]);
        assert.equal(collection.length, 2);
        assert.equal(collection.last().id, 1);
    });

    QUnit.test('#964 - collection.get return inconsistent', function(assert) {
        assert.expect(2);
        var collection = new joint.mvc.Collection();
        assert.ok(collection.get(null) === undefined);
        assert.ok(collection.get() === undefined);
    });

    QUnit.test('#1112 - passing options.model sets collection.model', function(assert) {
        assert.expect(2);
        var Model = joint.mvc.Model.extend({});
        var collection = new joint.mvc.Collection([{ id: 1 }], { model: Model });
        assert.ok(collection.model === Model);
        assert.ok(collection.at(0) instanceof Model);
    });

    QUnit.test('null and undefined are invalid ids.', function(assert) {
        assert.expect(2);
        var model = new joint.mvc.Model({ id: 1 });
        var collection = new joint.mvc.Collection([model]);
        model.set({ id: null });
        assert.ok(!collection.get('null'));
        model.set({ id: 1 });
        model.set({ id: undefined });
        assert.ok(!collection.get('undefined'));
    });

    QUnit.test('falsy comparator', function(assert) {
        assert.expect(4);
        var Col = joint.mvc.Collection.extend({
            comparator: function(model){ return model.id; }
        });
        var collection = new Col();
        var colFalse = new Col(null, { comparator: false });
        var colNull = new Col(null, { comparator: null });
        var colUndefined = new Col(null, { comparator: undefined });
        assert.ok(collection.comparator);
        assert.ok(!colFalse.comparator);
        assert.ok(!colNull.comparator);
        assert.ok(colUndefined.comparator);
    });

    QUnit.test('#1448 - add sorts collection after merge.', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection([
            { id: 1, x: 1 },
            { id: 2, x: 2 }
        ]);
        collection.comparator = function(model){ return model.get('x'); };
        collection.add({ id: 1, x: 3 }, { merge: true });
        assert.deepEqual(collection.map((model) => model.get('id')), [2, 1]);
    });

    QUnit.test('#1655 - sortBy can be used with a string argument.', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection([{ x: 3 }, { x: 1 }, { x: 2 }]);
        var values = _.map(collection.sortBy('x'), function(model) {
            return model.get('x');
        });
        assert.deepEqual(values, [1, 2, 3]);
    });

    QUnit.test('#1638 - `sort` during `add` triggers correctly.', function(assert) {
        var collection = new joint.mvc.Collection;
        collection.comparator = function(model) { return model.get('x'); };
        var added = [];
        collection.on('add', function(model) {
            model.set({ x: 3 });
            collection.sort();
            added.push(model.id);
        });
        collection.add([{ id: 1, x: 1 }, { id: 2, x: 2 }]);
        assert.deepEqual(added, [1, 2]);
    });

    QUnit.test('`sort` shouldn\'t always fire on `add`', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection([{ id: 1 }, { id: 2 }, { id: 3 }], {
            comparator: 'id'
        });
        collection.sort = function(){ assert.ok(true); };
        collection.add([]);
        collection.add({ id: 1 });
        collection.add([{ id: 2 }, { id: 3 }]);
        collection.add({ id: 4 });
    });

    QUnit.test('Reset includes previous models in triggered event.', function(assert) {
        assert.expect(1);
        var model = new joint.mvc.Model();
        var collection = new joint.mvc.Collection([model]);
        collection.on('reset', function(coll, options) {
            assert.deepEqual(options.previousModels, [model]);
        });
        collection.reset([]);
    });

    QUnit.test('set', function(assert) {
        var m1 = new joint.mvc.Model();
        var m2 = new joint.mvc.Model({ id: 2 });
        var m3 = new joint.mvc.Model();
        var collection = new joint.mvc.Collection([m1, m2]);

        // Test add/change/remove events
        collection.on('add', function(model) {
            assert.strictEqual(model, m3);
        });
        collection.on('change', function(model) {
            assert.strictEqual(model, m2);
        });
        collection.on('remove', function(model) {
            assert.strictEqual(model, m1);
        });

        // remove: false doesn't remove any models
        collection.set([], { remove: false });
        assert.strictEqual(collection.length, 2);

        // add: false doesn't add any models
        collection.set([m1, m2, m3], { add: false });
        assert.strictEqual(collection.length, 2);

        // merge: false doesn't change any models
        collection.set([m1, { id: 2, a: 1 }], { merge: false });
        assert.strictEqual(m2.get('a'), void 0);

        // add: false, remove: false only merges existing models
        collection.set([m1, { id: 2, a: 0 }, m3, { id: 4 }], { add: false, remove: false });
        assert.strictEqual(collection.length, 2);
        assert.strictEqual(m2.get('a'), 0);

        // default options add/remove/merge as appropriate
        collection.set([{ id: 2, a: 1 }, m3]);
        assert.strictEqual(collection.length, 2);
        assert.strictEqual(m2.get('a'), 1);

        // Test removing models not passing an argument
        collection.off('remove').on('remove', function(model) {
            assert.ok(model === m2 || model === m3);
        });
        collection.set([]);
        assert.strictEqual(collection.length, 0);

        // Test null models on set doesn't clear collection
        collection.off();
        collection.set([{ id: 1 }]);
        collection.set();
        assert.strictEqual(collection.length, 1);
    });

    QUnit.test('set with only cids', function(assert) {
        assert.expect(3);
        var m1 = new joint.mvc.Model;
        var m2 = new joint.mvc.Model;
        var collection = new joint.mvc.Collection;
        collection.set([m1, m2]);
        assert.equal(collection.length, 2);
        collection.set([m1]);
        assert.equal(collection.length, 1);
        collection.set([m1, m1, m1, m2, m2], { remove: false });
        assert.equal(collection.length, 2);
    });

    QUnit.test('set with only idAttribute', function(assert) {
        assert.expect(3);
        var m1 = { _id: 1 };
        var m2 = { _id: 2 };
        var Col = joint.mvc.Collection.extend({
            model: joint.mvc.Model.extend({
                idAttribute: '_id'
            })
        });
        var collection = new Col;
        collection.set([m1, m2]);
        assert.equal(collection.length, 2);
        collection.set([m1]);
        assert.equal(collection.length, 1);
        collection.set([m1, m1, m1, m2, m2], { remove: false });
        assert.equal(collection.length, 2);
    });

    QUnit.test('set + merge with default values defined', function(assert) {
        var Model = joint.mvc.Model.extend({
            defaults: {
                key: 'value'
            }
        });
        var m = new Model({ id: 1 });
        var collection = new joint.mvc.Collection([m], { model: Model });
        assert.equal(collection.first().get('key'), 'value');

        collection.set({ id: 1, key: 'other' });
        assert.equal(collection.first().get('key'), 'other');

        collection.set({ id: 1, other: 'value' });
        assert.equal(collection.first().get('key'), 'other');
        assert.equal(collection.length, 1);
    });

    QUnit.test('merge without mutation', function(assert) {
        var Model = joint.mvc.Model.extend({
            initialize: function(attrs, options) {
                if (attrs.child) {
                    this.set('child', new Model(attrs.child, options), options);
                }
            }
        });
        var Collection = joint.mvc.Collection.extend({ model: Model });
        var data = [{ id: 1, child: { id: 2 }}];
        var collection = new Collection(data);
        assert.equal(collection.first().id, 1);
        collection.set(data);
        assert.equal(collection.first().id, 1);
        collection.set([{ id: 2, child: { id: 2 }}].concat(data));
        assert.deepEqual(collection.map((model) => model.get('id')), [2, 1]);
    });

    QUnit.test('`set` matches input order in the absence of a comparator', function(assert) {
        var one = new joint.mvc.Model({ id: 1 });
        var two = new joint.mvc.Model({ id: 2 });
        var three = new joint.mvc.Model({ id: 3 });
        var collection = new joint.mvc.Collection([one, two, three]);
        collection.set([{ id: 3 }, { id: 2 }, { id: 1 }]);
        assert.deepEqual(collection.models, [three, two, one]);
        collection.set([{ id: 1 }, { id: 2 }]);
        assert.deepEqual(collection.models, [one, two]);
        collection.set([two, three, one]);
        assert.deepEqual(collection.models, [two, three, one]);
        collection.set([{ id: 1 }, { id: 2 }], { remove: false });
        assert.deepEqual(collection.models, [two, three, one]);
        collection.set([{ id: 1 }, { id: 2 }, { id: 3 }], { merge: false });
        assert.deepEqual(collection.models, [one, two, three]);
        collection.set([three, two, one, { id: 4 }], { add: false });
        assert.deepEqual(collection.models, [one, two, three]);
    });

    QUnit.test('#1894 - Push should not trigger a sort', function(assert) {
        assert.expect(0);
        var Collection = joint.mvc.Collection.extend({
            comparator: 'id',
            sort: function() { assert.ok(false); }
        });
        new Collection().push({ id: 1 });
    });

    QUnit.test('#2428 - push duplicate models, return the correct one', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection;
        var model1 = collection.push({ id: 101 });
        var model2 = collection.push({ id: 101 });
        assert.ok(model2.cid === model1.cid);
    });

    QUnit.test('`set` with non-normal id', function(assert) {
        var Collection = joint.mvc.Collection.extend({
            model: joint.mvc.Model.extend({ idAttribute: '_id' })
        });
        var collection = new Collection({ _id: 1 });
        collection.set([{ _id: 1, a: 1 }], { add: false });
        assert.equal(collection.first().get('a'), 1);
    });

    QUnit.test('#1894 - `sort` can optionally be turned off', function(assert) {
        assert.expect(0);
        var Collection = joint.mvc.Collection.extend({
            comparator: 'id',
            sort: function() { assert.ok(false); }
        });
        new Collection().add({ id: 1 }, { sort: false });
    });

    QUnit.test('`add` only `sort`s when necessary', function(assert) {
        assert.expect(2);
        var collection = new (joint.mvc.Collection.extend({
            comparator: 'a'
        }))([{ id: 1 }, { id: 2 }, { id: 3 }]);
        collection.on('sort', function() { assert.ok(true); });
        collection.add({ id: 4 }); // do sort, new model
        collection.add({ id: 1, a: 1 }, { merge: true }); // do sort, comparator change
        collection.add({ id: 1, b: 1 }, { merge: true }); // don't sort, no comparator change
        collection.add({ id: 1, a: 1 }, { merge: true }); // don't sort, no comparator change
        collection.add(collection.models); // don't sort, nothing new
        collection.add(collection.models, { merge: true }); // don't sort
    });

    QUnit.test('`add` only `sort`s when necessary with comparator function', function(assert) {
        assert.expect(3);
        var collection = new (joint.mvc.Collection.extend({
            comparator: function(m1, m2) {
                return m1.get('a') > m2.get('a') ? 1 : m1.get('a') < m2.get('a') ? -1 : 0;
            }
        }))([{ id: 1 }, { id: 2 }, { id: 3 }]);
        collection.on('sort', function() { assert.ok(true); });
        collection.add({ id: 4 }); // do sort, new model
        collection.add({ id: 1, a: 1 }, { merge: true }); // do sort, model change
        collection.add({ id: 1, b: 1 }, { merge: true }); // do sort, model change
        collection.add({ id: 1, a: 1 }, { merge: true }); // don't sort, no model change
        collection.add(collection.models); // don't sort, nothing new
        collection.add(collection.models, { merge: true }); // don't sort
    });

    QUnit.test('Attach options to collection.', function(assert) {
        assert.expect(2);
        var Model = joint.mvc.Model;
        var comparator = function(){};

        var collection = new joint.mvc.Collection([], {
            model: Model,
            comparator: comparator
        });

        assert.ok(collection.model === Model);
        assert.ok(collection.comparator === comparator);
    });

    QUnit.test('Pass falsey for `models` for empty Col with `options`', function(assert) {
        assert.expect(9);
        var opts = { a: 1, b: 2 };
        _.forEach([undefined, null, false], function(falsey) {
            var Collection = joint.mvc.Collection.extend({
                initialize: function(models, options) {
                    assert.strictEqual(models, falsey);
                    assert.strictEqual(options, opts);
                }
            });

            var collection = new Collection(falsey, opts);
            assert.strictEqual(collection.length, 0);
        });
    });

    QUnit.test('`add` overrides `set` flags', function(assert) {
        var collection = new joint.mvc.Collection();
        collection.once('add', function(model, coll, options) {
            coll.add({ id: 2 }, options);
        });
        collection.set({ id: 1 });
        assert.equal(collection.length, 2);
    });

    QUnit.test('_addReference binds all collection events & adds to the lookup hashes', function(assert) {
        assert.expect(8);

        var calls = { add: 0, remove: 0 };

        var Collection = joint.mvc.Collection.extend({

            _addReference: function(model) {
                joint.mvc.Collection.prototype._addReference.apply(this, arguments);
                calls.add++;
                assert.equal(model, this._byId[model.id]);
                assert.equal(model, this._byId[model.cid]);
                assert.equal(model._events.all.length, 1);
            },

            _removeReference: function(model) {
                joint.mvc.Collection.prototype._removeReference.apply(this, arguments);
                calls.remove++;
                assert.equal(this._byId[model.id], void 0);
                assert.equal(this._byId[model.cid], void 0);
                assert.equal(model.collection, void 0);
            }

        });

        var collection = new Collection();
        var model = collection.add({ id: 1 });
        collection.remove(model);

        assert.equal(calls.add, 1);
        assert.equal(calls.remove, 1);
    });

    QUnit.test('Do not allow duplicate models to be `add`ed or `set`', function(assert) {
        var collection = new joint.mvc.Collection();

        collection.add([{ id: 1 }, { id: 1 }]);
        assert.equal(collection.length, 1);
        assert.equal(collection.models.length, 1);

        collection.set([{ id: 1 }, { id: 1 }]);
        assert.equal(collection.length, 1);
        assert.equal(collection.models.length, 1);
    });

    QUnit.test('#3020: #set with {add: false} should not throw.', function(assert) {
        assert.expect(2);
        var collection = new joint.mvc.Collection;
        collection.set([{ id: 1 }], { add: false });
        assert.strictEqual(collection.length, 0);
        assert.strictEqual(collection.models.length, 0);
    });

    // QUnit.test('create with wait, model instance, #3028', function(assert) {
    //     assert.expect(1);
    //     var collection = new joint.mvc.Collection();
    //     var model = new joint.mvc.Model({ id: 1 });
    //     model.sync = function(){
    //         assert.equal(this.collection, collection);
    //     };
    //     collection.create(model, { wait: true });
    // });

    QUnit.test('modelId', function(assert) {
        var Stooge = joint.mvc.Model.extend();
        var StoogeCollection = joint.mvc.Collection.extend();

        // Default to using `id` if `model::idAttribute` and `Collection::model::idAttribute` not present.
        assert.equal(StoogeCollection.prototype.modelId({ id: 1 }), 1);

        // Default to using `model::idAttribute` if present.
        Stooge.prototype.idAttribute = '_id';
        var model = new Stooge({ _id: 1 });
        assert.equal(StoogeCollection.prototype.modelId(model.attributes, model.idAttribute), 1);

        // Default to using `Collection::model::idAttribute` if model::idAttribute not present.
        StoogeCollection.prototype.model = Stooge;
        assert.equal(StoogeCollection.prototype.modelId({ _id: 1 }), 1);

    });

    QUnit.test('Polymorphic models work with "simple" constructors', function(assert) {
        var A = joint.mvc.Model.extend();
        var B = joint.mvc.Model.extend();
        var C = joint.mvc.Collection.extend({
            model: function(attrs) {
                return attrs.type === 'a' ? new A(attrs) : new B(attrs);
            }
        });
        var collection = new C([{ id: 1, type: 'a' }, { id: 2, type: 'b' }]);
        assert.equal(collection.length, 2);
        assert.ok(collection.at(0) instanceof A);
        assert.equal(collection.at(0).id, 1);
        assert.ok(collection.at(1) instanceof B);
        assert.equal(collection.at(1).id, 2);
    });

    QUnit.test('Polymorphic models work with "advanced" constructors', function(assert) {
        var A = joint.mvc.Model.extend({ idAttribute: '_id' });
        var B = joint.mvc.Model.extend({ idAttribute: '_id' });
        var C = joint.mvc.Collection.extend({
            model: joint.mvc.Model.extend({
                constructor: function(attrs) {
                    return attrs.type === 'a' ? new A(attrs) : new B(attrs);
                },

                idAttribute: '_id'
            })
        });
        var collection = new C([{ _id: 1, type: 'a' }, { _id: 2, type: 'b' }]);
        assert.equal(collection.length, 2);
        assert.ok(collection.at(0) instanceof A);
        assert.equal(collection.at(0), collection.get(1));
        assert.ok(collection.at(1) instanceof B);
        assert.equal(collection.at(1), collection.get(2));

        C = joint.mvc.Collection.extend({
            model: function(attrs) {
                return attrs.type === 'a' ? new A(attrs) : new B(attrs);
            },

            modelId: function(attrs) {
                return attrs.type + '-' + attrs.id;
            }
        });
        collection = new C([{ id: 1, type: 'a' }, { id: 1, type: 'b' }]);
        assert.equal(collection.length, 2);
        assert.ok(collection.at(0) instanceof A);
        assert.equal(collection.at(0), collection.get('a-1'));
        assert.ok(collection.at(1) instanceof B);
        assert.equal(collection.at(1), collection.get('b-1'));
    });

    QUnit.test('Collection with polymorphic models receives id from modelId using model instance idAttribute', function(assert) {
        assert.expect(6);
        // When the polymorphic models use 'id' for the idAttribute, all is fine.
        var C1 = joint.mvc.Collection.extend({
            model: function(attrs) {
                return new joint.mvc.Model(attrs);
            }
        });
        var c1 = new C1({ id: 1 });
        assert.equal(c1.get(1).id, 1);
        assert.equal(c1.modelId({ id: 1 }), 1);

        // If the polymorphic models define their own idAttribute,
        // the modelId method will use the model's idAttribute property before the
        // collection's model constructor's.
        var M = joint.mvc.Model.extend({
            idAttribute: '_id'
        });
        var C2 = joint.mvc.Collection.extend({
            model: function(attrs) {
                return new M(attrs);
            }
        });
        var c2 = new C2({ _id: 1 });
        assert.equal(c2.get(1), c2.at(0));
        assert.equal(c2.modelId(c2.at(0).attributes, c2.at(0).idAttribute), 1);
        var m = new M({ _id: 2 });
        c2.add(m);
        assert.equal(c2.get(2), m);
        assert.equal(c2.modelId(m.attributes, m.idAttribute), 2);
    });

    QUnit.test('Collection implements Iterable, values is default iterator function', function(assert) {
        var $$iterator = typeof Symbol === 'function' && Symbol.iterator;
        // This test only applies to environments which define Symbol.iterator.
        if (!$$iterator) {
            assert.expect(0);
            return;
        }
        assert.expect(2);
        var collection = new joint.mvc.Collection([]);
        assert.strictEqual(collection[$$iterator], collection.values);
        var iterator = collection[$$iterator]();
        assert.deepEqual(iterator.next(), { value: void 0, done: true });
    });

    QUnit.test('Collection.values iterates models in sorted order', function(assert) {
        assert.expect(4);
        var one = new joint.mvc.Model({ id: 1 });
        var two = new joint.mvc.Model({ id: 2 });
        var three = new joint.mvc.Model({ id: 3 });
        var collection = new joint.mvc.Collection([one, two, three]);
        var iterator = collection.values();
        assert.strictEqual(iterator.next().value, one);
        assert.strictEqual(iterator.next().value, two);
        assert.strictEqual(iterator.next().value, three);
        assert.strictEqual(iterator.next().value, void 0);
    });

    QUnit.test('Collection.keys iterates ids in sorted order', function(assert) {
        assert.expect(4);
        var one = new joint.mvc.Model({ id: 1 });
        var two = new joint.mvc.Model({ id: 2 });
        var three = new joint.mvc.Model({ id: 3 });
        var collection = new joint.mvc.Collection([one, two, three]);
        var iterator = collection.keys();
        assert.strictEqual(iterator.next().value, 1);
        assert.strictEqual(iterator.next().value, 2);
        assert.strictEqual(iterator.next().value, 3);
        assert.strictEqual(iterator.next().value, void 0);
    });

    QUnit.test('Collection.entries iterates ids and models in sorted order', function(assert) {
        assert.expect(4);
        var one = new joint.mvc.Model({ id: 1 });
        var two = new joint.mvc.Model({ id: 2 });
        var three = new joint.mvc.Model({ id: 3 });
        var collection = new joint.mvc.Collection([one, two, three]);
        var iterator = collection.entries();
        assert.deepEqual(iterator.next().value, [1, one]);
        assert.deepEqual(iterator.next().value, [2, two]);
        assert.deepEqual(iterator.next().value, [3, three]);
        assert.strictEqual(iterator.next().value, void 0);
    });

    QUnit.test('#3039 #3951: adding at index fires with correct at', function(assert) {
        assert.expect(4);
        var collection = new joint.mvc.Collection([{ val: 0 }, { val: 4 }]);
        collection.on('add', function(model, coll, options) {
            assert.equal(model.get('val'), options.index);
        });
        collection.add([{ val: 1 }, { val: 2 }, { val: 3 }], { at: 1 });
        collection.add({ val: 5 }, { at: 10 });
    });

    QUnit.test('#3039: index is not sent when at is not specified', function(assert) {
        assert.expect(2);
        var collection = new joint.mvc.Collection([{ at: 0 }]);
        collection.on('add', function(model, coll, options) {
            assert.equal(undefined, options.index);
        });
        collection.add([{ at: 1 }, { at: 2 }]);
    });

    QUnit.test('#3199 - Order changing should trigger a sort', function(assert) {
        assert.expect(1);
        var one = new joint.mvc.Model({ id: 1 });
        var two = new joint.mvc.Model({ id: 2 });
        var three = new joint.mvc.Model({ id: 3 });
        var collection = new joint.mvc.Collection([one, two, three]);
        collection.on('sort', function() {
            assert.ok(true);
        });
        collection.set([{ id: 3 }, { id: 2 }, { id: 1 }]);
    });

    QUnit.test('#3199 - Adding a model should trigger a sort', function(assert) {
        assert.expect(1);
        var one = new joint.mvc.Model({ id: 1 });
        var two = new joint.mvc.Model({ id: 2 });
        var three = new joint.mvc.Model({ id: 3 });
        var collection = new joint.mvc.Collection([one, two, three]);
        collection.on('sort', function() {
            assert.ok(true);
        });
        collection.set([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 0 }]);
    });

    QUnit.test('#3199 - Order not changing should not trigger a sort', function(assert) {
        assert.expect(0);
        var one = new joint.mvc.Model({ id: 1 });
        var two = new joint.mvc.Model({ id: 2 });
        var three = new joint.mvc.Model({ id: 3 });
        var collection = new joint.mvc.Collection([one, two, three]);
        collection.on('sort', function() {
            assert.ok(false);
        });
        collection.set([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    QUnit.test('add supports negative indexes', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection([{ id: 1 }]);
        collection.add([{ id: 2 }, { id: 3 }], { at: -1 });
        collection.add([{ id: 2.5 }], { at: -2 });
        collection.add([{ id: 0.5 }], { at: -6 });
        assert.equal(collection.map((model) => model.get('id')).join(','), '0.5,1,2,2.5,3');
    });

    QUnit.test('#set accepts options.at as a string', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection([{ id: 1 }, { id: 2 }]);
        collection.add([{ id: 3 }], { at: '1' });
        assert.deepEqual(collection.map((model) => model.get('id')), [1, 3, 2]);
    });

    QUnit.test('adding multiple models triggers `update` event once', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection;
        collection.on('update', function() { assert.ok(true); });
        collection.add([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    QUnit.test('removing models triggers `update` event once', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection([{ id: 1 }, { id: 2 }, { id: 3 }]);
        collection.on('update', function() { assert.ok(true); });
        collection.remove([{ id: 1 }, { id: 2 }]);
    });

    QUnit.test('remove does not trigger `update` when nothing removed', function(assert) {
        assert.expect(0);
        var collection = new joint.mvc.Collection([{ id: 1 }, { id: 2 }]);
        collection.on('update', function() { assert.ok(false); });
        collection.remove([{ id: 3 }]);
    });

    QUnit.test('set triggers `set` event once', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection([{ id: 1 }, { id: 2 }]);
        collection.on('update', function() { assert.ok(true); });
        collection.set([{ id: 1 }, { id: 3 }]);
    });

    QUnit.test('set does not trigger `update` event when nothing added nor removed', function(assert) {
        var collection = new joint.mvc.Collection([{ id: 1 }, { id: 2 }]);
        collection.on('update', function(coll, options) {
            assert.equal(options.changes.added.length, 0);
            assert.equal(options.changes.removed.length, 0);
            assert.equal(options.changes.merged.length, 2);
        });
        collection.set([{ id: 1 }, { id: 2 }]);
    });

    QUnit.test('#3662 - triggering change without model will not error', function(assert) {
        assert.expect(1);
        var collection = new joint.mvc.Collection([{ id: 1 }]);
        var model = collection.first();
        collection.on('change', function(m) {
            assert.equal(m, undefined);
        });
        model.trigger('change');
    });

    QUnit.test('#3711 - remove\'s `update` event returns one removed model', function(assert) {
        var model = new joint.mvc.Model({ id: 1, title: 'First Post' });
        var collection = new joint.mvc.Collection([model]);
        collection.on('update', function(context, options) {
            var changed = options.changes;
            assert.deepEqual(changed.added, []);
            assert.deepEqual(changed.merged, []);
            assert.strictEqual(changed.removed[0], model);
        });
        collection.remove(model);
    });

    QUnit.test('#3711 - remove\'s `update` event returns multiple removed models', function(assert) {
        var model = new joint.mvc.Model({ id: 1, title: 'First Post' });
        var model2 = new joint.mvc.Model({ id: 2, title: 'Second Post' });
        var collection = new joint.mvc.Collection([model, model2]);
        collection.on('update', function(context, options) {
            var changed = options.changes;
            assert.deepEqual(changed.added, []);
            assert.deepEqual(changed.merged, []);
            assert.ok(changed.removed.length === 2);

            assert.ok(_.indexOf(changed.removed, model) > -1 && _.indexOf(changed.removed, model2) > -1);
        });
        collection.remove([model, model2]);
    });

    QUnit.test('#3711 - set\'s `update` event returns one added model', function(assert) {
        var model = new joint.mvc.Model({ id: 1, title: 'First Post' });
        var collection = new joint.mvc.Collection();
        collection.on('update', function(context, options) {
            var addedModels = options.changes.added;
            assert.ok(addedModels.length === 1);
            assert.strictEqual(addedModels[0], model);
        });
        collection.set(model);
    });

    QUnit.test('#3711 - set\'s `update` event returns multiple added models', function(assert) {
        var model = new joint.mvc.Model({ id: 1, title: 'First Post' });
        var model2 = new joint.mvc.Model({ id: 2, title: 'Second Post' });
        var collection = new joint.mvc.Collection();
        collection.on('update', function(context, options) {
            var addedModels = options.changes.added;
            assert.ok(addedModels.length === 2);
            assert.strictEqual(addedModels[0], model);
            assert.strictEqual(addedModels[1], model2);
        });
        collection.set([model, model2]);
    });

    QUnit.test('#3711 - set\'s `update` event returns one removed model', function(assert) {
        var model = new joint.mvc.Model({ id: 1, title: 'First Post' });
        var model2 = new joint.mvc.Model({ id: 2, title: 'Second Post' });
        var model3 = new joint.mvc.Model({ id: 3, title: 'My Last Post' });
        var collection = new joint.mvc.Collection([model]);
        collection.on('update', function(context, options) {
            var changed = options.changes;
            assert.equal(changed.added.length, 2);
            assert.equal(changed.merged.length, 0);
            assert.ok(changed.removed.length === 1);
            assert.strictEqual(changed.removed[0], model);
        });
        collection.set([model2, model3]);
    });

    QUnit.test('#3711 - set\'s `update` event returns multiple removed models', function(assert) {
        var model = new joint.mvc.Model({ id: 1, title: 'First Post' });
        var model2 = new joint.mvc.Model({ id: 2, title: 'Second Post' });
        var model3 = new joint.mvc.Model({ id: 3, title: 'My Last Post' });
        var collection = new joint.mvc.Collection([model, model2]);
        collection.on('update', function(context, options) {
            var removedModels = options.changes.removed;
            assert.ok(removedModels.length === 2);
            assert.strictEqual(removedModels[0], model);
            assert.strictEqual(removedModels[1], model2);
        });
        collection.set([model3]);
    });

    QUnit.test('#3711 - set\'s `update` event returns one merged model', function(assert) {
        var model = new joint.mvc.Model({ id: 1, title: 'First Post' });
        var model2 = new joint.mvc.Model({ id: 2, title: 'Second Post' });
        var model2Update = new joint.mvc.Model({ id: 2, title: 'Second Post V2' });
        var collection = new joint.mvc.Collection([model, model2]);
        collection.on('update', function(context, options) {
            var mergedModels = options.changes.merged;
            assert.ok(mergedModels.length === 1);
            assert.strictEqual(mergedModels[0].get('title'), model2Update.get('title'));
        });
        collection.set([model2Update]);
    });

    QUnit.test('#3711 - set\'s `update` event returns multiple merged models', function(assert) {
        var model = new joint.mvc.Model({ id: 1, title: 'First Post' });
        var modelUpdate = new joint.mvc.Model({ id: 1, title: 'First Post V2' });
        var model2 = new joint.mvc.Model({ id: 2, title: 'Second Post' });
        var model2Update = new joint.mvc.Model({ id: 2, title: 'Second Post V2' });
        var collection = new joint.mvc.Collection([model, model2]);
        collection.on('update', function(context, options) {
            var mergedModels = options.changes.merged;
            assert.ok(mergedModels.length === 2);
            assert.strictEqual(mergedModels[0].get('title'), model2Update.get('title'));
            assert.strictEqual(mergedModels[1].get('title'), modelUpdate.get('title'));
        });
        collection.set([model2Update, modelUpdate]);
    });

    QUnit.test('#3711 - set\'s `update` event should not be triggered adding a model which already exists exactly alike', function(assert) {
        var fired = false;
        var model = new joint.mvc.Model({ id: 1, title: 'First Post' });
        var collection = new joint.mvc.Collection([model]);
        collection.on('update', function(context, options) {
            fired = true;
        });
        collection.set([model]);
        assert.equal(fired, false);
    });

    QUnit.test('get models with `attributes` key', function(assert) {
        var model = { id: 1, attributes: {}};
        var collection = new joint.mvc.Collection([model]);
        assert.ok(collection.get(model));
    });

    QUnit.test('#3961 - add events sends options.index that correspond to wrong index', function(assert) {
        var models = _.each(['a', 'b', 'c', 'd'], function(val) {
            return new joint.mvc.Model({ id: val });
        });
        var collection = new joint.mvc.Collection(models);
        models.shift(); // remove first element;
        models.push(new joint.mvc.Model({ id: 'e' }));
        collection.on('add', function(model, coll, options){
            assert.equal(options.index, undefined);
        });
        collection.set(models);
    });

    QUnit.test('#4233 - can instantiate new model in ES class Collection', function(assert) {
        var model;
        try {
            model = new Function('return ({\n' +
          '    model(attrs, options) {\n' +
          '        var MyModel = joint.mvc.Model.extend({});\n' +
          '        return new MyModel(attrs, options);\n' +
          '    }\n' +
          '}).model')();
        } catch (error) {
            model = error;
        }

        if (model instanceof SyntaxError) {
            assert.expect(0);
            return;
        }

        assert.expect(1);

        var MyCollection = joint.mvc.Collection.extend({
            modelId: function(attr) {
                return attr.x;
            },

            model: model
        });

        var instance = new MyCollection([{ a: 2 }]);

        assert.ok(instance, 'Should instantiate collection with model');
    });

});
